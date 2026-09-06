import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Compass,
  Smile,
  Tag,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Lock,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase.ts";
import { JournalEntry, InsightReport } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface InsightsViewProps {
  journals: JournalEntry[];
  onStartReflectionWithPrompt: (prompt: string) => void;
}

export function InsightsView({ journals, onStartReflectionWithPrompt }: InsightsViewProps) {
  const { user } = useAuth();
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Generate or regenerate insights using server-side Gemini
  const fetchInsights = async () => {
    if (journals.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          journals: journals.map((j) => ({
            title: j.title,
            summary: j.summary,
            mood: j.mood,
            topics: j.topics,
            tags: j.tags,
            createdAt: j.createdAt,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Insight generation failed (${res.status})`);
      }

      const data = await res.json();
      const generatedReport: InsightReport = {
        userId: user?.uid || "",
        title: `Growth Trajectory Report - ${new Date().toLocaleDateString()}`,
        observations: data.observations || [],
        reflectionPrompts: data.reflectionPrompts || [],
        patterns: data.patterns || [],
        recurringTopics: data.recurringTopics || [],
        moodDistribution: data.moodDistribution || {},
        growthSummary: data.growthSummary || "",
        createdAt: new Date().toISOString(),
      };

      setReport(generatedReport);

      // Auto-save generated insight into user's isolated Firestore collection
      if (user) {
        const insightId = `insight_${Date.now()}`;
        try {
          const docRef = doc(db, "users", user.uid, "insights", insightId);
          await setDoc(docRef, {
            ...generatedReport,
            id: insightId,
          });
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2500);
        } catch (e) {
          console.warn("Could not archive insight report:", e);
        }
      }
    } catch (err: unknown) {
      console.error("Insight generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate AI growth insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journals.length > 0 && !report && !loading) {
      fetchInsights();
    }
  }, [journals.length]);

  if (journals.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xs transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto vault-glow">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            No reflections to synthesize yet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            AI Growth Insights analyzes the authenticated user's reflections over time to highlight evolving mindsets, recurring friction points, and mood rhythms.
          </p>
        </div>
        <button
          onClick={() => onStartReflectionWithPrompt("I want to begin logging my reflections.")}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-600 shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-slate-950" />
          <span>Start Your First Reflection</span>
        </button>
      </div>
    );
  }

  // Calculate mood distribution percentages
  const totalMoodCount = report
    ? (Object.values(report.moodDistribution) as number[]).reduce((acc: number, c: number) => acc + Number(c), 0)
    : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto transition-colors">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/40 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ideathon Primary Original Feature</span>
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-slate-100">
            AI Growth Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Longitudinal pattern detection across {journals.length} journal {journals.length === 1 ? "entry" : "entries"} &middot; User-isolated analysis
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Archived to Firestore</span>
            </span>
          )}

          <button
            id="regenerate-insights-btn"
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 dark:text-slate-950 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Synthesizing..." : "Refresh Insights"}</span>
          </button>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && !report ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-slate-900 dark:border-amber-400 border-t-amber-400 dark:border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Synthesizing growth trajectory with Gemini Server-Side Core...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Examining recurring topics, mood evolutions, and self-reported challenges within your secure boundary.
          </p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Growth Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Longitudinal Synthesis</span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic">
              &ldquo;{report.growthSummary}&rdquo;
            </p>
          </div>

          {/* Observations & Patterns 2-Column Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calibrated Observations */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Key Observations</span>
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Non-dogmatic</span>
              </div>

              <div className="space-y-3">
                {report.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start space-x-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trajectory & Recurring Patterns */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Observed Trajectories</span>
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{report.patterns.length} patterns</span>
              </div>

              <div className="space-y-3">
                {report.patterns.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    More reflection entries will unlock deeper pattern detection.
                  </p>
                ) : (
                  report.patterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 bg-white dark:bg-slate-800/80"
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{pat.pattern}</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-3">
                        {pat.context}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mood Rhythms & Frequent Themes Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Rhythm Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Mood Rhythm Distribution</span>
              </h3>

              <div className="space-y-2.5">
                {Object.entries(report.moodDistribution).map(([mood, rawCount]) => {
                  const count = Number(rawCount);
                  const percentage = totalMoodCount > 0 ? Math.round((count / totalMoodCount) * 100) : 0;
                  return (
                    <div key={mood} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{mood}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurring Topics Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Core Reflection Topics</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {report.recurringTopics.map(({ topic, count }) => (
                  <div
                    key={topic}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span>{topic}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personalized Self-Reflection Prompts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Tailored Inquiries for Next Session</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generated from your personal growth vector. Click any prompt to launch an interactive reflection session.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.reflectionPrompts.map((prompt, idx) => (
                <div
                  key={idx}
                  onClick={() => onStartReflectionWithPrompt(prompt)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all flex flex-col justify-between group cursor-pointer space-y-3 bg-white dark:bg-slate-850"
                >
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    &ldquo;{prompt}&rdquo;
                  </p>
                  <div className="flex items-center space-x-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-750">
                    <span>Explore this prompt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              All growth models are executed server-side. Insights are scoped strictly to UID <code className="font-mono text-slate-700 dark:text-slate-300">{user?.uid}</code>.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
