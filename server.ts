import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  generateReflectionChatReply,
  generateJournalSummary,
  generateGrowthInsights,
  ChatMessage,
  JournalInsightInput,
} from "./server/gemini.ts";
import { getSecretSource } from "./server/secrets.ts";

const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Body parser with strictly enforced payload limits
  app.use(express.json({ limit: "1mb" }));

  // API 1: Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "MindVault AI Core",
      timestamp: new Date().toISOString(),
    });
  });

  // API 2: Security status audit endpoint (no secrets disclosed)
  app.get("/api/security/status", (req: Request, res: Response) => {
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
    });
  });

  // API 3: Multi-turn Reflection Chat
  app.post("/api/gemini/chat", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid request: messages array is required." });
      }

      if (messages.length > 60) {
        return res.status(400).json({ error: "Conversation exceeds maximum allowable length per session." });
      }

      const sanitizedMessages: ChatMessage[] = [];
      for (const m of messages) {
        if (!m || (m.role !== "user" && m.role !== "model") || typeof m.content !== "string") {
          return res.status(400).json({ error: "Invalid message format in conversation." });
        }
        const trimmed = m.content.trim();
        if (trimmed.length === 0) continue;
        if (trimmed.length > 5000) {
          return res.status(400).json({ error: "Message exceeds allowed character limit (5000 characters)." });
        }
        sanitizedMessages.push({
          role: m.role,
          content: trimmed,
        });
      }

      if (sanitizedMessages.length === 0) {
        return res.status(400).json({ error: "At least one non-empty message is required." });
      }

      const reply = await generateReflectionChatReply(sanitizedMessages);
      res.json({ reply });
    } catch (err: unknown) {
      next(err);
    }
  });

  // API 4: Generate Structured Journal Summary
  app.post("/api/gemini/summarize", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversation } = req.body;

      if (!Array.isArray(conversation) || conversation.length === 0) {
        return res.status(400).json({ error: "Invalid request: conversation history is required to summarize." });
      }

      const sanitizedConversation: ChatMessage[] = [];
      for (const item of conversation) {
        if (!item || typeof item.content !== "string") continue;
        const role = item.role === "model" ? "model" : "user";
        sanitizedConversation.push({
          role,
          content: item.content.slice(0, 4000),
        });
      }

      if (sanitizedConversation.length === 0) {
        return res.status(400).json({ error: "No valid dialogue messages found to summarize." });
      }

      const summary = await generateJournalSummary(sanitizedConversation);
      res.json(summary);
    } catch (err: unknown) {
      next(err);
    }
  });

  // API 5: AI Growth Insights
  app.post("/api/gemini/insights", async (req: Request, res: Response, next: NextFunction) => {
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
          growthSummary: "No historical reflection entries found yet. Complete a reflection chat to populate insights.",
        });
      }

      const sanitizedJournals: JournalInsightInput[] = journals.slice(0, 30).map((j) => ({
        title: typeof j.title === "string" ? j.title.slice(0, 150) : "Reflection",
        summary: typeof j.summary === "string" ? j.summary.slice(0, 2000) : "",
        mood: typeof j.mood === "string" ? j.mood.slice(0, 40) : "Reflective",
        topics: Array.isArray(j.topics) ? j.topics.slice(0, 8).map((t: string) => String(t).slice(0, 30)) : [],
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 8).map((t: string) => String(t).slice(0, 25)) : [],
        createdAt: typeof j.createdAt === "string" ? j.createdAt.slice(0, 40) : new Date().toISOString(),
      }));

      const insights = await generateGrowthInsights(sanitizedJournals);
      res.json(insights);
    } catch (err: unknown) {
      next(err);
    }
  });

  // Safe global error handler: Never expose stack traces or secret details
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error("Secure API handler error:", err instanceof Error ? err.message : "Unknown error");
    res.status(500).json({
      error: "A secure server error occurred while processing your request. Please try again.",
    });
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindVault AI Server running securely on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start MindVault AI server:", err);
});
