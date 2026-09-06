import React, { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  Calendar,
  Smile,
  ArrowUpDown,
  LayoutGrid,
  List,
  Download,
  X,
  Clock,
  PenTool,
  MessageSquare,
} from "lucide-react";
import { JournalEntry } from "../types.ts";

interface JournalListViewProps {
  journals: JournalEntry[];
  onSelectJournal: (journal: JournalEntry) => void;
  onStartReflection: () => void;
}

export function JournalListView({
  journals,
  onSelectJournal,
  onStartReflection,
}: JournalListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("All");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Collect unique moods
  const uniqueMoods = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => {
      if (j.mood) set.add(j.mood);
    });
    return ["All", ...Array.from(set)];
  }, [journals]);

  // Collect top unique topics
  const topTopics = useMemo(() => {
    const topicMap: Record<string, number> = {};
    journals.forEach((j) => {
      j.topics?.forEach((t) => {
        topicMap[t] = (topicMap[t] || 0) + 1;
      });
    });
    return Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t);
  }, [journals]);

  // Filter and sort entries
  const filteredJournals = useMemo(() => {
    return journals
      .filter((entry) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          entry.title.toLowerCase().includes(query) ||
          entry.summary.toLowerCase().includes(query) ||
          entry.topics?.some((t) => t.toLowerCase().includes(query)) ||
          entry.tags?.some((t) => t.toLowerCase().includes(query));

        const matchesMood = selectedMood === "All" || entry.mood === selectedMood;
        const matchesTopic = selectedTopic === "All" || entry.topics?.includes(selectedTopic);

        return matchesSearch && matchesMood && matchesTopic;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [journals, searchQuery, selectedMood, selectedTopic, sortOrder]);

  const handleExportAll = () => {
    if (journals.length === 0) return;
    const backupData = JSON.stringify(journals, null, 2);
    const blob = new Blob([backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <span>Journal Vault</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              {journals.length} {journals.length === 1 ? "entry" : "entries"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Privately isolated in Cloud Firestore &middot; Accessible only by your authenticated UID
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {journals.length > 0 && (
            <button
              onClick={handleExportAll}
              title="Export complete vault as JSON backup"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Vault</span>
            </button>
          )}

          <button
            onClick={onStartReflection}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="journal-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections by title, summary, or topics..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mood filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="journal-mood-select"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-700 focus:outline-none focus:border-slate-400"
            >
              {uniqueMoods.map((m) => (
                <option key={m} value={m}>
                  Mood: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order toggle */}
          <button
            id="journal-sort-toggle"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </button>

          {/* Grid / List layout toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100/60 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Topic Filter Chips */}
        {topTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter by topic:</span>
            <button
              onClick={() => setSelectedTopic("All")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedTopic === "All"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Topics
            </button>
            {topTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic === selectedTopic ? "All" : topic)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedTopic === topic
                    ? "bg-indigo-900 text-white shadow-2xs"
                    : "bg-indigo-50/70 border border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Journal Cards */}
      {filteredJournals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {journals.length === 0 ? "Your Vault is Clean & Ready" : "No matching reflections"}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {journals.length === 0
                ? "Your private reflection vault is waiting. Begin your first dialogue with Gemini or pen a direct journal entry to begin your timeline."
                : "Try clearing search keywords or resetting topic filters to view all entries."}
            </p>
          </div>
          {journals.length === 0 && (
            <button
              onClick={onStartReflection}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Begin First Reflection</span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJournals.map((journal) => {
            const isDirect = journal.entryType === "direct" || (!journal.conversation || journal.conversation.length <= 1);
            return (
              <div
                key={journal.id}
                onClick={() => onSelectJournal(journal)}
                className="bg-white border border-slate-200/90 hover:border-slate-400/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group space-y-3"
              >
                <div className="space-y-2.5">
                  {/* Header: Mood & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] font-medium">
                      <Smile className="w-3 h-3 text-amber-600" />
                      <span>{journal.mood}</span>
                    </span>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(journal.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold font-serif text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {journal.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {journal.summary}
                  </p>
                </div>

                {/* Footer: Topics & Entry Type */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex flex-wrap gap-1">
                    {journal.topics?.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/60 text-[10px] text-slate-600 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    {isDirect ? (
                      <>
                        <PenTool className="w-3 h-3 text-slate-400" />
                        <span>Direct entry</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{journal.conversation?.length || 0} turns</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {filteredJournals.map((journal) => (
            <div
              key={journal.id}
              onClick={() => onSelectJournal(journal)}
              className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {journal.mood}
                  </span>
                  <h3 className="text-sm font-bold font-serif text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {journal.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {journal.summary}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-400 shrink-0">
                <span className="flex items-center space-x-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(journal.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {journal.conversation?.length || 1} logs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
