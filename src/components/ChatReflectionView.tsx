import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Bot,
  Lock,
  Tag,
  Smile,
  X,
  Copy,
  PenTool,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase.ts";
import { ChatMessage, JournalEntry } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface ChatReflectionViewProps {
  onJournalSaved: (newJournal: JournalEntry) => void;
  initialPrompt?: string;
}

type ReflectionMode = "chat" | "direct";

interface PromptCategory {
  name: string;
  emoji: string;
  prompts: string[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    name: "Clarity & Mindfulness",
    emoji: "🌿",
    prompts: [
      "I'd like to untangle my thoughts about an emotional tension I felt earlier today.",
      "What is something small that brought me peace or grounded me today?",
      "I feel pulled in many directions and want to re-anchor in my core priorities.",
    ],
  },
  {
    name: "Career & Decisions",
    emoji: "🎯",
    prompts: [
      "I have a tough strategic decision to make and want to weigh my core values.",
      "Reflecting on a recent feedback or challenge at work and what it reveals.",
      "What is the single most important lever I should focus on this week?",
    ],
  },
  {
    name: "Wins & Gratitude",
    emoji: "🌟",
    prompts: [
      "I want to celebrate a key win or personal breakthrough from today.",
      "Three specific things I am deeply grateful for right now, and why.",
      "A moment today where I felt proud of how I handled myself.",
    ],
  },
  {
    name: "Habits & Growth",
    emoji: "🌱",
    prompts: [
      "Reflecting on my consistency and daily rhythms over the past week.",
      "An unhelpful pattern I noticed recently that I want to gently replace.",
      "Where did I experience resistance today, and what was it trying to teach me?",
    ],
  },
];

const MOOD_OPTIONS = [
  { label: "Reflective", emoji: "💭", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { label: "Grateful", emoji: "🙏", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { label: "Calm", emoji: "🌊", color: "bg-sky-50 text-sky-800 border-sky-200" },
  { label: "Energized", emoji: "⚡", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { label: "Focused", emoji: "🎯", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { label: "Anxious", emoji: "🌪️", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "Fatigued", emoji: "🌙", color: "bg-purple-50 text-purple-800 border-purple-200" },
];

export function ChatReflectionView({ onJournalSaved, initialPrompt }: ChatReflectionViewProps) {
  const { user } = useAuth();

  const [mode, setMode] = useState<ReflectionMode>("chat");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  // Chat mode states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(initialPrompt || "");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Direct journal entry states
  const [directTitle, setDirectTitle] = useState("");
  const [directContent, setDirectContent] = useState("");
  const [directMood, setDirectMood] = useState("Reflective");
  const [directTags, setDirectTags] = useState<string[]>(["#reflection", "#growth"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [directSaving, setDirectSaving] = useState(false);
  const [directAnalyzing, setDirectAnalyzing] = useState(false);

  // Summary preview modal state before final saving
  const [summaryPreview, setSummaryPreview] = useState<{
    title: string;
    summary: string;
    mood: string;
    topics: string[];
    tags: string[];
  } | null>(null);

  const [savingToVault, setSavingToVault] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      setMode("chat");
    }
  }, [initialPrompt]);

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || loading) return;

    if (text.length > 4000) {
      setError("Message exceeds 4000 characters limit.");
      return;
    }

    setError(null);
    setInputText("");

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text, timestamp: new Date().toISOString() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Call server-side API (Gemini API key is strictly hidden on server)
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Reflection service returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: "model",
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to communicate with reflection partner.");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeReflection = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate structured reflection summary.");
      }

      const summaryData = await res.json();
      setSummaryPreview(summaryData);
    } catch (err: unknown) {
      console.error("Summary error:", err);
      setError(err instanceof Error ? err.message : "Unable to synthesize reflection summary.");
    } finally {
      setSummarizing(false);
    }
  };

  // Analyze direct journal text with Gemini
  const handleAnalyzeDirectEntry = async () => {
    if (!directContent.trim()) {
      setError("Please write some reflection content before analyzing.");
      return;
    }
    setDirectAnalyzing(true);
    setError(null);

    try {
      const pseudoConversation: ChatMessage[] = [
        { role: "user", content: `${directTitle ? directTitle + "\n\n" : ""}${directContent}` },
      ];

      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: pseudoConversation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze entry.");
      }

      const summaryData = await res.json();
      setSummaryPreview({
        title: directTitle.trim() || summaryData.title,
        summary: summaryData.summary,
        mood: summaryData.mood || directMood,
        topics: summaryData.topics,
        tags: Array.from(new Set([...directTags, ...summaryData.tags])),
      });
    } catch (err: unknown) {
      console.error("Direct entry analysis error:", err);
      setError(err instanceof Error ? err.message : "Unable to analyze entry with AI.");
    } finally {
      setDirectAnalyzing(false);
    }
  };

  // Save direct journal entry immediately to Firestore
  const handleSaveDirectDirectly = async () => {
    if (!user) return;
    if (!directContent.trim()) {
      setError("Please write some reflection content before saving.");
      return;
    }

    setDirectSaving(true);
    setError(null);

    const journalId = `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const journalPath = `users/${user.uid}/journals/${journalId}`;
    const title = directTitle.trim() || `Reflection - ${new Date().toLocaleDateString()}`;

    const newEntry: JournalEntry = {
      id: journalId,
      userId: user.uid,
      title: title.slice(0, 190),
      summary: directContent.trim().slice(0, 3900),
      mood: directMood,
      topics: ["Personal Reflection"],
      tags: directTags,
      conversation: [
        {
          role: "user",
          content: directContent.trim(),
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryType: "direct",
    };

    try {
      const docRef = doc(db, "users", user.uid, "journals", journalId);
      await setDoc(docRef, newEntry);

      onJournalSaved(newEntry);
      setDirectTitle("");
      setDirectContent("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, journalPath);
    } finally {
      setDirectSaving(false);
    }
  };

  const handleConfirmSaveToVault = async () => {
    if (!user || !summaryPreview) return;
    setSavingToVault(true);
    setError(null);

    const journalId = `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const journalPath = `users/${user.uid}/journals/${journalId}`;

    const conversationToSave =
      mode === "chat" && messages.length > 0
        ? messages
        : [
            {
              role: "user" as const,
              content: directContent || summaryPreview.summary,
              timestamp: new Date().toISOString(),
            },
          ];

    const newEntry: JournalEntry = {
      id: journalId,
      userId: user.uid,
      title: summaryPreview.title.slice(0, 190),
      summary: summaryPreview.summary.slice(0, 3900),
      mood: summaryPreview.mood.slice(0, 48),
      topics: summaryPreview.topics.slice(0, 18),
      tags: summaryPreview.tags.slice(0, 18),
      conversation: conversationToSave,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryType: mode,
    };

    try {
      const docRef = doc(db, "users", user.uid, "journals", journalId);
      await setDoc(docRef, newEntry);

      setSaveSuccess(true);
      setSavingToVault(false);
      onJournalSaved(newEntry);

      setTimeout(() => {
        setSummaryPreview(null);
        setSaveSuccess(false);
        if (mode === "chat") {
          setMessages([]);
        } else {
          setDirectTitle("");
          setDirectContent("");
        }
      }, 1200);
    } catch (err: unknown) {
      setSavingToVault(false);
      handleFirestoreError(err, OperationType.CREATE, journalPath);
    }
  };

  const handleResetSession = () => {
    if (messages.length > 0 && !window.confirm("Are you sure you want to start a fresh reflection session?")) {
      return;
    }
    setMessages([]);
    setInputText("");
    setError(null);
    setSummaryPreview(null);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const formatted = newTagInput.startsWith("#") ? newTagInput.trim() : `#${newTagInput.trim()}`;
    if (!directTags.includes(formatted)) {
      setDirectTags([...directTags, formatted]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDirectTags(directTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header & Mode Switcher */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
            {mode === "chat" ? <Sparkles className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{mode === "chat" ? "AI Reflection Dialogue" : "Direct Journal Sanctuary"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Zero-Trust Vault
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {mode === "chat"
                ? "Confidential multi-turn dialogue with Gemini 3.8-Flash"
                : "Distraction-free personal writing canvas with optional AI synthesis"}
            </p>
          </div>
        </div>

        {/* Mode Segmented Control */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="bg-slate-200/70 p-0.5 rounded-lg flex items-center text-xs font-medium">
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === "chat"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Partner</span>
            </button>
            <button
              onClick={() => setMode("direct")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === "direct"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Direct Journal</span>
            </button>
          </div>

          {mode === "chat" && messages.length > 0 && (
            <button
              onClick={handleResetSession}
              title="Reset conversation"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {mode === "chat" && (
            <button
              id="save-reflection-btn"
              onClick={handleSynthesizeReflection}
              disabled={messages.length === 0 || summarizing || loading}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              {summarizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Synthesize to Vault</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: CHAT DIALOGUE */}
      {mode === "chat" && (
        <>
          {/* Message Stream Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto py-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 mb-3 shadow-2xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-slate-900 mb-1">
                  What is occupying your mind today?
                </h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
                  MindVault AI is your private sounding board. Choose an inquiry archetype below or start with your own open reflection.
                </p>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-4 w-full">
                  {PROMPT_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(idx)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        selectedCategory === idx
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="mr-1">{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Starter Prompt Cards */}
                <div className="grid grid-cols-1 gap-2.5 w-full text-left">
                  {PROMPT_CATEGORIES[selectedCategory].prompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(prompt);
                        handleSendMessage(prompt);
                      }}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs text-slate-700 font-medium transition-all text-left shadow-2xs flex items-center justify-between group cursor-pointer"
                    >
                      <span className="leading-relaxed">{prompt}</span>
                      <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 ml-3 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isUser
                          ? "bg-slate-900 text-white"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed relative group ${
                        isUser
                          ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Footer: timestamp + copy button */}
                      <div
                        className={`text-[10px] mt-2 flex items-center justify-between pt-1 border-t ${
                          isUser ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyMessage(msg.content, index)}
                          title="Copy text"
                          className={`p-1 rounded opacity-70 hover:opacity-100 transition-opacity ${
                            isUser ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-500"
                          }`}
                        >
                          {copiedIndex === index ? (
                            <span className="text-emerald-400 font-medium text-[10px]">Copied!</span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-slate-500 font-medium">Reflecting thoughtfully...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Input Composer */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="space-y-2"
            >
              <div className="relative flex items-center">
                <textarea
                  id="chat-input-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder="What thoughts, goals, or experiences are you contemplating? (Press Enter to send)"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors"
                />

                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 transition-all cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Isolated server-side &middot; Press Enter to send (Shift+Enter for new line)</span>
                </div>
                <span>{inputText.length} / 4000</span>
              </div>
            </form>
          </div>
        </>
      )}

      {/* MODE 2: DIRECT JOURNAL CANVASS */}
      {mode === "direct" && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col space-y-5 bg-white">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Entry encrypted and saved into your private vault!</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-xs underline font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {/* Mood Selector Row */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Smile className="w-3.5 h-3.5 text-slate-500" />
              <span>Current Emotional Tone</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = directMood === mood.label;
                return (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setDirectMood(mood.label)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : `${mood.color} hover:brightness-95`
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Title of this reflection (leave blank for AI title)..."
              value={directTitle}
              onChange={(e) => setDirectTitle(e.target.value)}
              className="w-full text-lg sm:text-xl font-serif font-bold text-slate-900 placeholder:text-slate-300 border-b border-slate-200 pb-2 focus:border-slate-800 focus:outline-none transition-colors"
            />
          </div>

          {/* Writing Canvas */}
          <div className="flex-1 min-h-[220px] relative">
            <textarea
              placeholder="Begin writing freely... Pour out observations, triumphs, questions, or raw thoughts. No judgment, no filters."
              value={directContent}
              onChange={(e) => setDirectContent(e.target.value)}
              className="w-full h-full min-h-[260px] p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 border border-slate-200/90 rounded-xl focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none font-sans"
            />
          </div>

          {/* Tags & Action Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tag Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>Tags:</span>
              </span>
              {directTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  placeholder="+ add tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="text-[11px] px-2 py-0.5 rounded border border-slate-200 w-20 focus:w-28 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center space-x-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleAnalyzeDirectEntry}
                disabled={!directContent.trim() || directAnalyzing || directSaving}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
              >
                {directAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI Polish & Synthesis</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveDirectDirectly}
                disabled={!directContent.trim() || directSaving || directAnalyzing}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
              >
                {directSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Synthesis & Vault Storage Preview */}
      {summaryPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Distilled Journal Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review the structured reflection before storing in your private Firestore vault
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSummaryPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={summaryPreview.title}
                  onChange={(e) => setSummaryPreview({ ...summaryPreview, title: e.target.value })}
                  className="w-full text-base font-semibold text-slate-900 p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Synthesized Summary
                </label>
                <textarea
                  rows={4}
                  value={summaryPreview.summary}
                  onChange={(e) => setSummaryPreview({ ...summaryPreview, summary: e.target.value })}
                  className="w-full text-xs text-slate-700 leading-relaxed p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1 mb-1">
                    <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mood</span>
                  </label>
                  <input
                    type="text"
                    value={summaryPreview.mood}
                    onChange={(e) => setSummaryPreview({ ...summaryPreview, mood: e.target.value })}
                    className="w-full text-xs text-slate-800 p-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1 mb-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Topics</span>
                  </label>
                  <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[36px]">
                    {summaryPreview.topics.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start space-x-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Storage Path: <code className="font-mono text-[10px] bg-slate-200/70 px-1 py-0.5 rounded">users/{user?.uid}/journals</code>. Protected by Firestore security rules.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSummaryPreview(null)}
                disabled={savingToVault}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Back to Editing
              </button>
              <button
                id="confirm-save-journal-btn"
                onClick={handleConfirmSaveToVault}
                disabled={savingToVault || saveSuccess}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingToVault ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved Securely!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirm & Encrypt to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
