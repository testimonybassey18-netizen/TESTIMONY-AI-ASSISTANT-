export type ActiveTool =
  | 'chat'
  | 'live_chat'
  | 'job_scanner'
  | 'assignment'
  | 'cv_builder'
  | 'translator'
  | 'data_analyst'
  | 'writing'
  | 'math'
  | 'document'
  | 'business'
  | 'settings';

export interface ChatAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio';
  name: string;
  size: number;
  mimeType: string;
  dataUrl?: string;
  previewUrl?: string;
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolContext?: string;
  attachments?: ChatAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  tool: ActiveTool;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CvData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  websiteOrLinkedIn: string;
  targetJobTitle: string;
  professionalSummary: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    highlights: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string;
  }>;
  skills: string[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    link?: string;
  }>;
  languages: Array<{
    id: string;
    language: string;
    proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
  }>;
  template: 'modern' | 'minimal' | 'classic' | 'executive';
}

export type SubscriptionPlan = 'free' | 'weekly' | 'monthly' | 'yearly' | 'owner_vip';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  isActive: boolean;
  startDate?: number;
  expiryDate?: number;
  autoRenew: boolean;
  isOwner?: boolean;
}

export interface UserStatus {
  userId: string;
  freeMessagesRemaining: number;
  totalFreeAllowance: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiryDate?: number;
  isOwner?: boolean;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  explanationLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredTone: 'professional' | 'friendly' | 'creative' | 'academic' | 'simple';
  defaultLanguage: string;
  subscription: SubscriptionState;
}
