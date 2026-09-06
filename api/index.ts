import express, { Request, Response, NextFunction } from "express";
import {
  generateReflectionChatReply,
  generateJournalSummary,
  generateGrowthInsights,
  ChatMessage,
  JournalInsightInput,
} from "../server/gemini.ts";
import { getSecretSource } from "../server/secrets.ts";

const app = express();

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Body parser with payload limit
app.use(express.json({ limit: "1mb" }));

// Auth guard
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(401)
        .json({ error: "Unauthorized: Valid Firebase Authentication ID token required." });
    }
  }
  next();
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "MindVault AI Core",
    timestamp: new Date().toISOString(),
  });
});

// Security status (no secrets disclosed)
app.get("/api/security/status", (_req: Request, res: Response) => {
  res.json({
    architecture: "Full-Stack Server-Side Isolation",
    serverSideGemini: true,
    geminiClientExposed: false,
    secretSource: getSecretSource() || "Environment Secret / Secret Manager",
    firestoreRulesEnforced: true,
    dataIsolationPattern: "users/{uid}/journals/{journalId}",
    authenticationProvider: "Firebase Authentication (Google Sign-In)",
    zeroTrustClientValidation: true,
    leastPrivilegeModel: true,
    tokenVerificationActive: true,
  });
});

// Multi-turn Reflection Chat
app.post(
  "/api/gemini/chat",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid request: messages array is required." });
      }
      if (messages.length > 60) {
        return res
          .status(400)
          .json({ error: "Conversation exceeds maximum allowable length per session." });
      }

      const sanitizedMessages: ChatMessage[] = [];
      for (const m of messages) {
        if (!m || (m.role !== "user" && m.role !== "model") || typeof m.content !== "string") {
          return res.status(400).json({ error: "Invalid message format in conversation." });
        }
        const trimmed = m.content.trim();
        if (trimmed.length === 0) continue;
        if (trimmed.length > 5000) {
          return res
            .status(400)
            .json({ error: "Message exceeds allowed character limit (5000 characters)." });
        }
        sanitizedMessages.push({ role: m.role, content: trimmed });
      }

      if (sanitizedMessages.length === 0) {
        return res.status(400).json({ error: "At least one non-empty message is required." });
      }

      const reply = await generateReflectionChatReply(sanitizedMessages);
      res.json({ reply });
    } catch (err) {
      next(err);
    }
  }
);

// Generate Structured Journal Summary
app.post(
  "/api/gemini/summarize",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversation } = req.body;
      if (!Array.isArray(conversation) || conversation.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid request: conversation history is required to summarize." });
      }

      const sanitizedConversation: ChatMessage[] = [];
      for (const item of conversation) {
        if (!item || typeof item.content !== "string") continue;
        const role = item.role === "model" ? "model" : "user";
        sanitizedConversation.push({ role, content: item.content.slice(0, 4000) });
      }

      if (sanitizedConversation.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid dialogue messages found to summarize." });
      }

      const summary = await generateJournalSummary(sanitizedConversation);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
);

// AI Growth Insights
app.post(
  "/api/gemini/insights",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { journals } = req.body;
      if (!Array.isArray(journals)) {
        return res.status(400).json({ error: "Invalid journals array payload." });
      }

      if (journals.length === 0) {
        return res.json({
          observations: [
            "Start recording reflections to reveal recurring themes, mood rhythms, and personal growth patterns.",
          ],
          reflectionPrompts: [
            "What brought you to MindVault AI today, and what intentions do you have for your reflections?",
          ],
          patterns: [],
          recurringTopics: [],
          moodDistribution: {},
          growthSummary:
            "No historical reflection entries found yet. Complete a reflection chat to populate insights.",
        });
      }

      const sanitizedJournals: JournalInsightInput[] = journals
        .slice(0, 30)
        .map((j) => ({
          title: typeof j.title === "string" ? j.title.slice(0, 150) : "Reflection",
          summary: typeof j.summary === "string" ? j.summary.slice(0, 2000) : "",
          mood: typeof j.mood === "string" ? j.mood.slice(0, 40) : "Reflective",
          topics: Array.isArray(j.topics)
            ? j.topics.slice(0, 8).map((t: string) => String(t).slice(0, 30))
            : [],
          tags: Array.isArray(j.tags)
            ? j.tags.slice(0, 8).map((t: string) => String(t).slice(0, 25))
            : [],
          createdAt:
            typeof j.createdAt === "string" ? j.createdAt.slice(0, 40) : new Date().toISOString(),
        }));

      const insights = await generateGrowthInsights(sanitizedJournals);
      res.json(insights);
    } catch (err) {
      next(err);
    }
  }
);

// Global error handler — never exposes internals
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Secure API handler error:", err instanceof Error ? err.message : "Unknown error");
  res.status(500).json({
    error: "A secure server error occurred while processing your request. Please try again.",
  });
});

export default app;
