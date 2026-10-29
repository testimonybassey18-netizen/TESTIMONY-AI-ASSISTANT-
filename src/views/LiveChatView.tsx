import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
  VolumeX,
  Brain,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Settings2,
  Play,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Flame,
  User,
  Bot
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import {
  globalVoicePlayer,
  VoiceName
} from '../services/geminiService';
import { loadUserMemory } from '../services/memoryService';
import { MemoryModal } from '../components/MemoryModal';

interface LiveChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, toolContext?: string, attachments?: ChatAttachment[]) => void;
  onNavigateToStandardChat: () => void;
  isLoading: boolean;
  freeMessagesRemaining: number;
  isPro: boolean;
}

type ConversationPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  messages,
  onSendMessage,
  onNavigateToStandardChat,
  isLoading,
  freeMessagesRemaining,
  isPro,
}) => {
  // Session State
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<ConversationPhase>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Live Speech Subtitles
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastUserSpokenText, setLastUserSpokenText] = useState<string>('');
  const [lastAssistantSpokenText, setLastAssistantSpokenText] = useState<string>('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Audio Visualizer Volume Level (0 - 100)
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Voice Persona
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Fenrir');
  const [silenceDelayMs, setSilenceDelayMs] = useState<number>(1200); // 1200ms natural conversational pause (prevents cutting off mid-sentence)

  // Memory Modal
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [userMemory, setUserMemory] = useState(loadUserMemory());

  // Refs for audio hardware and speech engine
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const speechRecognitionRef = useRef<any>(null);
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const lastProcessedMsgIdRef = useRef<string | null>(null);
  const sessionActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const phaseRef = useRef<ConversationPhase>('idle');
  const audioLevelRef = useRef<number>(0);

  // Keep refs in sync with state for callbacks
  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setUserMemory(loadUserMemory());
  }, [messages, isMemoryModalOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endLiveSession();
    };
  }, []);

  // Update assistant text when new message arrives and trigger speech
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (
      lastMsg.role === 'assistant' &&
      !isLoading &&
      isSessionActive &&
      lastMsg.id !== lastProcessedMsgIdRef.current
    ) {
      lastProcessedMsgIdRef.current = lastMsg.id;
      setLastAssistantSpokenText(lastMsg.content);
      speakAssistantReply(lastMsg.content);
    }
  }, [messages, isLoading, isSessionActive]);

  // When isLoading transitions to true from parent
  useEffect(() => {
    if (isLoading && isSessionActive) {
      setPhase('thinking');
    }
  }, [isLoading, isSessionActive]);

  // 1. Audio Level Analyzer (Web Audio API)
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current || !sessionActiveRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        audioLevelRef.current = normalized;

        if (phaseRef.current === 'listening' && !isMutedRef.current) {
          setAudioLevel(normalized);
        } else if (phaseRef.current === 'speaking') {
          // Subtle visual rhythm pulse when speaking
          setAudioLevel(Math.floor(25 + Math.random() * 35));
        } else {
          setAudioLevel(0);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Audio analyzer could not initialize:', err);
    }
  };

  const teardownAudioAnalyzer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // 2. Start Microphone Stream with Auto Gain Control for distance talking
  const getMicrophoneStream = async (): Promise<MediaStream | null> => {
    if (mediaStreamRef.current && mediaStreamRef.current.active) {
      return mediaStreamRef.current;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setSpeechError('Microphone is not supported in this browser.');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Amplifies voice from a distance across the room!
        },
      });
      mediaStreamRef.current = stream;
      setupAudioAnalyzer(stream);
      return stream;
    } catch (err: any) {
      console.warn('Microphone access denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError('Microphone permission denied. Please allow microphone access in your address bar.');
      } else {
        setSpeechError('Microphone error: ' + (err.message || 'Please check device permissions.'));
      }
      return null;
    }
  };

  // 3. Hands-Free Speech Recognition Loop
  const startSpeechRecognition = useCallback(() => {
    if (!sessionActiveRef.current || isMutedRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Voice recognition is not natively supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Stop and unbind existing instance safely
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.abort();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setPhase('listening');
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        if (!sessionActiveRef.current || phaseRef.current === 'thinking') {
          return;
        }

        let interimText = '';
        let finalizedText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalizedText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        // Voice barge-in: If AI is speaking and user says real words, stop AI and listen cleanly
        if (phaseRef.current === 'speaking' && (finalizedText.trim().length > 1 || interimText.trim().length > 2)) {
          globalVoicePlayer.stop();
          setPhase('listening');
          phaseRef.current = 'listening';
        }

        const combinedCurrent = (accumulatedSpeechRef.current + ' ' + finalizedText + ' ' + interimText)
          .replace(/\s+/g, ' ')
          .trim();

        if (finalizedText) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + finalizedText).trim();
        }

        if (combinedCurrent) {
          setInterimTranscript(combinedCurrent);

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          // Smart conversational pause: Wait for silenceDelayMs (1200ms default).
          // If the user is actively vocalizing or breathing (audioLevelRef.current > 20),
          // extend the timer so they are NEVER cut off mid-speech when talking for a while!
          silenceTimerRef.current = setTimeout(() => {
            if (audioLevelRef.current > 20) {
              silenceTimerRef.current = setTimeout(() => {
                handleAutoCommitSpeech();
              }, 450);
              return;
            }
            handleAutoCommitSpeech();
          }, silenceDelayMs);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('Live SpeechRecognition notice:', event.error);
        if (event.error === 'network' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (sessionActiveRef.current && phaseRef.current === 'listening' && !isMutedRef.current) {
              startSpeechRecognition();
            }
          }, 400);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Cleanly recreate recognition if still in listening mode
        if (
          sessionActiveRef.current &&
          phaseRef.current === 'listening' &&
          !isMutedRef.current
        ) {
          setTimeout(() => {
            if (sessionActiveRef.current && phaseRef.current === 'listening' && !isMutedRef.current) {
              startSpeechRecognition();
            }
          }, 80);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition initialization error:', err);
    }
  }, [silenceDelayMs]);

  // Heartbeat Watchdog: ensures voice listening never freezes or dies silently!
  useEffect(() => {
    if (!isSessionActive) return;

    const watchdog = setInterval(() => {
      if (!sessionActiveRef.current) return;

      // If supposed to be listening, but recognition stopped, revive it
      if (phaseRef.current === 'listening' && !isListeningRef.current && !isMutedRef.current) {
        console.warn('Watchdog detected stopped recognition; restarting...');
        startSpeechRecognition();
      }

      // If stuck in thinking mode for over 18s (hung network), rescue back to listening
      if (phaseRef.current === 'thinking' && !isLoading) {
        console.warn('Watchdog detected hung thinking state; rescuing to listening...');
        setPhase('listening');
        startSpeechRecognition();
      }
    }, 2500);

    return () => clearInterval(watchdog);
  }, [isSessionActive, isLoading, startSpeechRecognition]);

  // 4. Auto-commit detected speech (NO BUTTON CLICKING NEEDED)
  const handleAutoCommitSpeech = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const textToSend = accumulatedSpeechRef.current.trim() || interimTranscript.trim();
    if (!textToSend || textToSend.length < 2) {
      return;
    }

    // Reset accumulated buffer
    accumulatedSpeechRef.current = '';
    setInterimTranscript('');
    setLastUserSpokenText(textToSend);

    // Stop recognition listening while AI is thinking and speaking
    stopSpeechRecognition();
    setPhase('thinking');

    // Trigger AI response with live voice context
    onSendMessage(
      textToSend,
      `Live 1-on-1 Discussion (Live Voice Mode • ${voiceGender.toUpperCase()})`
    );
  };

  const stopSpeechRecognition = () => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
  };

  // 5. Speak AI response out loud, then IMMEDIATELY resume listening in live chat!
  const speakAssistantReply = (text: string) => {
    setPhase('speaking');
    let hasHandledCompletion = false;

    const resumeListening = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;

      if (sessionActiveRef.current) {
        // 250ms buffer to ensure device speakers are silent before re-opening microphone
        setTimeout(() => {
          if (sessionActiveRef.current) {
            setPhase('listening');
            setInterimTranscript('');
            accumulatedSpeechRef.current = '';
            startSpeechRecognition();
          }
        }, 250);
      } else {
        setPhase('idle');
      }
    };

    // Safety watchdog: In case audio playback stalls or silent error occurs, resume listening automatically
    const estimatedSecs = Math.max(6, Math.min(35, Math.ceil(text.length / 14) + 4));
    const safetyTimer = setTimeout(() => {
      if (phaseRef.current === 'speaking' && !hasHandledCompletion) {
        console.warn('Speech playback watchdog triggered; returning to listening.');
        globalVoicePlayer.stop();
        resumeListening();
      }
    }, estimatedSecs * 1000);

    globalVoicePlayer.speak(
      text,
      selectedVoice,
      () => {
        setPhase('speaking');
      },
      () => {
        clearTimeout(safetyTimer);
        resumeListening();
      }
    );
  };

  // 6. User Interrupts Speaking AI (Tap to interrupt like ChatGPT)
  const handleInterruptSpeaking = () => {
    globalVoicePlayer.stop();
    setPhase('listening');
    setInterimTranscript('');
    accumulatedSpeechRef.current = '';
    startSpeechRecognition();
  };

  // 7. Manual Start Live Chat Session
  const startLiveSession = async () => {
    setSpeechError(null);
    setIsSessionActive(true);
    sessionActiveRef.current = true;
    setPhase('listening');
    setInterimTranscript('');
    accumulatedSpeechRef.current = '';

    const stream = await getMicrophoneStream();
    if (!stream) {
      setIsSessionActive(false);
      sessionActiveRef.current = false;
      setPhase('idle');
      return;
    }

    startSpeechRecognition();
  };

  // 8. End Live Chat Session (Hang up)
  const endLiveSession = () => {
    setIsSessionActive(false);
    sessionActiveRef.current = false;
    setPhase('idle');
    setInterimTranscript('');
    accumulatedSpeechRef.current = '';

    stopSpeechRecognition();
    teardownAudioAnalyzer();
    globalVoicePlayer.stop();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      stopSpeechRecognition();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } else if (sessionActiveRef.current && phase === 'listening') {
      startSpeechRecognition();
    }
  };

  // Switch Voice Gender
  const handleGenderChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    if (gender === 'male') {
      setSelectedVoice('Fenrir');
    } else {
      setSelectedVoice('Aoede');
    }
  };

  // Preview selected voice
  const handleTestVoice = () => {
    const sample =
      voiceGender === 'male'
        ? `Hello Testimony! I'm your AI speaking in the ${selectedVoice} male voice. Just speak to me from across the room and I will answer you!`
        : `Hello Testimony! I'm your AI speaking in the ${selectedVoice} female voice. I am ready to talk and discuss anything with you hands-free!`;

    globalVoicePlayer.speak(sample, selectedVoice);
  };

  // Voice Persona lists
  const maleVoices: { name: VoiceName; label: string; desc: string }[] = [
    { name: 'Fenrir', label: 'Fenrir (Deep & Confident)', desc: 'Natural, warm baritone human male' },
    { name: 'Charon', label: 'Charon (Calm & Intellectual)', desc: 'Reflective, clear, reassuring tone' },
    { name: 'Puck', label: 'Puck (Upbeat & Energetic)', desc: 'Friendly, charismatic conversational male' },
  ];

  const femaleVoices: { name: VoiceName; label: string; desc: string }[] = [
    { name: 'Aoede', label: 'Aoede (Warm & Melodic)', desc: 'Empathetic, clear, natural female companion' },
    { name: 'Kore', label: 'Kore (Crisp & Intelligent)', desc: 'Professional, articulate, articulate female' },
    { name: 'Leda', label: 'Leda (Gentle & Inspiring)', desc: 'Warm, thoughtful, soothing female voice' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#070a12] text-slate-100 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER BAR */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToStandardChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            title="Return to standard chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>LIVE CHAT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                Instant Voice
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Voice Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-purple-300">{voiceGender === 'male' ? '👨 Male' : '👩 Female'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{selectedVoice}</span>
          </div>

          {/* User Memory Badge */}
          <button
            onClick={() => setIsMemoryModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition text-xs font-semibold cursor-pointer"
            title="View learned personality memory"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showSettingsDrawer
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Voice & Timing Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {speechError && (
        <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800/80 text-rose-200 text-xs flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONVERSATIONAL STAGE */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 relative overflow-y-auto">
        {!isSessionActive ? (
          /* IDLE SCREEN: TAP TO CONNECT CHATGPT VOICE */
          <div className="text-center max-w-md mx-auto space-y-6 animate-fade-in">
            {/* Big Initial Pulse Orb */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-600/30 via-indigo-600/20 to-purple-600/30 animate-pulse blur-xl" />
              <button
                type="button"
                onClick={startLiveSession}
                className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-1 shadow-[0_0_50px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-slate-950/90 flex flex-col items-center justify-center gap-2 border border-emerald-400/40 group-hover:border-emerald-300">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black tracking-wider text-emerald-300 uppercase">
                    Start Voice
                  </span>
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Live Chat
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Speak directly with Testimony AI. It replies instantly when you finish speaking, corrects you politely if you're wrong, and talks with cool high intelligence.
              </p>
            </div>

            {/* Voice Gender Switcher */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  voiceGender === 'male'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👨 Male Voice</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  voiceGender === 'female'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👩 Female Voice</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestVoice}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 mx-auto transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Current Voice ({selectedVoice})</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE LIVE CHATGPT VOICE CALL */
          <div className="w-full max-w-xl flex flex-col items-center space-y-6">
            {/* Status Indicator Pill */}
            <div className="flex items-center gap-2">
              {phase === 'listening' && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening... Talk freely from a distance</span>
                </div>
              )}
              {phase === 'thinking' && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Testimony AI is thinking...</span>
                </div>
              )}
              {phase === 'speaking' && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Speaking in {selectedVoice} voice (Tap orb to interrupt)</span>
                </div>
              )}
            </div>

            {/* THE CENTRAL GLOWING CONVERSATIONAL ORB (ChatGPT / Gemini Live Style) */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer Ripple 1 */}
              <div
                className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                  phase === 'listening'
                    ? 'bg-emerald-500/20'
                    : phase === 'speaking'
                    ? 'bg-cyan-500/20'
                    : 'bg-purple-500/20'
                }`}
                style={{
                  width: `${200 + audioLevel * 1.5}px`,
                  height: `${200 + audioLevel * 1.5}px`,
                  opacity: phase === 'listening' ? 0.3 + (audioLevel / 100) * 0.7 : 0.4,
                }}
              />

              {/* Outer Ripple 2 */}
              <div
                className={`absolute rounded-full transition-all duration-200 pointer-events-none ${
                  phase === 'listening'
                    ? 'bg-emerald-400/25'
                    : phase === 'speaking'
                    ? 'bg-indigo-400/25'
                    : 'bg-indigo-500/25'
                }`}
                style={{
                  width: `${160 + audioLevel * 1.1}px`,
                  height: `${160 + audioLevel * 1.1}px`,
                  opacity: phase === 'listening' ? 0.4 + (audioLevel / 100) * 0.6 : 0.5,
                }}
              />

              {/* Main Interactive Orb */}
              <button
                type="button"
                onClick={phase === 'speaking' ? handleInterruptSpeaking : undefined}
                className={`relative w-36 h-36 rounded-full flex items-center justify-center p-1 transition-transform duration-200 cursor-pointer select-none ${
                  phase === 'listening'
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] scale-100'
                    : phase === 'thinking'
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-[0_0_50px_rgba(139,92,246,0.5)] animate-spin-slow'
                    : 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-pulse'
                }`}
                title={phase === 'speaking' ? 'Click to interrupt AI speaking' : 'Live Voice Orb'}
              >
                <div className="w-full h-full rounded-full bg-[#080d1a] flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Subtle inner animated wave bars */}
                  <div className="flex items-center gap-1.5 h-10">
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        phase === 'listening'
                          ? 'bg-emerald-400'
                          : phase === 'speaking'
                          ? 'bg-cyan-400'
                          : 'bg-purple-400'
                      }`}
                      style={{
                        height: phase === 'listening' ? `${10 + audioLevel * 0.4}px` : phase === 'speaking' ? '28px' : '8px',
                      }}
                    />
                    <span
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        phase === 'listening'
                          ? 'bg-teal-300'
                          : phase === 'speaking'
                          ? 'bg-indigo-300'
                          : 'bg-purple-300'
                      }`}
                      style={{
                        height: phase === 'listening' ? `${14 + audioLevel * 0.6}px` : phase === 'speaking' ? '36px' : '14px',
                      }}
                    />
                    <span
                      className={`w-2 rounded-full transition-all duration-150 ${
                        phase === 'listening'
                          ? 'bg-emerald-300'
                          : phase === 'speaking'
                          ? 'bg-white'
                          : 'bg-indigo-200'
                      }`}
                      style={{
                        height: phase === 'listening' ? `${18 + audioLevel * 0.7}px` : phase === 'speaking' ? '40px' : '18px',
                      }}
                    />
                    <span
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        phase === 'listening'
                          ? 'bg-teal-300'
                          : phase === 'speaking'
                          ? 'bg-indigo-300'
                          : 'bg-purple-300'
                      }`}
                      style={{
                        height: phase === 'listening' ? `${14 + audioLevel * 0.6}px` : phase === 'speaking' ? '36px' : '14px',
                      }}
                    />
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        phase === 'listening'
                          ? 'bg-emerald-400'
                          : phase === 'speaking'
                          ? 'bg-cyan-400'
                          : 'bg-purple-400'
                      }`}
                      style={{
                        height: phase === 'listening' ? `${10 + audioLevel * 0.4}px` : phase === 'speaking' ? '28px' : '8px',
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-bold tracking-wider text-slate-300 mt-2 uppercase">
                    {phase === 'listening'
                      ? 'Listening'
                      : phase === 'thinking'
                      ? 'Thinking'
                      : 'Speaking'}
                  </span>
                </div>
              </button>
            </div>

            {/* LIVE SUBTITLES CARD: Real-time Transcript Stream */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md min-h-[100px] flex flex-col justify-center text-center space-y-2">
              {interimTranscript ? (
                <div className="animate-fade-in">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Hearing You (Will answer automatically):
                  </div>
                  <p className="text-base sm:text-lg font-medium text-white italic">
                    "{interimTranscript}"
                  </p>
                </div>
              ) : phase === 'speaking' && lastAssistantSpokenText ? (
                <div className="animate-fade-in">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    {selectedVoice} Speaking:
                  </div>
                  <p className="text-sm sm:text-base font-medium text-slate-100">
                    "{lastAssistantSpokenText}"
                  </p>
                </div>
              ) : lastUserSpokenText ? (
                <div className="animate-fade-in">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                    Last spoken query:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    "{lastUserSpokenText}"
                  </p>
                  {phase === 'listening' && (
                    <div className="text-[11px] text-emerald-400/90 font-medium mt-1">
                      Say anything... I am listening for your voice
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-slate-300 font-medium">
                    "Say hello, ask a question, or discuss your day..."
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standing from a distance? Just speak normally, auto-gain will catch your voice.
                  </p>
                </div>
              )}
            </div>

            {/* ACTIVE SESSION CONTROL DOCK */}
            <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
              {/* Mute / Unmute Button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-amber-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Quick Send Button (When User is Speaking and wants immediate answer) */}
              {interimTranscript.trim().length > 0 && phase === 'listening' && (
                <button
                  type="button"
                  onClick={handleAutoCommitSpeech}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 cursor-pointer animate-fade-in"
                  title="Answer immediately"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Send Now</span>
                </button>
              )}

              {/* Interrupt AI Button (When AI is Speaking) */}
              {phase === 'speaking' && (
                <button
                  type="button"
                  onClick={handleInterruptSpeaking}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 cursor-pointer animate-fade-in"
                  title="Interrupt and speak now"
                >
                  <Mic className="w-4 h-4" />
                  <span>Tap to Speak</span>
                </button>
              )}

              {/* End Call Button (Red Phone Hang Up) */}
              <button
                type="button"
                onClick={endLiveSession}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                title="End Live Voice Call"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">End Call</span>
              </button>

              {/* Toggle Chat History Drawer */}
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Toggle transcript history"
              >
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SETTINGS DRAWER */}
      {showSettingsDrawer && (
        <div className="absolute top-14 right-0 w-full sm:w-96 bg-slate-950/95 border-b sm:border-l border-slate-800 p-5 shadow-2xl z-30 space-y-5 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-purple-400" />
              <span>Voice &amp; Conversational Tuning</span>
            </h3>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          {/* Gender Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Voice Gender</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  voiceGender === 'male'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                👨 Male Voice
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  voiceGender === 'female'
                    ? 'bg-pink-600/30 border-pink-500 text-pink-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                👩 Female Voice
              </button>
            </div>
          </div>

          {/* Voice Character Persona Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Voice Persona</label>
            <div className="space-y-1.5">
              {(voiceGender === 'male' ? maleVoices : femaleVoices).map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setSelectedVoice(v.name)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs transition cursor-pointer border flex items-center justify-between ${
                    selectedVoice === v.name
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold">{v.label}</div>
                    <div className="text-[10px] text-slate-400">{v.desc}</div>
                  </div>
                  {selectedVoice === v.name && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Speech Pause / Silence Sensitivity */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Conversational Pause Delay</label>
              <span className="text-[11px] text-indigo-400 font-mono">{silenceDelayMs / 1000}s</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSilenceDelayMs(800)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  silenceDelayMs === 800
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Snappy (0.8s)
              </button>
              <button
                type="button"
                onClick={() => setSilenceDelayMs(1200)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  silenceDelayMs === 1200
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Natural (1.2s)
              </button>
              <button
                type="button"
                onClick={() => setSilenceDelayMs(1800)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  silenceDelayMs === 1800
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Relaxed (1.8s)
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Natural pause buffer before the AI answers. You can speak as long as you want without being cut off.
            </p>
          </div>
        </div>
      )}

      {/* CHAT TRANSCRIPT DRAWER */}
      {showHistoryDrawer && (
        <div className="absolute inset-x-0 bottom-0 max-h-[48%] bg-slate-950/95 border-t border-slate-800 rounded-t-3xl p-4 shadow-2xl z-30 flex flex-col backdrop-blur-xl animate-slide-up">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spoken Conversation History ({messages.length})</span>
            </span>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Minimize
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {messages.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No spoken messages yet in this session.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-2xl flex items-start gap-2 ${
                    m.role === 'user'
                      ? 'bg-purple-950/40 border border-purple-800/40 text-slate-100 ml-6'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-6'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {m.role === 'user' ? (
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                        U
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold">
                        AI
                      </div>
                    )}
                  </div>
                  <div className="flex-1 leading-relaxed">
                    <p>{m.content}</p>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => globalVoicePlayer.speak(m.content, selectedVoice)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Spoken Audio</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Memory Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          setUserMemory(loadUserMemory());
        }}
      />
    </div>
  );
};
