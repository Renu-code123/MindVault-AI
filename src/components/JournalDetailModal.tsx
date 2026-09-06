import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Smile,
  Tag,
  Clock,
  Trash2,
  Lock,
  Download,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase.ts";
import { JournalEntry } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface JournalDetailModalProps {
  journal: JournalEntry | null;
  onClose: () => void;
  onDeleted: (journalId: string) => void;
}

export function JournalDetailModal({ journal, onClose, onDeleted }: JournalDetailModalProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<"summary" | "transcript">("summary");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!journal) return null;

  // Calculate word count & reading time
  const fullText = `${journal.title} ${journal.summary} ${journal.conversation?.map((m) => m.content).join(" ") || ""}`;
  const wordCount = fullText.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    const path = `users/${user.uid}/journals/${journal.id}`;

    try {
      const docRef = doc(db, "users", user.uid, "journals", journal.id);
      await deleteDoc(docRef);
      onDeleted(journal.id);
      onClose();
    } catch (err: unknown) {
      setDeleting(false);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleCopySummaryOnly = () => {
    navigator.clipboard.writeText(journal.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExportMarkdown = () => {
    const md =
      `# ${journal.title}\n\n` +
      `**Date**: ${new Date(journal.createdAt).toLocaleString()}\n` +
      `**Mood**: ${journal.mood}\n` +
      `**Topics**: ${journal.topics?.join(", ") || ""}\n` +
      `**Tags**: ${journal.tags?.join(", ") || ""}\n\n` +
      `## Executive Summary\n\n${journal.summary}\n\n` +
      `## Dialogue Transcript\n\n` +
      (journal.conversation || [])
        .map((m) => `### ${m.role === "user" ? "You" : "MindVault AI"}\n\n${m.content}\n`)
        .join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${journal.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-850/60 shrink-0">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-medium text-[11px]">
                <Smile className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>{journal.mood}</span>
              </span>

              <span className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px]">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>
                  {new Date(journal.createdAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </span>

              <span className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{readingTimeMinutes} min read &middot; {wordCount} words</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 leading-snug">
              {journal.title}
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 ml-4">
            <button
              onClick={handleExportMarkdown}
              title="Download as Markdown file"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
            >
              {copiedMd ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Download className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveViewTab("summary")}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeViewTab === "summary"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Executive Synthesis</span>
          </button>
          <button
            onClick={() => setActiveViewTab("transcript")}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeViewTab === "transcript"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Dialogue & Notes ({journal.conversation?.length || 0})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeViewTab === "summary" ? (
            <>
              {/* Executive Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-5 sm:p-6 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Distilled Reflection Synthesis
                  </h3>
                  <button
                    onClick={handleCopySummaryOnly}
                    title="Copy summary"
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center space-x-1 px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer"
                  >
                    {copiedSummary ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {journal.summary}
                </p>
              </div>

              {/* Topics and Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 bg-white dark:bg-slate-850 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Identified Topics</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.topics?.map((topic, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800/40"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 bg-white dark:bg-slate-850 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Categorization Tags</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Complete Dialogue Transcript Replay */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Reflection Records ({journal.conversation?.length || 0} turns)
                </h3>
                <span className="text-[11px] text-slate-400">Chronological view</span>
              </div>

              <div className="space-y-3">
                {journal.conversation?.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 ${
                        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                          isUser
                            ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                        }`}
                      >
                        {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                          isUser
                            ? "bg-slate-900 dark:bg-amber-500/20 text-white dark:text-amber-100 rounded-tr-none shadow-xs border dark:border-amber-500/30"
                            : "bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security & Firestore Path Verification Info */}
          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center space-x-2 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Firestore Doc: users/{user?.uid}/journals/{journal.id}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between shrink-0">
          {confirmDelete ? (
            <div className="flex items-center space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-rose-700 dark:text-rose-400 font-medium">Permanently delete this entry?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Entry</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
