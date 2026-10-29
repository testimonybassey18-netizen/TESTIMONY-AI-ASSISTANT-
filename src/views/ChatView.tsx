import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  RotateCcw,
  Copy,
  Check,
  Plus,
  AlertCircle,
  GraduationCap,
  FileText,
  Languages,
  BarChart3,
  Lightbulb,
  Mail,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Crown,
  Camera,
  Image as ImageIcon,
  Film,
  FileUp,
  X,
  Maximize2,
  Download,
  FileSpreadsheet,
  FileCheck,
  Calendar,
  Loader2,
  Radio,
  Brain,
  VolumeX
} from 'lucide-react';
import { ChatMessage, ActiveTool, ChatAttachment } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Logo } from '../components/Logo';
import { CameraModal } from '../components/CameraModal';
import { MemoryModal } from '../components/MemoryModal';
import { transcribeVoiceAudio, globalVoicePlayer, VoiceName } from '../services/geminiService';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, toolContext?: string, attachments?: ChatAttachment[]) => void;
  onNewChat: () => void;
  onNavigateTool: (tool: ActiveTool) => void;
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
  freeMessagesRemaining: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onNewChat,
  onNavigateTool,
  onOpenSubscriptionModal,
  isPro,
  freeMessagesRemaining,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Fenrir');
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  // Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Hidden File Input Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice Recording & Recognition Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const isRecordingActiveRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, pendingAttachments]);

  // Clean up all audio tracks and player on unmount
  useEffect(() => {
    return () => {
      isRecordingActiveRef.current = false;
      stopVoiceRecording();
      globalVoicePlayer.stop();
    };
  }, []);

  // Auto-speak response if autoSpeak is enabled
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && autoSpeak && !isLoading) {
        handlePlayAssistantVoice(last.id, last.content);
      }
    }
  }, [messages, autoSpeak, isLoading]);

  const handlePlayAssistantVoice = (messageId: string, text: string) => {
    if (isSpeakingId === messageId) {
      globalVoicePlayer.stop();
      setIsSpeakingId(null);
      return;
    }

    globalVoicePlayer.speak(
      text,
      selectedVoice,
      () => setIsSpeakingId(messageId),
      () => setIsSpeakingId(null)
    );
  };

  const stopVoiceRecording = () => {
    isRecordingActiveRef.current = false;

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }

    setIsListening(false);
  };

  // Continuous recording: stays ON until the user manually decides to send or cancel
  const toggleVoiceRecording = async () => {
    setSpeechError(null);

    // If currently listening, clicking mic stops recording and keeps text
    if (isListening) {
      stopVoiceRecording();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError(
        'Microphone is not supported in this browser or frame environment. Please check your browser permissions.'
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.warn('Microphone permission/access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError(
          'Microphone permission was denied. Please click the lock or camera/mic icon in your browser address bar to allow microphone access, then tap Try Again.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setSpeechError('No microphone hardware detected on your device. Please plug in or enable a microphone.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setSpeechError('Your microphone is currently in use by another app or browser tab.');
      } else {
        setSpeechError('Microphone error: ' + (err.message || 'Could not access audio device.'));
      }
      return;
    }

    mediaStreamRef.current = stream;
    isRecordingActiveRef.current = true;
    setIsListening(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript;
          }
          if (full.trim()) {
            setInput(full.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition warning:', event.error);
          }
        };

        // If recognition stops on silence, automatically restart so mic stays active continuously
        recognition.onend = () => {
          if (isRecordingActiveRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition failed to start, using MediaRecorder fallback:', recErr);
      }
    }

    // Always run MediaRecorder continuously in parallel
    try {
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      let chosenMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
    } catch (e) {
      console.warn('MediaRecorder error:', e);
    }
  };

  // Explicit user manual actions (No auto-sending)
  const handleSendVoiceNoteNow = async () => {
    const textToSend = input.trim();
    const recordedChunks = [...audioChunksRef.current];

    stopVoiceRecording();

    if (textToSend) {
      setInput('');
      onSendMessage(textToSend, undefined, pendingAttachments);
      setPendingAttachments([]);
      return;
    }

    if (recordedChunks.length > 0) {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      if (audioBlob.size > 2000) {
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const transcript = await transcribeVoiceAudio(dataUrl, audioBlob.type);
            setIsTranscribing(false);
            if (transcript && transcript.trim()) {
              onSendMessage(transcript.trim(), undefined, pendingAttachments);
              setPendingAttachments([]);
            } else {
              const voiceAtt: ChatAttachment = {
                id: 'voice_' + Date.now(),
                type: 'audio',
                name: `voice_note_${Date.now()}.webm`,
                size: audioBlob.size,
                mimeType: audioBlob.type || 'audio/webm',
                dataUrl,
                previewUrl: URL.createObjectURL(audioBlob),
              };
              onSendMessage('Please review my voice note.', undefined, [
                ...pendingAttachments,
                voiceAtt,
              ]);
              setPendingAttachments([]);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          setIsTranscribing(false);
          setSpeechError('Could not process voice note.');
        }
      }
    }
  };

  const handleDoneSpeaking = () => {
    stopVoiceRecording();
  };

  const handleCancelVoiceRecording = () => {
    stopVoiceRecording();
    setInput('');
  };

  // Text-to-speech reading for assistant messages
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const plainText = text.replace(/[*#`_\[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 800));
      window.speechSynthesis.speak(utterance);
    }
  };

  // File Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingAttachments((prev) => [
          ...prev,
          {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            type: 'image',
            name: file.name,
            size: file.size,
            mimeType: file.type || 'image/jpeg',
            dataUrl,
            previewUrl: dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleCameraSnap = (dataUrl: string, filename: string) => {
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: 'cam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type: 'image',
        name: filename,
        size: Math.round((dataUrl.length * 3) / 4),
        mimeType: 'image/jpeg',
        dataUrl,
        previewUrl: dataUrl,
      },
    ]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingAttachments((prev) => [
        ...prev,
        {
          id: 'vid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          type: 'video',
          name: file.name,
          size: file.size,
          mimeType: file.type || 'video/mp4',
          dataUrl,
          previewUrl: dataUrl,
        },
      ]);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isTextFile =
        file.name.endsWith('.txt') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json');

      if (isTextFile) {
        const textReader = new FileReader();
        textReader.onload = () => {
          const textContent = textReader.result as string;
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              type: 'file',
              name: file.name,
              size: file.size,
              mimeType: file.type || 'text/plain',
              textContent,
            },
          ]);
        };
        textReader.readAsText(file);
      } else {
        const binReader = new FileReader();
        binReader.onload = () => {
          const dataUrl = binReader.result as string;
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              type: 'file',
              name: file.name,
              size: file.size,
              mimeType: file.type || 'application/pdf',
              dataUrl,
            },
          ]);
        };
        binReader.readAsDataURL(file);
      }
    });

    if (e.target) e.target.value = '';
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const triggerCameraAction = () => {
    setIsCameraModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

    if (isListening) {
      stopVoiceRecording();
    }

    const userText = input.trim() || (pendingAttachments.length > 0 ? 'Please review the attached media or document.' : '');
    const currentAttachments = [...pendingAttachments];

    setInput('');
    setPendingAttachments([]);
    setError(null);

    onSendMessage(userText, undefined, currentAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: 'Help me solve my assignment',
      desc: 'Step-by-step guidance across any school subject',
      icon: GraduationCap,
      action: () => onNavigateTool('assignment'),
      gradient: 'from-purple-500/10 to-indigo-500/10 border-purple-500/30 hover:border-purple-500',
    },
    {
      title: 'Build a professional CV for me',
      desc: 'ATS-friendly resume with clean PDF export',
      icon: FileText,
      action: () => onNavigateTool('cv_builder'),
      gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500',
    },
    {
      title: 'Translate this into French or Yoruba',
      desc: 'Accurate multilingual tone & nuances',
      icon: Languages,
      action: () => onNavigateTool('translator'),
      gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500',
    },
    {
      title: 'Analyze my sales data',
      desc: 'Upload CSV, view charts & statistics',
      icon: BarChart3,
      action: () => onNavigateTool('data_analyst'),
      gradient: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500',
    },
    {
      title: 'Explain this topic in simple English',
      desc: 'Break down complex concepts easily',
      icon: Lightbulb,
      action: () => {
        setInput('Can you explain quantum computing in simple English for a beginner with real-life analogies?');
        textareaRef.current?.focus();
      },
      gradient: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-500',
    },
    {
      title: 'Write a professional email for me',
      desc: 'Polished client and workplace communication',
      icon: Mail,
      action: () => onNavigateTool('writing'),
      gradient: 'from-rose-500/10 to-pink-500/10 border-rose-500/30 hover:border-rose-500',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full px-3 sm:px-6 py-4">
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.pptx"
        multiple
        onChange={handleDocumentUpload}
        className="hidden"
      />

      {/* Empty State / Welcome Screen */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center py-6 text-center max-w-2xl mx-auto space-y-5">
          <div className="space-y-3">
            <div className="inline-flex justify-center">
              <Logo size="lg" showTagline={false} />
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hello! I&apos;m Testimony.
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
              What can I help you achieve today? Attach photos, snap with camera, upload documents or videos, or talk via voice chat.
            </p>

            {/* Live Date & Allowance Badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {isPro ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pro Member • Unlimited AI Messages</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-200 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>{freeMessagesRemaining} of 25 free messages remaining</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setInput("What is today's date and what day of the week is it?");
                  textareaRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs font-medium transition cursor-pointer hover:bg-slate-800/60"
              >
                <Calendar className="w-3 h-3 text-purple-400" />
                <span>&quot;What is today&apos;s date?&quot;</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("Can you answer any question I ask you?");
                  textareaRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-medium transition cursor-pointer hover:bg-slate-800/60"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>&quot;Can you answer every question?&quot;</span>
              </button>
            </div>
          </div>

          {/* Quick Prompt Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full pt-2">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={`p-3.5 rounded-xl bg-slate-900/60 border ${item.gradient} text-left transition-all duration-200 flex flex-col justify-between group shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-200">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Message Stream */
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'ml-auto justify-end max-w-2xl' : 'mr-auto justify-start max-w-4xl'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                    <span className="text-xs font-black">T</span>
                  </div>
                )}

                <div
                  className={`relative group rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg max-w-[90%]'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none shadow-md max-w-[92%]'
                  }`}
                >
                  {/* Render Message Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-3">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="rounded-xl overflow-hidden border border-white/20 bg-black/40 text-left"
                        >
                          {att.type === 'image' && att.dataUrl && (
                            <div className="relative group/att cursor-pointer">
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                onClick={() => setPreviewModalImage(att.dataUrl || null)}
                                className="max-h-48 max-w-full rounded-lg object-contain hover:opacity-90 transition"
                              />
                              <div className="text-[10px] bg-black/70 text-white/90 px-2 py-0.5 truncate max-w-[200px]">
                                {att.name}
                              </div>
                            </div>
                          )}

                          {att.type === 'video' && att.dataUrl && (
                            <div className="p-2">
                              <video
                                src={att.dataUrl}
                                controls
                                playsInline
                                className="max-h-48 max-w-full rounded-lg"
                              />
                              <div className="text-[10px] text-white/90 truncate max-w-[200px] mt-1 font-medium">
                                🎬 {att.name}
                              </div>
                            </div>
                          )}

                          {att.type === 'file' && (
                            <div className="p-2.5 flex items-center gap-2.5 bg-slate-900/90 rounded-lg text-xs">
                              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="truncate font-semibold max-w-[190px] text-white">
                                  {att.name}
                                </div>
                                <div className="text-[10px] text-slate-300">
                                  {att.size ? Math.round(att.size / 1024) + ' KB' : 'Document file'}
                                </div>
                              </div>
                            </div>
                          )}

                          {att.type === 'audio' && att.dataUrl && (
                            <div className="p-2.5 bg-slate-900/90 rounded-lg flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                                <Volume2 className="w-4 h-4 text-rose-400" />
                                <span className="truncate max-w-[180px]">{att.name}</span>
                              </div>
                              <audio src={att.dataUrl} controls className="max-w-[220px] h-8 rounded" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div>
                      <MarkdownRenderer content={msg.content} />
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[10px]">Testimony AI Assistant</span>
                        <div className="flex items-center gap-2">
                          {msg.content.includes('Error generating response') && (
                            <button
                              onClick={() => {
                                const currentIdx = messages.findIndex((m) => m.id === msg.id);
                                for (let i = currentIdx - 1; i >= 0; i--) {
                                  if (messages[i].role === 'user') {
                                    onSendMessage(
                                      messages[i].content,
                                      messages[i].toolContext,
                                      messages[i].attachments
                                    );
                                    break;
                                  }
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition"
                              title="Retry generation"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                          <button
                            onClick={() => handlePlayAssistantVoice(msg.id, msg.content)}
                            className={`px-2 py-1 rounded transition flex items-center gap-1 text-[11px] font-medium cursor-pointer ${
                              isSpeakingId === msg.id
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-slate-800/60 hover:bg-slate-800 text-cyan-300 hover:text-white'
                            }`}
                            title={isSpeakingId === msg.id ? 'Stop Voice' : 'Listen with Male Voice (Fenrir)'}
                          >
                            {isSpeakingId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-white" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Male Voice</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-white transition px-2 py-1 rounded bg-slate-800/60"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 text-xs font-bold">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 mr-auto justify-start max-w-4xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 animate-pulse">
                <span className="text-xs font-black">T</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-slate-400 text-xs sm:text-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Testimony is thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Unable to process request</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Box Area */}
      <div className="pt-2">
        {/* Active Free Allowance Bar */}
        <div className="flex items-center justify-between pb-1.5 px-1 text-xs">
          <div className="flex items-center gap-1.5">
            {isPro ? (
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>Unlimited Pro Messages</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-purple-300">
                {freeMessagesRemaining} of 25 free messages remaining.
              </span>
            )}
          </div>

          {!isPro && (
            <button
              onClick={onOpenSubscriptionModal}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              Upgrade Plan ($10/mo · $250/yr)
            </button>
          )}
        </div>

        {/* Continuous Microphone Listening Banner (No timer, no auto-send) */}
        {isListening && (
          <div className="mb-2 p-3 rounded-2xl bg-slate-900 border border-rose-500/60 shadow-[0_0_25px_rgba(225,29,72,0.25)] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-rose-200 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute" />
              </div>
              <div>
                <span className="font-bold text-white">
                  Microphone is active (Listening continuously)
                </span>
                <p className="text-[11px] text-rose-300/90 mt-0.5">
                  Speak freely — there is no countdown timer and it will not auto-send until you click below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleSendVoiceNoteNow}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Send Voice Note</span>
              </button>
              <button
                type="button"
                onClick={handleDoneSpeaking}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                title="Stop mic and review your transcript in the input box"
              >
                Keep Text
              </button>
              <button
                type="button"
                onClick={handleCancelVoiceRecording}
                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white transition cursor-pointer"
                title="Cancel recording"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {isTranscribing && (
          <div className="mb-2 p-2 rounded-xl bg-purple-900/60 border border-purple-600/40 flex items-center gap-2 text-xs text-purple-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Transcribing your voice message...</span>
          </div>
        )}

        {speechError && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-2 shadow">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{speechError}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className="px-2 py-0.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-semibold transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="p-1 rounded hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Pending Attachments Strip */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-2 mb-2 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-semibold text-purple-300 px-1">Attached:</span>
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 pr-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
              >
                {att.type === 'image' && att.dataUrl && (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-7 h-7 rounded object-cover"
                  />
                )}
                {att.type === 'video' && <Film className="w-4 h-4 text-purple-400 shrink-0" />}
                {att.type === 'audio' && <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />}
                {att.type === 'file' && <FileText className="w-4 h-4 text-cyan-400 shrink-0" />}
                <div className="min-w-0">
                  <div className="truncate max-w-[120px] font-medium text-slate-200">{att.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {att.size ? Math.round(att.size / 1024) + ' KB' : att.type}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(att.id)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl focus-within:border-purple-500/80 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Testimony anything, snap a photo, upload documents/videos, or speak..."
            rows={2}
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm resize-none focus:outline-none pr-12 pl-1 leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            {/* Attachment Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {/* Camera Button */}
              <button
                type="button"
                onClick={triggerCameraAction}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Camera: Take a photo"
              >
                <Camera className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Camera</span>
              </button>

              {/* Photos Button */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Add Photos from gallery"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Photos</span>
              </button>

              {/* Video Button */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Upload Video"
              >
                <Film className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Video</span>
              </button>

              {/* Documents & Files Button */}
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Upload File or Document (PDF, Word, Text, CSV)"
              >
                <FileUp className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Document</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTool('live_chat')}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 transition text-xs flex items-center gap-1 font-semibold cursor-pointer shadow-sm"
                title="Switch to dedicated Live 1-on-1 Discussion (Male Voice)"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(true)}
                className="p-1.5 sm:px-2 rounded-lg bg-purple-950/60 border border-purple-600/40 text-purple-300 hover:bg-purple-900/60 transition text-xs flex items-center gap-1 font-semibold cursor-pointer"
                title="View & manage remembered facts"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Memory</span>
              </button>

              <button
                type="button"
                onClick={onNewChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Start a new chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>
            </div>

            {/* Right: Voice Mic & Submit */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Microphone voice chat button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isTranscribing}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                    : isTranscribing
                    ? 'bg-slate-800 text-purple-400 opacity-70'
                    : 'bg-slate-800 text-purple-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={isListening ? 'Click to stop listening' : 'Speak your question with microphone (No auto cut-off)'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-400" />
                )}
                <span className="hidden sm:inline">
                  {isListening ? 'Listening (Live)' : isTranscribing ? 'Transcribing...' : 'Voice'}
                </span>
              </button>

              <button
                type="submit"
                disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-[11px] text-slate-500 text-center mt-2">
          TESTIMONY AI ASSISTANT • 25 free messages per account • Voice &amp; Multimodal media enabled.
        </p>
      </div>

      {/* Live Camera Snapshot Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraSnap}
      />

      {/* Memory Management Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />

      {/* Lightbox Image Preview Modal */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
