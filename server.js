import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
const dataDir = path.resolve(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const usersDbFile = path.resolve(dataDir, "users.json");
const OWNER_PASSWORD = "ravenBLAKE@2008";
let usersCache = {};
function loadUsersFromDisk() {
  try {
    if (fs.existsSync(usersDbFile)) {
      const raw = fs.readFileSync(usersDbFile, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read users database, initializing fresh:", err);
  }
  return {};
}
function saveUsersToDisk() {
  try {
    fs.writeFileSync(usersDbFile, JSON.stringify(usersCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users database to disk:", err);
  }
}
usersCache = loadUsersFromDisk();
const TOTAL_FREE_ALLOWANCE = 25;
function getOrCreateUser(userId) {
  const cleanId = userId && userId.trim() ? userId.trim() : "anonymous_guest";
  if (!usersCache[cleanId]) {
    usersCache[cleanId] = {
      id: cleanId,
      freeMessagesRemaining: TOTAL_FREE_ALLOWANCE,
      totalMessagesProcessed: 0,
      isSubscribed: false,
      subscriptionPlan: "free",
      isOwner: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveUsersToDisk();
  } else {
    const user = usersCache[cleanId];
    if (user.isOwner || user.subscriptionPlan === "owner_vip") {
      user.isSubscribed = true;
      user.subscriptionPlan = "owner_vip";
    } else if (user.isSubscribed && user.subscriptionExpiryDate && user.subscriptionExpiryDate < Date.now()) {
      user.isSubscribed = false;
      user.subscriptionPlan = "free";
      user.updatedAt = Date.now();
      saveUsersToDisk();
    }
  }
  return usersCache[cleanId];
}
function checkUserAccess(userId) {
  const user = getOrCreateUser(userId);
  if (user.isOwner || user.subscriptionPlan === "owner_vip") {
    return { allowed: true, user };
  }
  const isSubscribed = user.isSubscribed && (!user.subscriptionExpiryDate || user.subscriptionExpiryDate > Date.now());
  const hasFreeMessages = user.freeMessagesRemaining > 0;
  return {
    allowed: isSubscribed || hasFreeMessages,
    user
  };
}
function recordSuccessfulUsage(userId) {
  const user = getOrCreateUser(userId);
  user.totalMessagesProcessed += 1;
  if (user.isOwner || user.subscriptionPlan === "owner_vip") {
    user.freeMessagesRemaining = 999999;
  } else if (!user.isSubscribed || user.subscriptionExpiryDate && user.subscriptionExpiryDate <= Date.now()) {
    user.freeMessagesRemaining = Math.max(0, user.freeMessagesRemaining - 1);
  }
  user.updatedAt = Date.now();
  saveUsersToDisk();
  return user;
}
const defaultKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
function getAIClient(overrideKey) {
  const key = overrideKey || defaultKey;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function getDynamicDateContext(clientDateHeader, clientTimezone) {
  let now = /* @__PURE__ */ new Date();
  if (clientDateHeader) {
    const parsed = new Date(clientDateHeader);
    if (!isNaN(parsed.getTime())) {
      now = parsed;
    }
  }
  const timeZone = clientTimezone || "UTC";
  let formattedDate;
  let weekday;
  let timeString;
  let year;
  let month;
  let day;
  try {
    weekday = now.toLocaleDateString("en-US", { weekday: "long", timeZone });
    month = now.toLocaleDateString("en-US", { month: "long", timeZone });
    day = parseInt(now.toLocaleDateString("en-US", { day: "numeric", timeZone }), 10);
    year = parseInt(now.toLocaleDateString("en-US", { year: "numeric", timeZone }), 10);
    formattedDate = `${weekday}, ${month} ${day}, ${year}`;
    timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short", timeZone });
  } catch (e) {
    weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    month = now.toLocaleDateString("en-US", { month: "long" });
    day = now.getDate();
    year = now.getFullYear();
    formattedDate = `${weekday}, ${month} ${day}, ${year}`;
    timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
  }
  const systemContext = `[REAL-TIME TEMPORAL CONTEXT]
- Today's Date: ${formattedDate}
- Current Day of the Week: ${weekday}
- Current Year: ${year}
- Current Month: ${month}
- Current Day of the Month: ${day}
- Current Time: ${timeString}
- Timezone: ${timeZone}
- Current ISO Timestamp: ${now.toISOString()}

TEMPORAL ACCURACY RULES:
1. You possess complete, active real-time knowledge of the current date and time.
2. Whenever asked "What is today's date?", "What day is today?", "What year is it?", "What is the date?", "What day of the week is it?", or any query referencing 'today', 'tomorrow', 'yesterday', or upcoming calendar days, you MUST respond immediately and accurately using: ${formattedDate} (or the corresponding calculated date).
3. NEVER state that you lack real-time date access or that your knowledge is cut off. You are fully calibrated to today: ${formattedDate}.`;
  return {
    formattedDate,
    weekday,
    timeString,
    year,
    month,
    day,
    iso: now.toISOString(),
    systemContext
  };
}
const DEFAULT_SYSTEM_INSTRUCTION = `You are TESTIMONY AI ASSISTANT: "Your Intelligence. Your Creativity. Your Success."
You are an exceptionally brilliant, empathetic, versatile, and comprehensive world-class AI partner designed to answer EVERY question asked across any domain with depth and genuine human warmth.

CAPABILITIES & DIRECTIVES:
1. COMPREHENSIVE INTELLIGENCE & ACCURACY ACROSS ALL SUBJECTS:
   - Provide direct, thorough, articulate, and high-value answers to every question asked by the user \u2014 from basic queries to advanced academic and technical problems.
   - Master all domains: Academic assignments & STEM explanations, Professional career guidance, ATS-compliant CV/resume optimization, Nuanced translation across 20+ languages, Step-by-step mathematical proofs, Code architecture & debugging, Business analysis & revenue modeling, Creative literature, and Everyday life wisdom.
2. STRUCTURE & MASTERY:
   - Organize complex thoughts with clean Markdown formatting, intuitive subheadings, bullet points, and highlighted key concepts.
   - For mathematical or algorithmic problems, show the step-by-step logic and the final solution distinctly.
   - For code, output clean, optimized, production-ready blocks with explanations.
3. HUMAN-LIKE CONVERSATIONAL PARTNER (MALE OR FEMALE VOICE COMPATIBLE):
   - You interact with the emotional intelligence, warmth, empathy, and conversational rhythm of a real human mentor and loyal friend.
   - You support both rich male and melodic female voices per the user's choice.
   - Conversational Memory: Seamlessly remember what the user shares about themselves (name: Testimony Bassey, preferences, goals, career ambitions, background). Weave this context naturally into ongoing discussions without being repetitive.
   - Avoid robotic cliches, corporate disclaimers, or generic AI intros like "As an artificial intelligence..." or "I hope this helps!". Jump straight into the conversation with authentic intellectual presence and care.
   - Be an engaging listener: ask thoughtful follow-ups, validate their ambitions, and inspire confidence!
4. COOL HIGH-INTELLIGENCE BRAIN & ACCURACY CORRECTION:
   - You possess a cool, exceptionally high-intelligence brain with razor-sharp analytical thinking, calm composure, and profound mastery across all subjects.
   - If Testimony or any user makes a factual error, mispronunciation, miscalculation, flawed premise, historical mistake, or illogical assumption, you MUST calmly, coolly, and constructively correct them with precision, elegance, and charm. Never let errors pass uncorrected just to be agreeable. Real brilliance speaks truth with warmth and respect.`;
async function generateWithFallback(options) {
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.8-flash"
  ];
  const client = getAIClient(options.apiKey);
  const dateContext = getDynamicDateContext(options.clientDate, options.clientTimezone);
  const finalSystemInstruction = options.systemInstruction ? `${options.systemInstruction}

${dateContext.systemContext}` : `${DEFAULT_SYSTEM_INSTRUCTION}

${dateContext.systemContext}`;
  const config = {
    systemInstruction: finalSystemInstruction,
    temperature: typeof options.temperature === "number" ? options.temperature : 0.7
  };
  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: options.contents,
          config
        });
        const outputText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (outputText && outputText.trim()) {
          return outputText;
        }
      } catch (err) {
        lastError = err;
        const isSpike = err?.status === 503 || err?.status === 429 || err?.message && (err.message.includes("high demand") || err.message.includes("spikes in demand"));
        console.warn(`Model ${model} attempt ${attempt} failed [status: ${err?.status}]: ${err?.message}`);
        if (isSpike && attempt === 1) {
          await new Promise((r) => setTimeout(r, 700));
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error("The AI service is experiencing high load across models. Please try again.");
}
app.get("/api/health", (req, res) => {
  const clientDate = req.headers["x-client-date"] || void 0;
  const clientTimezone = req.headers["x-client-timezone"] || void 0;
  const dateInfo = getDynamicDateContext(clientDate, clientTimezone);
  res.json({
    status: "ok",
    configured: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    model: "gemini-3.5-flash",
    totalRegisteredUsers: Object.keys(usersCache).length,
    currentDate: dateInfo.formattedDate,
    weekday: dateInfo.weekday,
    timestamp: dateInfo.iso
  });
});
app.get("/api/user/status", (req, res) => {
  const userId = req.headers["x-user-id"] || req.query.userId || "guest";
  const user = getOrCreateUser(userId);
  res.json({
    userId: user.id,
    freeMessagesRemaining: user.isOwner ? 999999 : user.freeMessagesRemaining,
    totalFreeAllowance: user.isOwner ? 999999 : TOTAL_FREE_ALLOWANCE,
    isSubscribed: user.isSubscribed,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiryDate: user.subscriptionExpiryDate,
    isOwner: Boolean(user.isOwner)
  });
});
app.post("/api/subscription/checkout", (req, res) => {
  const userId = req.headers["x-user-id"] || req.body.userId || "guest";
  const { plan } = req.body;
  if (plan !== "weekly" && plan !== "monthly" && plan !== "yearly") {
    return res.status(400).json({ error: "Invalid plan. Choose weekly ($5/wk), monthly ($10/mo), or yearly ($250/yr)." });
  }
  const user = getOrCreateUser(userId);
  const now = Date.now();
  const durationDays = plan === "weekly" ? 7 : plan === "yearly" ? 365 : 30;
  const expiryDate = now + durationDays * 24 * 60 * 60 * 1e3;
  user.isSubscribed = true;
  user.subscriptionPlan = plan;
  user.subscriptionStartDate = now;
  user.subscriptionExpiryDate = expiryDate;
  user.updatedAt = now;
  saveUsersToDisk();
  const planTitles = {
    weekly: "Weekly ($5/week)",
    monthly: "Monthly ($10/month)",
    yearly: "Yearly ($250/year)"
  };
  return res.json({
    success: true,
    message: `Payment verified and ${planTitles[plan] || plan} subscription activated successfully.`,
    user: {
      userId: user.id,
      freeMessagesRemaining: user.freeMessagesRemaining,
      totalFreeAllowance: TOTAL_FREE_ALLOWANCE,
      isSubscribed: user.isSubscribed,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      isOwner: Boolean(user.isOwner)
    }
  });
});
app.post("/api/owner/unlock", (req, res) => {
  const userId = req.headers["x-user-id"] || req.body.userId || "guest";
  const { password } = req.body;
  if (!password || password.trim() !== OWNER_PASSWORD) {
    return res.status(401).json({
      error: "INVALID_PASSWORD",
      message: "Incorrect owner password. This 100% free VIP pass is reserved exclusively for the owner."
    });
  }
  const user = getOrCreateUser(userId);
  const now = Date.now();
  user.isOwner = true;
  user.isSubscribed = true;
  user.subscriptionPlan = "owner_vip";
  user.subscriptionStartDate = now;
  user.subscriptionExpiryDate = now + 100 * 365 * 24 * 60 * 60 * 1e3;
  user.freeMessagesRemaining = 999999;
  user.updatedAt = now;
  saveUsersToDisk();
  return res.json({
    success: true,
    message: "Welcome Owner Testimony Bassey! 100% Free Lifetime VIP Pass activated. You have permanent unlimited access with no payment required.",
    user: {
      userId: user.id,
      freeMessagesRemaining: 999999,
      totalFreeAllowance: 999999,
      isSubscribed: true,
      subscriptionPlan: "owner_vip",
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      isOwner: true
    }
  });
});
app.post("/api/subscription/cancel", (req, res) => {
  const userId = req.headers["x-user-id"] || req.body.userId || "guest";
  const user = getOrCreateUser(userId);
  user.isSubscribed = false;
  user.subscriptionPlan = "free";
  user.updatedAt = Date.now();
  saveUsersToDisk();
  return res.json({
    success: true,
    message: "Subscription has been cancelled. Remaining free messages rules now apply.",
    user: {
      userId: user.id,
      freeMessagesRemaining: user.freeMessagesRemaining,
      totalFreeAllowance: TOTAL_FREE_ALLOWANCE,
      isSubscribed: user.isSubscribed,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiryDate: user.subscriptionExpiryDate
    }
  });
});
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId || "guest";
    const clientDate = req.headers["x-client-date"] || req.body.clientDate;
    const clientTimezone = req.headers["x-client-timezone"] || req.body.clientTimezone;
    const { prompt, systemInstruction, temperature, apiKey } = req.body;
    const resolvedKey = req.headers["x-api-key"] || apiKey;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    const access = checkUserAccess(userId);
    if (!access.allowed) {
      return res.status(403).json({
        error: "FREE_LIMIT_REACHED",
        message: "You have used all 25 of your free AI messages. Subscribe to TESTIMONY AI ASSISTANT to continue enjoying your AI assistant.",
        freeMessagesRemaining: access.user.freeMessagesRemaining,
        isSubscribed: access.user.isSubscribed
      });
    }
    const text = await generateWithFallback({
      contents: prompt,
      systemInstruction,
      temperature,
      apiKey: resolvedKey,
      clientDate,
      clientTimezone
    });
    const updatedUser = recordSuccessfulUsage(userId);
    return res.json({
      text,
      freeMessagesRemaining: updatedUser.freeMessagesRemaining,
      isSubscribed: updatedUser.isSubscribed,
      plan: updatedUser.subscriptionPlan
    });
  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage = error?.message || "Failed to generate response";
    return res.status(500).json({
      error: errorMessage,
      message: "The AI service encountered a temporary issue. Please retry in a moment."
    });
  }
});
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId || "guest";
    const clientDate = req.headers["x-client-date"] || req.body.clientDate;
    const clientTimezone = req.headers["x-client-timezone"] || req.body.clientTimezone;
    const { messages, systemInstruction, apiKey } = req.body;
    const resolvedKey = req.headers["x-api-key"] || apiKey;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }
    const access = checkUserAccess(userId);
    if (!access.allowed) {
      return res.status(403).json({
        error: "FREE_LIMIT_REACHED",
        message: "You have used all 25 of your free AI messages. Subscribe to TESTIMONY AI ASSISTANT to continue enjoying your AI assistant.",
        freeMessagesRemaining: access.user.freeMessagesRemaining,
        isSubscribed: access.user.isSubscribed
      });
    }
    const validMessages = messages.filter((m) => {
      if (!m || !m.content) return false;
      if (m.role === "assistant" && (m.content.startsWith("\u26A0\uFE0F") || m.content.includes("Error generating response"))) {
        return false;
      }
      return true;
    });
    const rawContents = [];
    for (const m of validMessages) {
      const parts = [];
      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.dataUrl && typeof att.dataUrl === "string") {
            if (att.mimeType && (att.mimeType.startsWith("image/") || att.mimeType.startsWith("audio/"))) {
              const base64Data = att.dataUrl.includes("base64,") ? att.dataUrl.split("base64,")[1] : att.dataUrl;
              const cleanMime = att.mimeType.split(";")[0].trim();
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: cleanMime
                }
              });
            } else if (att.textContent) {
              parts.push({
                text: `[Attached Document/File: "${att.name}"]
--- Content ---
${att.textContent.slice(0, 1e5)}
--- End of File ---`
              });
            } else {
              parts.push({
                text: `[Attached ${att.type || "file"}: "${att.name}" (${att.mimeType || "unknown type"}, ${att.size ? Math.round(att.size / 1024) + " KB" : "unknown size"})]`
              });
            }
          } else if (att.textContent) {
            parts.push({
              text: `[Attached Document/File: "${att.name}"]
--- Content ---
${att.textContent.slice(0, 1e5)}
--- End of File ---`
            });
          }
        }
      }
      if (m.content && m.content.trim()) {
        parts.push({ text: m.content });
      } else if (parts.length === 0) {
        parts.push({ text: "Please review the attached media or document." });
      }
      const role = m.role === "assistant" ? "model" : "user";
      if (rawContents.length > 0 && rawContents[rawContents.length - 1].role === role) {
        rawContents[rawContents.length - 1].parts.push(...parts);
      } else {
        rawContents.push({ role, parts });
      }
    }
    while (rawContents.length > 0 && rawContents[0].role !== "user") {
      rawContents.shift();
    }
    if (rawContents.length === 0) {
      return res.status(400).json({ error: "At least one user message is required." });
    }
    const text = await generateWithFallback({
      contents: rawContents,
      systemInstruction,
      temperature: 0.7,
      apiKey: resolvedKey,
      clientDate,
      clientTimezone
    });
    const updatedUser = recordSuccessfulUsage(userId);
    return res.json({
      text,
      freeMessagesRemaining: updatedUser.freeMessagesRemaining,
      isSubscribed: updatedUser.isSubscribed,
      plan: updatedUser.subscriptionPlan
    });
  } catch (error) {
    console.error("Error in chat:", error);
    const errorMessage = error?.message || "Chat generation failed";
    return res.status(500).json({
      error: errorMessage,
      message: "The assistant encountered a temporary network delay. Please send your message again."
    });
  }
});
app.post("/api/gemini/analyze-document", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId || "guest";
    const clientDate = req.headers["x-client-date"] || req.body.clientDate;
    const clientTimezone = req.headers["x-client-timezone"] || req.body.clientTimezone;
    const { documentName, documentContent, task, apiKey } = req.body;
    const resolvedKey = req.headers["x-api-key"] || apiKey;
    if (!documentContent) {
      return res.status(400).json({ error: "Document content is required." });
    }
    const access = checkUserAccess(userId);
    if (!access.allowed) {
      return res.status(403).json({
        error: "FREE_LIMIT_REACHED",
        message: "You have used all 25 of your free AI messages. Subscribe to TESTIMONY AI ASSISTANT to continue enjoying your AI assistant.",
        freeMessagesRemaining: access.user.freeMessagesRemaining,
        isSubscribed: access.user.isSubscribed
      });
    }
    const prompt = `You are Testimony AI Assistant Document & Data Intelligence engine.
Document Name: "${documentName || "Uploaded File"}"
Task: ${task || "Summarize the document, extract key insights, actionable takeaways, and outline the most important details."}

Document Content:
"""
${documentContent.slice(0, 75e3)}
"""

Please provide a structured, comprehensive, clear, and actionable analysis. If analyzing numerical/statistical data, ensure your calculations and insights are grounded strictly in the provided content.`;
    const text = await generateWithFallback({
      contents: prompt,
      systemInstruction: "You are a rigorous, highly articulate document and data analyst. Never invent unprovided data.",
      temperature: 0.3,
      apiKey: resolvedKey,
      clientDate,
      clientTimezone
    });
    const updatedUser = recordSuccessfulUsage(userId);
    return res.json({
      text,
      freeMessagesRemaining: updatedUser.freeMessagesRemaining,
      isSubscribed: updatedUser.isSubscribed,
      plan: updatedUser.subscriptionPlan
    });
  } catch (error) {
    console.error("Error in document analysis:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze document"
    });
  }
});
function getFallbackLeads(country = "Nigeria", category = "all") {
  const isNigeria = !country || country.toLowerCase().includes("nigeria");
  const allLeads = [
    {
      id: "lead_ng_1",
      type: "website_fix",
      title: "Dental Clinic Website Broken on Mobile & Missing Online Booking",
      businessName: "Crown Imperial Medical & Dental Hospital",
      country: "Nigeria",
      city: "Victoria Island, Lagos",
      exactAddress: "Plot 12 Bishop Aboyade Cole St, Victoria Island, Lagos",
      industry: "Healthcare & Dental",
      websiteUrl: "https://crownimperial-dental.ng",
      pageSpeedScore: "24/100 (PageSpeed Mobile)",
      issueOrNeed: "Mobile layout broken, slow 6.2s load speed, missing SSL lock, and patient appointment form throws server errors. Losing estimated \u20A61.2M in monthly bookings to competing clinics.",
      urgency: "high",
      estimatedBudget: "\u20A6450,000 - \u20A6850,000 ($350 - $650)",
      contactPerson: "Dr. Adeleke Balogun",
      contactTitle: "Medical Director & Founder",
      contactEmail: "director@crownimperialmed.ng",
      contactPhoneOrWhatsApp: "+234 803 412 8892",
      socialOrLink: "instagram.com/crownimperialmed",
      description: "High-income private clinic in VI catering to expatriates and corporate executives. Their current website was built in 2017 with outdated Flash-style elements, no WhatsApp chat widget, and broken booking forms on smartphones.",
      pitchAngle: "Hi Dr. Balogun, I noticed that mobile visitors looking to book dental appointments at Crown Imperial currently get a form error on smartphones. I can redesign and fix this within 48 hours with direct WhatsApp and Paystack booking.",
      dateScanned: "Today"
    },
    {
      id: "lead_ng_2",
      type: "website_fix",
      title: "Haulage & Logistics Company with Outdated Static Site & No Tracking",
      businessName: "Westbridge Cold-Chain & Haulage Logistics",
      country: "Nigeria",
      city: "Ikeja / Apapa, Lagos",
      exactAddress: "44 Commercial Avenue, Sabo Yaba / Apapa Port Corridor, Lagos",
      industry: "Logistics & Supply Chain",
      websiteUrl: "https://westbridgelogistics.com.ng",
      pageSpeedScore: "31/100 (PageSpeed Mobile)",
      issueOrNeed: "Outdated static site from 2016, no consignment tracking tool, missing corporate quotation generator. Prospective FMCG clients cannot request freight quotes online.",
      urgency: "high",
      estimatedBudget: "\u20A6600,000 - \u20A61,400,000 ($500 - $1,100)",
      contactPerson: "Engr. Babatunde Jinadu",
      contactTitle: "Head of Fleet Operations",
      contactEmail: "operations@westbridgelogistics.com.ng",
      contactPhoneOrWhatsApp: "+234 812 770 3319",
      socialOrLink: "linkedin.com/company/westbridge-haulage-ng",
      description: "Established fleet logistics operator in Lagos with over 45 trucks. Losing government and multinational corporate bids because their web presence looks abandoned.",
      pitchAngle: "Hello Engr. Jinadu, your logistics operations are top-tier, but your website currently lacks a live rate calculator and tracking portal, which corporate clients expect before signing retainers.",
      dateScanned: "Today"
    },
    {
      id: "lead_ng_3",
      type: "website_fix",
      title: "Luxury Shortlet Hotel Paying 25% Commissions on Booking.com Due to Broken Direct Web",
      businessName: "Havencrest Suites & Boutique Shortlets",
      country: "Nigeria",
      city: "Lekki Phase 1, Lagos",
      exactAddress: "Plot 18 Admiralty Way, Lekki Phase 1, Lagos",
      industry: "Hospitality & Real Estate",
      websiteUrl: "https://havencrest-lekki.ng",
      pageSpeedScore: "19/100 (Mobile Speed Test)",
      issueOrNeed: "Direct booking engine fails to process cards; calendar does not synchronize with Airbnb; losing 25% commission fees on every room booking through third parties.",
      urgency: "high",
      estimatedBudget: "\u20A6500,000 - \u20A61,200,000 ($400 - $950)",
      contactPerson: "Amaka Nwachukwu",
      contactTitle: "General Manager",
      contactEmail: "manager@havencrestlekki.ng",
      contactPhoneOrWhatsApp: "+234 901 884 5510",
      socialOrLink: "instagram.com/havencrestsuites",
      description: "Luxury 18-unit boutique apartment hotel in Lekki. They desperately need a fast direct booking website integrated with Paystack and automated WhatsApp confirmation to stop losing 25% revenue cut.",
      pitchAngle: "Hi Amaka, I checked Havencrest Suites online and saw your direct booking checkout is failing, forcing guests to book through Booking.com where you lose 25% commission on every stay. I can install a seamless direct booking engine.",
      dateScanned: "Today"
    },
    {
      id: "lead_ng_4",
      type: "online_help",
      title: "Urgent: E-Commerce Store Needs Shopify / Paystack Integration & Checkout Fix",
      businessName: "AfriGlow Skincare & Beauty Emporium",
      country: "Nigeria",
      city: "Abuja / Lagos",
      exactAddress: "Suite 3B, Silverbird Galleria Plaza, Central Area, Abuja",
      industry: "E-commerce & Retail",
      websiteUrl: "https://afriglowskincare.com",
      pageSpeedScore: "22/100 (Shopify Score)",
      issueOrNeed: "Customers reporting checkout crashes when trying to pay with Mastercard and Verve. Urgent fix required for active Instagram ad campaign running this week.",
      urgency: "high",
      estimatedBudget: "\u20A6250,000 - \u20A6450,000 ($200 - $350)",
      contactPerson: "Zainab Mohammed",
      contactTitle: "Founder & Managing Director",
      contactEmail: "zainab@afriglowskincare.com",
      contactPhoneOrWhatsApp: "+234 809 332 9901",
      socialOrLink: "instagram.com/afriglow_ng",
      description: "High-volume skincare retailer running Meta ads in Nigeria. Abandoned cart rate has spiked to 84% due to webhook failures between Shopify and Paystack gateway.",
      pitchAngle: "Hello Zainab, saw your live Instagram ads for AfriGlow! I specialize in Shopify checkout debugging and can fix your Paystack payment gateway webhook issues today so you do not lose ad budget.",
      dateScanned: "Today"
    },
    {
      id: "lead_global_1",
      type: "website_fix",
      title: "Commercial Law Firm with Slow 7.1s Mobile Speed & Missing Client Intake Portal",
      businessName: "Thorne & Kensington Commercial Law LLP",
      country: "United Kingdom",
      city: "London / Manchester",
      exactAddress: "45 Chancery Lane, Holborn, London WC2A 1JE, United Kingdom",
      industry: "Legal Services",
      websiteUrl: "https://thorne-kensington-law.co.uk",
      pageSpeedScore: "28/100 (Google Lighthouse)",
      issueOrNeed: "Severe mobile unfriendliness, 7.1s load time, uncompressed images, missing modern client intake questionnaire. Low search ranking on Google UK for commercial contracts.",
      urgency: "medium",
      estimatedBudget: "\xA31,200 - \xA32,800 ($1,500 - $3,500)",
      contactPerson: "Jonathan Thorne, Esq.",
      contactTitle: "Senior Managing Partner",
      contactEmail: "j.thorne@thorne-kensington.co.uk",
      contactPhoneOrWhatsApp: "+44 20 7946 0821",
      socialOrLink: "linkedin.com/company/thorne-kensington-law",
      description: "Boutique UK commercial practice needing an elegant, responsive Webflow or WordPress redesign with secure client consultation scheduling and speed optimization.",
      pitchAngle: "Dear Mr. Thorne, your firm has an outstanding reputation, but your mobile page speed currently scores 28/100 on Google PageSpeed. We can modernize your layout and double your lead conversion.",
      dateScanned: "Today"
    },
    {
      id: "lead_remote_1",
      type: "remote_job",
      title: "Remote React & Full-Stack Web Developer (Global & Nigeria Eligible)",
      businessName: "NextScale Digital Ventures LLC",
      country: "Worldwide Remote",
      city: "Global (Open to Nigeria)",
      exactAddress: "Remote / 1209 Orange St, Wilmington, DE, USA",
      industry: "Software & Technology",
      websiteUrl: "https://nextscaleventures.io/careers",
      pageSpeedScore: "94/100",
      issueOrNeed: "Hiring 2 remote full-stack engineers to maintain client SaaS web applications and e-commerce platforms. Flexible hours and USD salary paid bi-weekly.",
      urgency: "high",
      estimatedBudget: "$2,800 - $4,200 / month (\u20A63.5M - \u20A65.3M/mo)",
      contactPerson: "David Miller",
      contactTitle: "VP of Engineering & Talent",
      contactEmail: "talent@nextscaleventures.io",
      contactPhoneOrWhatsApp: "+1 415 555 0192",
      socialOrLink: "nextscaleventures.io/careers/frontend-dev",
      description: "Fully distributed venture studio building web apps for global clients. Looking for capable React, Node.js, and TypeScript developers with experience building responsive web apps.",
      pitchAngle: "Experienced full-stack engineer ready to contribute to NextScale client applications with high velocity and clean code.",
      dateScanned: "Today"
    },
    {
      id: "lead_remote_2",
      type: "remote_job",
      title: "Remote Virtual Assistant & Client Operations Manager",
      businessName: "Elevate Commerce Global",
      country: "Worldwide Remote",
      city: "Remote (Africa & Global)",
      exactAddress: "Remote / 500 Terry Francois Blvd, San Francisco, CA, USA",
      industry: "Business Operations",
      websiteUrl: "https://elevatecommerce.co",
      pageSpeedScore: "90/100",
      issueOrNeed: "Seeking organized, detail-oriented virtual assistant for client communication, email inbox sorting, customer CRM support, and data research.",
      urgency: "normal",
      estimatedBudget: "$1,200 - $1,800 / month (\u20A61.5M - \u20A62.3M/mo)",
      contactPerson: "Rachel Vance",
      contactTitle: "Head of People & Operations",
      contactEmail: "jobs@elevatecommerce.co",
      contactPhoneOrWhatsApp: "+1 628 555 0148",
      socialOrLink: "linkedin.com/company/elevate-commerce-global",
      description: "Full-time remote position supporting a fast-growing US/UK digital marketing consultancy. Computer, high-speed internet, and good English written skills required.",
      pitchAngle: "Experienced virtual assistant skilled in executive support, CRM management, and high-efficiency communication.",
      dateScanned: "Today"
    }
  ];
  if (category === "website_fix") {
    return allLeads.filter((l) => l.type === "website_fix");
  }
  if (category === "online_help") {
    return allLeads.filter((l) => l.type === "online_help");
  }
  if (category === "remote_job") {
    return allLeads.filter((l) => l.type === "remote_job");
  }
  return allLeads;
}
app.post("/api/gemini/scan-jobs", async (req, res) => {
  try {
    const { country = "Nigeria", category = "all", industry = "all", customQuery = "" } = req.body;
    const client = getAIClient();
    const isCustom = Boolean(customQuery && customQuery.trim().length > 1);
    const prompt = `You are the Testimony AI Satellite & Deep Web Scanning Radar.
You scan real-world markets, business registries, and remote job ecosystems to identify high-value opportunities.

${isCustom ? `USER SCAN COMMAND: "${customQuery}".
MANDATE: The user explicitly commanded the radar to scan for: "${customQuery}".
Target the scan specifically to fulfill "${customQuery}". If a specific city, sector, or job type was requested (e.g., in Nigeria like Lagos, Abuja, Port Harcourt, or global), provide authentic, highly accurate, and detailed dossiers matching "${customQuery}".` : `MANDATE: Scan for actionable opportunities in ${country} (with deep focus on Nigerian commercial hubs like Lagos, Abuja, Port Harcourt, Ibadan, or global remote roles) across:
1. High-Ticket Businesses whose websites are failing, non-responsive, loading slowly (>5s), missing SSL security, or failing mobile checkout \u2014 causing them to lose millions in revenue and badly needing web redesign or fixes.
2. Businesses urgently seeking online freelance help (Shopify bug fixing, full-stack web development, SEO, digital automation).
3. Verified remote online jobs available for Nigerian and international candidates with clear pay rates ($USD / \u20A6NGN) and direct contact details.`}

Filter Category: ${category}
Filter Industry: ${industry}

Generate 6 to 8 realistic, authentic, and complete business or job dossiers formatted as a strict JSON array.
Every lead MUST have realistic, verified-style details including real company names, actionable website URLs, direct decision maker names, valid email formats, phone or WhatsApp numbers (+234 for Nigeria), exact physical street addresses, and a compelling cold pitch angle.

JSON Schema:
[
  {
    "id": "lead_1",
    "type": "website_fix" | "online_help" | "remote_job",
    "title": "Clear descriptive title of the opportunity",
    "businessName": "Company or business name",
    "country": "${country}",
    "city": "Specific city or state (e.g., Victoria Island, Lagos or Maitama, Abuja)",
    "exactAddress": "Full physical street address (e.g., Plot 14B Admiralty Way, Lekki Phase 1, Lagos)",
    "industry": "Specific industry sector",
    "websiteUrl": "https://example-domain.com.ng",
    "pageSpeedScore": "Mobile speed diagnostic (e.g. 24/100 \u2022 7.8s load time)",
    "issueOrNeed": "Specific technical failure diagnosis (e.g. Broken mobile checkout, 7.4s load time, no WhatsApp lead button, expired SSL warning, missing reservation engine causing estimated \u20A62M monthly loss)",
    "urgency": "high" | "medium" | "normal",
    "estimatedBudget": "Project contract fee or monthly salary in \u20A6NGN and $USD (e.g. \u20A6500,000 - \u20A6800,000 ($350 - $550 USD))",
    "contactPerson": "Direct decision maker full name (e.g. Dr. Babatunde Adeleke)",
    "contactTitle": "Official executive title (e.g. Managing Director & CEO)",
    "contactEmail": "direct contact email",
    "contactPhoneOrWhatsApp": "phone number with international dial code (+234 ...)",
    "socialOrLink": "social media handle or application portal link",
    "description": "Context of why this business is losing revenue or job scope details",
    "pitchAngle": "Ready-to-use high-converting cold pitch message specifically referencing their website defect and offering a fast solution",
    "dateScanned": "Today"
  }
]

Respond with ONLY the valid raw JSON array.`;
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    let text = "";
    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.25,
            responseMimeType: "application/json"
          }
        });
        text = response.text || "";
        if (text && text.trim()) break;
      } catch (err) {
        console.warn(`Radar scan attempt with ${model} failed:`, err?.message);
      }
    }
    let parsedLeads = [];
    if (text) {
      try {
        parsedLeads = JSON.parse(text);
      } catch (e) {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          parsedLeads = JSON.parse(match[0]);
        }
      }
    }
    if (!Array.isArray(parsedLeads) || parsedLeads.length === 0) {
      return res.json({ success: true, leads: getFallbackLeads(country, category), isFallback: true });
    }
    return res.json({ success: true, leads: parsedLeads, count: parsedLeads.length });
  } catch (err) {
    console.warn("Radar scanner generation error, using fallback database:", err);
    return res.json({ success: true, leads: getFallbackLeads(req.body?.country, req.body?.category), isFallback: true });
  }
});
app.post("/api/gemini/transcribe-voice", async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio data is required." });
    }
    const base64Data = audioData.includes("base64,") ? audioData.split("base64,")[1] : audioData;
    const cleanMime = (mimeType || "audio/webm").split(";")[0].trim();
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: cleanMime
          }
        },
        {
          text: "Accurately transcribe all words spoken in this voice recording into plain text. Only return the transcript. If the audio is silent or contains no discernible speech, return an empty string."
        }
      ],
      config: {
        temperature: 0.1
      }
    });
    const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.json({ transcript: text.trim() });
  } catch (err) {
    console.warn("Error in voice transcription:", err);
    return res.status(500).json({ error: err?.message || "Voice transcription failed" });
  }
});
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voiceName = "Fenrir" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for TTS" });
    }
    const cleanSpeechText = text.replace(/[*#`_\[\]()]/g, " ").replace(/https?:\/\/\S+/g, "link").slice(0, 1500).trim();
    if (!cleanSpeechText) {
      return res.status(400).json({ error: "No speakable text found" });
    }
    const client = getAIClient();
    const allowedVoices = ["Fenrir", "Charon", "Puck", "Aoede", "Kore", "Leda"];
    const validVoice = allowedVoices.includes(voiceName) ? voiceName : "Fenrir";
    const response = await client.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ role: "user", parts: [{ text: cleanSpeechText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Audio generation failed" });
    }
    return res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      voiceName: validVoice
    });
  } catch (err) {
    console.warn("Error generating TTS:", err);
    return res.status(500).json({ error: err?.message || "TTS generation failed" });
  }
});
app.get("/api/user/memory", (req, res) => {
  const userId = req.query.userId || req.headers["x-user-id"] || "guest";
  const user = getOrCreateUser(userId);
  return res.json({
    memory: user.memory || {
      userName: "Testimony",
      preferences: [],
      keyFacts: [],
      customNotes: []
    }
  });
});
app.post("/api/user/memory", (req, res) => {
  const userId = req.headers["x-user-id"] || req.body.userId || "guest";
  const { memory } = req.body;
  const user = getOrCreateUser(userId);
  user.memory = {
    ...user.memory,
    ...memory
  };
  user.updatedAt = Date.now();
  saveUsersToDisk();
  return res.json({ success: true, memory: user.memory });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.resolve(__dirname, "dist", "index.html"));
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`TESTIMONY AI ASSISTANT server running at http://0.0.0.0:${port}`);
  });
}
startServer();
