import React from "react";
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Flame,
  ArrowRight,
  Smile,
  Tag,
  Clock,
  Compass,
  CheckCircle2,
  PenTool,
} from "lucide-react";
import { JournalEntry, ActiveTab } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface DashboardViewProps {
  journals: JournalEntry[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectJournal: (journal: JournalEntry) => void;
  onStartWithPrompt?: (prompt: string) => void;
}

const DAILY_PROMPTS = [
  "What is one subtle emotion or bodily sensation you experienced today that deserves attention?",
  "What decision did you make this week that required authentic courage?",
  "Where have you felt tension lately, and what would it look like to grant yourself grace?",
  "Who or what nourished your energy today, and what drained it?",
  "If you stepped back from your immediate to-do list, what is the most meaningful horizon right now?",
];

export function DashboardView({
  journals,
  setActiveTab,
  onSelectJournal,
  onStartWithPrompt,
}: DashboardViewProps) {
  const { user } = useAuth();

  // Compute common topics
  const topicCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  journals.forEach((j) => {
    if (j.mood) moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    if (Array.isArray(j.topics)) {
      j.topics.forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    }
  });

  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Compute primary mood
  const primaryMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Reflective";

  // Compute simple reflection streak (unique days with entries)
  const entryDates = new Set(
    journals.map((j) => new Date(j.createdAt).toISOString().split("T")[0])
  );
  const streakDays = entryDates.size;

  const recentEntries = journals.slice(0, 3);

  // Deterministic daily inquiry based on day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyInquiry = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];

  const handlePromptClick = (prompt: string) => {
    if (onStartWithPrompt) {
      onStartWithPrompt(prompt);
    } else {
      setActiveTab("chat");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Vault Security: Zero-Trust Active (UID: {user?.uid.slice(0, 8)}...)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-900">
            Welcome back, {user?.displayName?.split(" ")[0] || "Reflector"}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed">
            Your private reflection sanctuary is isolated and protected. What would you like to untangle or reflect upon today?
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="hero-start-reflection-btn"
            onClick={() => setActiveTab("chat")}
            className="flex items-center space-x-2.5 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>New Reflection</span>
          </button>
          <button
            id="hero-view-vault-btn"
            onClick={() => setActiveTab("journals")}
            className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>View Vault ({journals.length})</span>
          </button>
        </div>
      </div>

      {/* Daily Reflective Inquiry Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80 flex items-center space-x-1.5">
              <span>Today's Reflective Inquiry</span>
            </div>
            <p className="text-sm sm:text-base font-serif font-medium text-amber-950 italic">
              "{dailyInquiry}"
            </p>
          </div>
        </div>

        <button
          onClick={() => handlePromptClick(dailyInquiry)}
          className="self-start sm:self-auto shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Reflect on this</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Entries</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900">{journals.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Saved in private Firestore path</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Reflection Days</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900">{streakDays} <span className="text-sm font-normal text-slate-500">days</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Consistency across calendar</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Primary Mood</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900 truncate">{journals.length > 0 ? primaryMood : "—"}</p>
          <p className="text-[11px] text-slate-500 mt-1">From synthesized reflections</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Security Posture</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900">Zero-Trust</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">100% Client-Isolation</p>
        </div>
      </div>

      {/* Main Content Split: Recent Entries & Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Entries (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-slate-900">Recent Reflections</h2>
            {journals.length > 0 && (
              <button
                onClick={() => setActiveTab("journals")}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1"
              >
                <span>View all ({journals.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {journals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-slate-900 font-serif">Your journal vault is empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Start your very first multi-turn reflection with MindVault AI. When you finish, Gemini will distill it into a structured journal.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("chat")}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Begin Your First Reflection</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onSelectJournal(entry)}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold font-serif text-slate-900 group-hover:text-amber-800 transition-colors">
                      {entry.title}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium shrink-0">
                      {entry.mood}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {entry.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 gap-2">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {entry.topics?.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200/60 text-slate-600">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Topics & Growth Quick Link */}
        <div className="space-y-6">
          {/* Recurring Topics Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <span>Frequent Topics</span>
              </h3>
              <span className="text-[11px] text-slate-400">Total: {Object.keys(topicCounts).length}</span>
            </div>

            {sortedTopics.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Topics will emerge after your first reflections.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sortedTopics.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                  >
                    <span>{topic}</span>
                    <span className="text-[10px] text-slate-400">({count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Growth Insights Promo Box */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Original Feature</span>
            </div>
            <h3 className="text-base font-bold font-serif">AI Growth Insights</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Uncover trajectory patterns, mood rhythm trends, and personalized inquiry prompts synthesised across your journal history.
            </p>
            <button
              onClick={() => setActiveTab("insights")}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Explore Your Trajectory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

