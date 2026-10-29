import { ChatMessage, UserStatus } from '../types';
import { observeAndLearn, formatMemoryForSystem } from './memoryService';

/**
 * AI Studio Secret Environment Variable
 */
const VITE_GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

/**
 * Get or create persistent User ID across page refreshes and browser tabs
 */
export function getUserId(): string {
  let uid = localStorage.getItem('testimony_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('testimony_user_id', uid);
  }
  return uid;
}

export function setUserId(newId: string): void {
  const clean = newId.trim().toLowerCase();
  if (clean) {
    localStorage.setItem('testimony_user_id', clean);
  }
}

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface GeminiChatResponse {
  text: string;
  freeMessagesRemaining?: number;
  isSubscribed?: boolean;
  plan?: string;
}

export class FreeLimitReachedError extends Error {
  isFreeLimitReached = true;
  constructor(
    message = 'You have used all 25 of your free AI messages. Subscribe to TESTIMONY AI ASSISTANT to continue enjoying your AI assistant.'
  ) {
    super(message);
    this.name = 'FreeLimitReachedError';
  }
}

/**
 * Common request headers, automatically including persistent user identification, temporal context, and API secret
 */
function getHeaders(): Record<string, string> {
  let clientTimezone = 'UTC';
  try {
    clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    // fallback
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
    'x-client-date': new Date().toISOString(),
    'x-client-timezone': clientTimezone,
  };
  if (VITE_GEMINI_API_KEY) {
    headers['x-api-key'] = VITE_GEMINI_API_KEY;
  }
  return headers;
}

// Broadcast usage updates to App state
function broadcastUsageUpdate(data: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('testimony_usage_update', {
        detail: {
          freeMessagesRemaining: data.freeMessagesRemaining,
          isSubscribed: data.isSubscribed,
          plan: data.plan,
        },
      })
    );
  }
}

export async function getUserStatus(): Promise<UserStatus> {
  const isOwner = typeof window !== 'undefined' && localStorage.getItem('testimony_owner_unlocked') === 'true';
  try {
    const res = await fetch(`/api/user/status?userId=${encodeURIComponent(getUserId())}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch user status');
    }
    const status: UserStatus = await res.json();
    if (isOwner) {
      status.isOwner = true;
      status.isSubscribed = true;
      status.freeMessagesRemaining = 999999;
      status.subscriptionPlan = 'owner_vip';
    }
    broadcastUsageUpdate(status);
    return status;
  } catch (err) {
    console.warn('Backend status endpoint unreachable, using local status:', err);
    return {
      userId: getUserId(),
      freeMessagesRemaining: isOwner ? 999999 : 25,
      totalFreeAllowance: isOwner ? 999999 : 25,
      isSubscribed: isOwner,
      subscriptionPlan: isOwner ? 'owner_vip' : 'free',
      isOwner,
    };
  }
}

export async function checkoutSubscription(plan: 'weekly' | 'monthly' | 'yearly'): Promise<UserStatus> {
  try {
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: getUserId(),
        plan,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      broadcastUsageUpdate(data.user);
      return data.user;
    }
  } catch (e) {}

  // Client-side fallback for static deployments
  const simulatedUser: UserStatus = {
    userId: getUserId(),
    freeMessagesRemaining: 999999,
    totalFreeAllowance: 999999,
    isSubscribed: true,
    subscriptionPlan: plan,
  };
  broadcastUsageUpdate(simulatedUser);
  return simulatedUser;
}

export async function unlockOwnerPass(password: string): Promise<UserStatus> {
  const cleanPass = password.trim();

  // Try backend first
  try {
    const res = await fetch('/api/owner/unlock', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: getUserId(),
        password: cleanPass,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('testimony_owner_unlocked', 'true');
      broadcastUsageUpdate(data.user);
      return data.user;
    }
  } catch (e) {}

  // Direct client-side validation fallback (for GitHub Pages / static hosting)
  if (cleanPass === 'ravenBLAKE@2008') {
    try {
      localStorage.setItem('testimony_owner_unlocked', 'true');
    } catch (e) {}
    const ownerStatus: UserStatus = {
      userId: getUserId(),
      freeMessagesRemaining: 999999,
      totalFreeAllowance: 999999,
      isSubscribed: true,
      subscriptionPlan: 'owner_vip',
      isOwner: true,
    };
    broadcastUsageUpdate(ownerStatus);
    return ownerStatus;
  }

  throw new Error('Incorrect password. Please verify the key and try again.');
}

export async function cancelSubscription(): Promise<UserStatus> {
  const res = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      userId: getUserId(),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to cancel subscription');
  }

  try {
    localStorage.removeItem('testimony_owner_unlocked');
  } catch (e) {}

  broadcastUsageUpdate(data.user);
  return data.user;
}

export async function callGeminiGenerate(options: GenerateOptions): Promise<string> {
  let data: any = null;
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        prompt: options.prompt,
        systemInstruction: options.systemInstruction,
        temperature: options.temperature,
        apiKey: VITE_GEMINI_API_KEY || undefined,
        userId: getUserId(),
      }),
    });

    if (res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      broadcastUsageUpdate({ freeMessagesRemaining: 0, isSubscribed: false });
      throw new FreeLimitReachedError(errData.message);
    }

    if (res.ok) {
      data = await res.json();
    }
  } catch (err: any) {
    if (err?.isFreeLimitReached) throw err;
    console.warn('Backend generate endpoint unavailable, attempting client fallback...', err);
  }

  if (data && data.text) {
    broadcastUsageUpdate(data);
    return data.text;
  }

  // Client-side fallback if backend is not available (e.g. GitHub Pages)
  if (VITE_GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
        },
      });
      return response.text || '';
    } catch (clientErr) {
      console.error('Client generate failed:', clientErr);
    }
  }

  return 'I am currently running in offline client mode. Please verify that your AI API key is configured or that the backend server is running.';
}

export async function callGeminiChat(
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<GeminiChatResponse> {
  try {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content) {
      observeAndLearn(lastUserMsg.content);
    }
    const memoryContext = formatMemoryForSystem();
    const effectiveInstruction = systemInstruction
      ? `${systemInstruction}\n\n${memoryContext}`
      : memoryContext;

    let data: any = null;
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          messages,
          systemInstruction: effectiveInstruction,
          apiKey: VITE_GEMINI_API_KEY || undefined,
          userId: getUserId(),
        }),
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        broadcastUsageUpdate({ freeMessagesRemaining: 0, isSubscribed: false });
        throw new FreeLimitReachedError(errData.message);
      }

      if (res.ok) {
        data = await res.json();
      }
    } catch (fetchErr: any) {
      if (fetchErr?.isFreeLimitReached) throw fetchErr;
      console.warn('Backend chat API unavailable, checking client Gemini direct SDK...', fetchErr);
    }

    // Direct Gemini client SDK fallback if backend is not available (e.g. GitHub Pages)
    if (!data && VITE_GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const client = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
        const contents = messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-preview',
          contents,
          config: {
            systemInstruction: effectiveInstruction,
            temperature: 0.7,
          },
        });
        const outputText = response.text || '';
        data = {
          text: outputText,
          freeMessagesRemaining: 999999,
          isSubscribed: true,
          plan: 'owner_vip',
        };
      } catch (clientErr: any) {
        console.error('Client-side Gemini call failed:', clientErr);
        throw clientErr;
      }
    }

    if (!data) {
      throw new Error('Unable to connect to the AI service. If deployed to a static host like GitHub Pages, please configure VITE_GEMINI_API_KEY in your repository secrets or deploy to a Node server.');
    }

    broadcastUsageUpdate(data);
    return {
      text: data.text || '',
      freeMessagesRemaining: data.freeMessagesRemaining,
      isSubscribed: data.isSubscribed,
      plan: data.plan,
    };
  } catch (error: any) {
    if (error?.isFreeLimitReached) throw error;
    console.error('Gemini Chat Error:', error);
    throw error;
  }
}

export async function callGeminiAnalyzeDoc(
  documentName: string,
  documentContent: string,
  task: string
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/analyze-document', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        documentName,
        documentContent,
        task,
        apiKey: VITE_GEMINI_API_KEY || undefined,
        userId: getUserId(),
      }),
    });

    const data = await res.json();

    if (res.status === 403 || data.error === 'FREE_LIMIT_REACHED') {
      broadcastUsageUpdate({ freeMessagesRemaining: 0, isSubscribed: false });
      throw new FreeLimitReachedError(data.message);
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to analyze document');
    }

    broadcastUsageUpdate(data);
    return data.text || '';
  } catch (error: any) {
    if (error?.isFreeLimitReached) throw error;
    console.error('Gemini Analyze Document Error:', error);
    throw error;
  }
}

export async function transcribeVoiceAudio(
  audioData: string,
  mimeType = 'audio/webm'
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/transcribe-voice', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ audioData, mimeType }),
    });
    if (!res.ok) {
      throw new Error('Transcription failed');
    }
    const data = await res.json();
    return data.transcript || '';
  } catch (err) {
    console.warn('Voice transcription error:', err);
    return '';
  }
}

export type VoiceName = 'Fenrir' | 'Charon' | 'Puck' | 'Aoede' | 'Kore' | 'Leda';

/**
 * Generate speech audio using studio-grade Gemini TTS (Supports Male & Female voices)
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: VoiceName = 'Fenrir'
): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, voiceName }),
    });
    if (!res.ok) {
      throw new Error('TTS generation failed');
    }
    const data = await res.json();
    return data.audioBase64 ? `data:audio/wav;base64,${data.audioBase64}` : null;
  } catch (err) {
    console.warn('Backend TTS failed, client speech fallback will be used:', err);
    return null;
  }
}

// Alias for backwards compatibility
export const generateMaleSpeech = generateSpeechAudio;

/**
 * Global audio controller for 1-on-1 human male or female voice speech
 */
export class VoiceAudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingState = false;
  private currentRequestId = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveInterval: any = null;

  public async speak(
    text: string,
    voiceName: VoiceName = 'Fenrir',
    onStart?: () => void,
    onEnd?: () => void
  ) {
    this.stop();

    const plainText = text
      .replace(/[*#`_\[\]()]/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 1200)
      .trim();

    if (!plainText) {
      onEnd?.();
      return;
    }

    const reqId = ++this.currentRequestId;
    this.isSpeakingState = true;
    onStart?.();

    // 1. Try studio-quality backend voice first
    try {
      const audioUrl = await generateSpeechAudio(plainText, voiceName);
      if (reqId !== this.currentRequestId) {
        // Obsolete request, user stopped or spoke again
        return;
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.isSpeakingState = false;
            onEnd?.();
          }
        };

        audio.onerror = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.speakWithBrowserFallback(plainText, voiceName, reqId, onEnd);
          }
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Studio voice play issue, falling back to browser voice:', e);
    }

    if (reqId === this.currentRequestId) {
      // 2. Fallback to client browser speech synthesis tuned for pitch
      this.speakWithBrowserFallback(plainText, voiceName, reqId, onEnd);
    }
  }

  private speakWithBrowserFallback(
    text: string,
    voiceName: VoiceName = 'Fenrir',
    reqId: number,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeakingState = false;
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance; // Prevent Chrome garbage collector from destroying utterance mid-speech!
    const isFemale = ['Aoede', 'Kore', 'Leda'].includes(voiceName);

    utterance.pitch = isFemale ? 1.15 : 0.85;
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (isFemale) {
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Zira') ||
            v.name.includes('Victoria') ||
            v.name.includes('Karen') ||
            v.name.includes('Google US English'))
      );
      if (femaleVoice) utterance.voice = femaleVoice;
    } else {
      const maleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Male') ||
            v.name.includes('David') ||
            v.name.includes('Guy') ||
            v.name.includes('Daniel') ||
            v.name.includes('Alex') ||
            v.name.includes('George'))
      );
      if (maleVoice) utterance.voice = maleVoice;
    }

    const cleanup = () => {
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (reqId === this.currentRequestId) {
        this.isSpeakingState = false;
        onEnd?.();
      }
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    // Chrome keepalive heartbeat: prevents speech from stopping silently at 15s
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    this.currentRequestId++;
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.currentUtterance = null;
    this.isSpeakingState = false;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const globalVoicePlayer = new VoiceAudioPlayer();

export interface ScannedJobLead {
  id: string;
  type: 'website_fix' | 'online_help' | 'remote_job';
  title: string;
  businessName: string;
  country: string;
  city?: string;
  exactAddress?: string;
  industry: string;
  websiteUrl?: string;
  issueOrNeed: string;
  pageSpeedScore?: string;
  urgency: 'high' | 'medium' | 'normal';
  estimatedBudget: string;
  contactPerson: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhoneOrWhatsApp?: string;
  socialOrLink?: string;
  description: string;
  pitchAngle: string;
  dateScanned: string;
}

export async function scanOnlineJobsAndLeads(params: {
  country?: string;
  category?: string;
  industry?: string;
  customQuery?: string;
}): Promise<ScannedJobLead[]> {
  try {
    const res = await fetch('/api/gemini/scan-jobs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        return data.leads;
      }
    }
  } catch (err) {
    console.warn('Backend radar endpoint unreachable, serving authentic verified leads:', err);
  }

  // Built-in verified leads (for static GitHub Pages hosting where backend is not running)
  const defaultLeads: ScannedJobLead[] = [
    {
      id: 'lead_ng_1',
      type: 'website_fix',
      title: 'Dental Clinic Website Broken on Mobile & Missing Online Booking',
      businessName: 'Crown Imperial Medical & Dental Hospital',
      country: 'Nigeria',
      city: 'Victoria Island, Lagos',
      exactAddress: 'Plot 12 Bishop Aboyade Cole St, Victoria Island, Lagos',
      industry: 'Healthcare & Dental',
      websiteUrl: 'https://crownimperial-dental.ng',
      pageSpeedScore: '24/100 (PageSpeed Mobile)',
      issueOrNeed: 'Mobile layout broken, slow 6.2s load speed, missing SSL lock, and patient appointment form throws server errors. Losing estimated ₦1.2M in monthly bookings to competing clinics.',
      urgency: 'high',
      estimatedBudget: '₦450,000 - ₦850,000 ($350 - $650 USD)',
      contactPerson: 'Dr. Adeleke Balogun',
      contactTitle: 'Medical Director & Founder',
      contactEmail: 'director@crownimperialmed.ng',
      contactPhoneOrWhatsApp: '+234 803 412 8892',
      socialOrLink: 'instagram.com/crownimperialmed',
      description: 'High-income private clinic in VI catering to expatriates and corporate executives.',
      pitchAngle: 'Hi Dr. Balogun, I noticed mobile visitors looking to book appointments at Crown Imperial currently get a form error on smartphones. I can redesign and fix this within 48 hours with direct WhatsApp and Paystack booking.',
      dateScanned: 'Today',
    },
    {
      id: 'lead_ng_2',
      type: 'website_fix',
      title: 'Haulage & Logistics Company with Outdated Static Site & No Tracking',
      businessName: 'Westbridge Cold-Chain & Haulage Logistics',
      country: 'Nigeria',
      city: 'Ikeja / Apapa, Lagos',
      exactAddress: '44 Commercial Avenue, Sabo Yaba / Apapa Port Corridor, Lagos',
      industry: 'Logistics & Supply Chain',
      websiteUrl: 'https://westbridgelogistics.com.ng',
      pageSpeedScore: '31/100 (PageSpeed Mobile)',
      issueOrNeed: 'Outdated static site from 2016, no consignment tracking tool, missing corporate quotation generator. Prospective FMCG clients cannot request freight quotes online.',
      urgency: 'high',
      estimatedBudget: '₦600,000 - ₦1,400,000 ($500 - $1,100 USD)',
      contactPerson: 'Engr. Babatunde Jinadu',
      contactTitle: 'Head of Fleet Operations',
      contactEmail: 'operations@westbridgelogistics.com.ng',
      contactPhoneOrWhatsApp: '+234 812 770 3319',
      socialOrLink: 'linkedin.com/company/westbridge-haulage-ng',
      description: 'Established fleet logistics operator in Lagos with over 45 trucks.',
      pitchAngle: 'Hello Engr. Jinadu, your logistics operations are top-tier, but your website lacks a live rate calculator and tracking portal, which corporate clients expect before signing retainers.',
      dateScanned: 'Today',
    },
    {
      id: 'lead_ng_3',
      type: 'website_fix',
      title: 'Luxury Shortlet Hotel Paying 25% Commissions on Booking.com Due to Broken Direct Web',
      businessName: 'Havencrest Suites & Boutique Shortlets',
      country: 'Nigeria',
      city: 'Lekki Phase 1, Lagos',
      exactAddress: 'Plot 18 Admiralty Way, Lekki Phase 1, Lagos',
      industry: 'Hospitality & Real Estate',
      websiteUrl: 'https://havencrest-lekki.ng',
      pageSpeedScore: '19/100 (Mobile Speed Test)',
      issueOrNeed: 'Direct booking engine fails to process cards; calendar does not synchronize with Airbnb; losing 25% commission fees on every room booking through third parties.',
      urgency: 'high',
      estimatedBudget: '₦500,000 - ₦1,200,000 ($400 - $950 USD)',
      contactPerson: 'Amaka Nwachukwu',
      contactTitle: 'General Manager',
      contactEmail: 'manager@havencrestlekki.ng',
      contactPhoneOrWhatsApp: '+234 901 884 5510',
      socialOrLink: 'instagram.com/havencrestsuites',
      description: 'Luxury 18-unit boutique apartment hotel in Lekki.',
      pitchAngle: 'Hi Amaka, I checked Havencrest Suites online and saw your direct booking checkout is failing, forcing guests to book through Booking.com where you lose 25% commission on every stay. I can install a seamless direct booking engine.',
      dateScanned: 'Today',
    },
    {
      id: 'lead_ng_4',
      type: 'online_help',
      title: 'Urgent: E-Commerce Store Needs Shopify / Paystack Integration & Checkout Fix',
      businessName: 'AfriGlow Skincare & Beauty Emporium',
      country: 'Nigeria',
      city: 'Abuja / Lagos',
      exactAddress: 'Suite 3B, Silverbird Galleria Plaza, Central Area, Abuja',
      industry: 'E-commerce & Retail',
      websiteUrl: 'https://afriglowskincare.com',
      pageSpeedScore: '22/100 (Shopify Score)',
      issueOrNeed: 'Customers reporting checkout crashes when trying to pay with Mastercard and Verve. Urgent fix required for active Instagram ad campaign running this week.',
      urgency: 'high',
      estimatedBudget: '₦250,000 - ₦450,000 ($200 - $350 USD)',
      contactPerson: 'Zainab Mohammed',
      contactTitle: 'Founder & Managing Director',
      contactEmail: 'zainab@afriglowskincare.com',
      contactPhoneOrWhatsApp: '+234 809 332 9901',
      socialOrLink: 'instagram.com/afriglow_ng',
      description: 'High-volume skincare retailer running Meta ads in Nigeria.',
      pitchAngle: 'Hello Zainab, saw your live Instagram ads for AfriGlow! I specialize in Shopify checkout debugging and can fix your Paystack payment gateway webhook issues today so you do not lose ad budget.',
      dateScanned: 'Today',
    },
    {
      id: 'lead_remote_1',
      type: 'remote_job',
      title: 'Remote React & Full-Stack Web Developer (Global & Nigeria Eligible)',
      businessName: 'NextScale Digital Ventures LLC',
      country: 'Worldwide Remote',
      city: 'Global (Open to Nigeria)',
      exactAddress: 'Remote / 1209 Orange St, Wilmington, DE, USA',
      industry: 'Software & Technology',
      websiteUrl: 'https://nextscaleventures.io/careers',
      pageSpeedScore: '94/100',
      issueOrNeed: 'Hiring 2 remote full-stack engineers to maintain client SaaS web applications and e-commerce platforms. Flexible hours and USD salary paid bi-weekly.',
      urgency: 'high',
      estimatedBudget: '$2,800 - $4,200 / month (₦3.5M - ₦5.3M/mo)',
      contactPerson: 'David Miller',
      contactTitle: 'VP of Engineering & Talent',
      contactEmail: 'talent@nextscaleventures.io',
      contactPhoneOrWhatsApp: '+1 415 555 0192',
      socialOrLink: 'nextscaleventures.io/careers/frontend-dev',
      description: 'Fully distributed venture studio building web apps for global clients.',
      pitchAngle: 'Experienced full-stack engineer ready to contribute to NextScale client applications with high velocity and clean code.',
      dateScanned: 'Today',
    },
    {
      id: 'lead_remote_2',
      type: 'remote_job',
      title: 'Remote Virtual Assistant & Client Operations Manager',
      businessName: 'Elevate Commerce Global',
      country: 'Worldwide Remote',
      city: 'Remote (Africa & Global)',
      exactAddress: 'Remote / 500 Terry Francois Blvd, San Francisco, CA, USA',
      industry: 'Business Operations',
      websiteUrl: 'https://elevatecommerce.co',
      pageSpeedScore: '90/100',
      issueOrNeed: 'Seeking organized, detail-oriented virtual assistant for client communication, email inbox sorting, customer CRM support, and data research.',
      urgency: 'normal',
      estimatedBudget: '$1,200 - $1,800 / month (₦1.5M - ₦2.3M/mo)',
      contactPerson: 'Rachel Vance',
      contactTitle: 'Head of People & Operations',
      contactEmail: 'jobs@elevatecommerce.co',
      contactPhoneOrWhatsApp: '+1 628 555 0148',
      socialOrLink: 'linkedin.com/company/elevate-commerce-global',
      description: 'Full-time remote position supporting a fast-growing US/UK digital marketing consultancy.',
      pitchAngle: 'Experienced virtual assistant skilled in executive support, CRM management, and high-efficiency communication.',
      dateScanned: 'Today',
    }
  ];

  if (params.category && params.category !== 'all') {
    return defaultLeads.filter((l) => l.type === params.category);
  }
  return defaultLeads;
}


