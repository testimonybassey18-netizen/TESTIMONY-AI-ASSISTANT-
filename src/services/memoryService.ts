import { getUserId } from './geminiService';

export interface UserMemory {
  userName: string;
  userEmail?: string;
  personaSummary: string;
  preferences: string[];
  keyFacts: string[];
  lastTopics: string[];
  customNotes: string[];
  updatedAt: number;
}

const STORAGE_KEY = 'testimony_user_memory';

const DEFAULT_MEMORY: UserMemory = {
  userName: 'Testimony',
  userEmail: 'testimonybassey18@gmail.com',
  personaSummary: 'Ambitious, creative student and professional leveraging AI for academic success, career growth, and innovation.',
  preferences: [
    'Speaks in a warm, friendly, executive male voice (Fenrir)',
    'Prefers articulate, well-structured, supportive human-like conversations',
    'Values clear step-by-step guidance and thoughtful partner-like engagement'
  ],
  keyFacts: [
    'Name is Testimony Bassey',
    'Focused on excellence in school, professional writing, and creative projects',
    'Interacts 1-on-1 with Testimony AI as a trusted advisor and creative partner'
  ],
  lastTopics: ['Voice interaction setup', 'Male voice live chat', 'Conversational memory'],
  customNotes: ['Loves engaging discussion and direct one-on-one voice dialogue'],
  updatedAt: Date.now(),
};

/**
 * Load user memory from localStorage and backend
 */
export function loadUserMemory(): UserMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_MEMORY,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to parse local user memory:', e);
  }
  return { ...DEFAULT_MEMORY };
}

/**
 * Save user memory locally and sync with backend
 */
export function saveUserMemory(memory: Partial<UserMemory>): UserMemory {
  const current = loadUserMemory();
  const updated: UserMemory = {
    ...current,
    ...memory,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save user memory to localStorage:', e);
  }

  // Asynchronously sync to backend
  fetch('/api/user/memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify({ memory: updated }),
  }).catch((err) => console.warn('Memory backend sync error:', err));

  return updated;
}

/**
 * Add a custom fact or note to memory
 */
export function addMemoryFact(fact: string): UserMemory {
  const current = loadUserMemory();
  const clean = fact.trim();
  if (!clean || current.keyFacts.includes(clean)) return current;
  return saveUserMemory({
    keyFacts: [clean, ...current.keyFacts.slice(0, 19)],
  });
}

/**
 * Add a custom note to memory
 */
export function addCustomNote(note: string): UserMemory {
  const current = loadUserMemory();
  const clean = note.trim();
  if (!clean || current.customNotes.includes(clean)) return current;
  return saveUserMemory({
    customNotes: [clean, ...current.customNotes.slice(0, 19)],
  });
}

/**
 * Remove a fact from memory
 */
export function removeMemoryFact(index: number): UserMemory {
  const current = loadUserMemory();
  const updatedFacts = current.keyFacts.filter((_, i) => i !== index);
  return saveUserMemory({ keyFacts: updatedFacts });
}

/**
 * Remove a custom note from memory
 */
export function removeCustomNote(index: number): UserMemory {
  const current = loadUserMemory();
  const updatedNotes = current.customNotes.filter((_, i) => i !== index);
  return saveUserMemory({ customNotes: updatedNotes });
}

/**
 * Automatically observe user text and learn new facts
 */
export function observeAndLearn(userText: string) {
  if (!userText || userText.length < 5) return;
  const lower = userText.toLowerCase();

  // Name detection
  const nameMatch = userText.match(/(?:my name is|i am called|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && nameMatch[1]) {
    const extractedName = nameMatch[1].trim();
    saveUserMemory({ userName: extractedName });
  }

  // Goal or interest detection
  if (lower.includes('i want to') || lower.includes('my goal is') || lower.includes('i am working on')) {
    const cleanSnippet = userText.replace(/^(can you help me|please|hey testimony)/i, '').trim();
    if (cleanSnippet.length > 10 && cleanSnippet.length < 120) {
      addMemoryFact(`Goal / Project: "${cleanSnippet}"`);
    }
  }

  // Topic recording
  const words = userText.split(/\s+/).filter((w) => w.length > 4);
  if (words.length > 2) {
    const current = loadUserMemory();
    const topicSummary = words.slice(0, 4).join(' ');
    const updatedTopics = [topicSummary, ...current.lastTopics.filter((t) => t !== topicSummary)].slice(0, 6);
    saveUserMemory({ lastTopics: updatedTopics });
  }
}

/**
 * Format memory context for Gemini system instruction
 */
export function formatMemoryForSystem(): string {
  const m = loadUserMemory();
  return `
[HUMAN CONVERSATIONAL MEMORY & BOND]
You are conversing one-on-one with your friend and partner, ${m.userName}.
- User Profile: ${m.personaSummary}
- Key Things You Remember About ${m.userName}:
${m.keyFacts.map((f) => `  * ${f}`).join('\n')}
- User Preferences:
${m.preferences.map((p) => `  * ${p}`).join('\n')}
- Recent Topics & Context:
${m.lastTopics.map((t) => `  * ${t}`).join('\n')}
${m.customNotes.length > 0 ? `- Personal Notes:\n${m.customNotes.map((n) => `  * ${n}`).join('\n')}` : ''}

CONVERSATIONAL BEHAVIOR RULES:
1. Speak with the warmth, wit, presence, and natural tone of a trusted male human friend and intellectual partner.
2. Address ${m.userName} naturally by name when appropriate.
3. Draw upon your shared memory and ongoing discussions smoothly without robotic announcements.
4. Listen closely, respond thoughtfully, and show genuine human curiosity and care.
`.trim();
}
