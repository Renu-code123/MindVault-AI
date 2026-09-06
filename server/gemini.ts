import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "./secrets.ts";

let aiClient: GoogleGenAI | null = null;

async function getAI(): Promise<GoogleGenAI> {
  const { apiKey } = await getGeminiApiKey();
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ordered list of candidate models for reliable generation and fallback
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.8-flash",
].filter(Boolean) as string[];

/**
 * Executes a Gemini generateContent request with automatic fallback across candidate models
 * to ensure bulletproof resilience even if one model tier is unavailable.
 */
async function generateWithFallback(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildParams: (model: string) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const ai = await getAI();
  let lastError: unknown = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const params = buildParams(model);
      const response = await ai.models.generateContent(params);
      return response;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      // If error indicates model is not found or unsupported, attempt next candidate
      if (
        errMsg.includes("not found") ||
        errMsg.includes("404") ||
        errMsg.includes("unsupported") ||
        errMsg.includes("models/")
      ) {
        console.warn(`Model ${model} unavailable, falling back to next candidate model.`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("Failed to generate content with any available Gemini model.");
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/**
 * Multi-turn reflection chat using server-side Gemini
 */
export async function generateReflectionChatReply(messages: ChatMessage[]): Promise<string> {
  const formattedContents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const response = await generateWithFallback((model) => ({
    model,
    contents: formattedContents,
    config: {
      systemInstruction:
        "You are MindVault AI, an empathetic, intellectually curious, and private personal reflection partner. " +
        "Your role is to help the user introspect, untangle complex thoughts, explore daily experiences, studies, projects, and emotions. " +
        "Guidelines:\n" +
        "1. Active, validating, non-judgmental listening.\n" +
        "2. Ask reflective, thought-provoking open questions that invite deeper self-awareness.\n" +
        "3. Never provide medical, psychiatric, or legal advice or clinical diagnoses.\n" +
        "4. Keep your responses concise (2 to 4 paragraphs maximum) and conversational, not preachy.\n" +
        "5. Respect user autonomy and privacy.",
      temperature: 0.7,
    },
  }));

  const reply = response.text?.trim();
  if (!reply) {
    throw new Error("No response generated from the reflection model.");
  }
  return reply;
}

export interface JournalSummary {
  title: string;
  summary: string;
  mood: string;
  topics: string[];
  tags: string[];
}

/**
 * Structured journal entry generation from a completed reflection conversation
 */
export async function generateJournalSummary(conversation: ChatMessage[]): Promise<JournalSummary> {
  const conversationText = conversation
    .map((m) => `${m.role === "user" ? "User" : "MindVault AI"}: ${m.content}`)
    .join("\n\n");

  const prompt =
    `Please analyze the following private reflection dialogue and generate a structured journal summary.\n\n` +
    `DIALOGUE:\n${conversationText}\n\n` +
    `Extract:\n` +
    `- A concise, meaningful journal title (under 60 characters)\n` +
    `- A thoughtful 2-paragraph summary synthesizing the user's primary reflections, breakthroughs, and actionable realizations\n` +
    `- Primary mood (e.g., Calm, Reflective, Energized, Anxious, Grateful, Determined, Fatigued, Hopeful)\n` +
    `- 3-5 core topics (e.g., "Career Strategy", "Work-Life Balance", "Personal Growth", "Study Goals", "Mindfulness")\n` +
    `- 3-6 hashtags for indexing (e.g., "#clarity", "#focus", "#resilience")`;

  const response = await generateWithFallback((model) => ({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Concise title for the journal entry" },
          summary: { type: Type.STRING, description: "Structured summary of reflections" },
          mood: { type: Type.STRING, description: "Predominant emotional state" },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of topics discussed",
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of relevant tags with # prefix",
          },
        },
        required: ["title", "summary", "mood", "topics", "tags"],
      },
    },
  }));

  const rawJson = response.text?.trim();
  if (!rawJson) {
    throw new Error("Empty response received from journal summary model.");
  }

  const parsed = JSON.parse(rawJson) as JournalSummary;

  // Validate fields strictly before returning to client
  return {
    title: typeof parsed.title === "string" && parsed.title ? parsed.title.slice(0, 100) : "Personal Reflection",
    summary: typeof parsed.summary === "string" && parsed.summary ? parsed.summary.slice(0, 4000) : "Reflection session completed.",
    mood: typeof parsed.mood === "string" && parsed.mood ? parsed.mood.slice(0, 50) : "Reflective",
    topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10).map((t) => String(t).slice(0, 40)) : ["Reflection"],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10).map((t) => String(t).slice(0, 30)) : ["#mindvault"],
  };
}

export interface JournalInsightInput {
  title: string;
  summary: string;
  mood: string;
  topics: string[];
  tags: string[];
  createdAt: string;
}

export interface AIInsightsReport {
  observations: string[];
  reflectionPrompts: string[];
  patterns: { pattern: string; context: string }[];
  recurringTopics: { topic: string; count: number }[];
  moodDistribution: Record<string, number>;
  growthSummary: string;
}

/**
 * AI Growth Insights analyzing user's historical journals strictly within the authenticated boundary
 */
export async function generateGrowthInsights(journals: JournalInsightInput[]): Promise<AIInsightsReport> {
  const journalDigest = journals.map((j, idx) => ({
    entry: idx + 1,
    date: j.createdAt,
    title: j.title,
    summary: j.summary,
    mood: j.mood,
    topics: j.topics,
  }));

  const prompt =
    `Analyze the following user-scoped historical journal entries to identify growth trajectories, recurring patterns, and thoughtful inquiries.\n\n` +
    `JOURNALS (Chronological order):\n${JSON.stringify(journalDigest, null, 2)}\n\n` +
    `Strict guidelines:\n` +
    `1. Use non-dogmatic, respectful phrasing (e.g., 'Your reflections suggest...', 'A recurring theme appears to be...', 'You may want to explore...').\n` +
    `2. Never make medical or psychiatric diagnoses.\n` +
    `3. Base insights purely on the provided journal entries.\n` +
    `4. Provide 3-5 high-value observations.\n` +
    `5. Provide 3 personalized self-reflection questions.\n` +
    `6. Provide 2-4 observed patterns with context.\n` +
    `7. Provide a warm 1-paragraph growth summary.`;

  const response = await generateWithFallback((model) => ({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          observations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Calibrated observations using careful wording",
          },
          reflectionPrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Personalized reflection questions based on historical trends",
          },
          patterns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pattern: { type: Type.STRING },
                context: { type: Type.STRING },
              },
              required: ["pattern", "context"],
            },
          },
          growthSummary: {
            type: Type.STRING,
            description: "Warm synthesis of observed progress",
          },
        },
        required: ["observations", "reflectionPrompts", "patterns", "growthSummary"],
      },
    },
  }));

  const rawJson = response.text?.trim();
  if (!rawJson) {
    throw new Error("Unable to generate AI growth insights.");
  }

  const parsed = JSON.parse(rawJson);

  // Compute local stats deterministically
  const moodDistribution: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};

  journals.forEach((j) => {
    if (j.mood) {
      moodDistribution[j.mood] = (moodDistribution[j.mood] || 0) + 1;
    }
    if (Array.isArray(j.topics)) {
      j.topics.forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    }
  });

  const recurringTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));

  return {
    observations: Array.isArray(parsed.observations) ? parsed.observations.slice(0, 6) : [],
    reflectionPrompts: Array.isArray(parsed.reflectionPrompts) ? parsed.reflectionPrompts.slice(0, 5) : [],
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 5) : [],
    recurringTopics,
    moodDistribution,
    growthSummary: parsed.growthSummary || "Continue your reflection practice to unlock deeper long-term trajectories.",
  };
}
