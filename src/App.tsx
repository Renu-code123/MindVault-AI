import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase.ts";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.tsx";
import { ActiveTab, JournalEntry } from "./types.ts";
import { Navigation } from "./components/Navigation.tsx";
import { LoginView } from "./components/LoginView.tsx";
import { DashboardView } from "./components/DashboardView.tsx";
import { ChatReflectionView } from "./components/ChatReflectionView.tsx";
import { JournalListView } from "./components/JournalListView.tsx";
import { JournalDetailModal } from "./components/JournalDetailModal.tsx";
import { InsightsView } from "./components/InsightsView.tsx";
import { SecurityAuditView } from "./components/SecurityAuditView.tsx";
import { ProfileView } from "./components/ProfileView.tsx";
import { Lock, Sun, Moon, Sparkles } from "lucide-react";

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>("");

  // Subscribe to real-time updates for authenticated user's isolated journals
  useEffect(() => {
    if (!user) {
      setJournals([]);
      return;
    }

    const journalsPath = `users/${user.uid}/journals`;
    const journalsCol = collection(db, "users", user.uid, "journals");

    const unsubscribe = onSnapshot(
      journalsCol,
      (snapshot) => {
        const list: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<JournalEntry, "id">;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort descending by creation date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJournals(list);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        handleFirestoreError(error, OperationType.LIST, journalsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg mb-4 animate-pulse vault-glow">
          <Lock className="w-7 h-7 stroke-[2.2]" />
        </div>
        <div className="text-base font-semibold tracking-wide text-slate-100">Verifying Vault Session...</div>
        <div className="text-xs text-slate-400 mt-1 font-mono">Establishing authenticated zero-trust connection</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors duration-300">
      {/* Navigation Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "chat") {
            setChatInitialPrompt("");
          }
        }}
        entryCount={journals.length}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Minimal Bar */}
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {activeTab === "dashboard" && "Vault Overview"}
              {activeTab === "chat" && "Reflection Partner"}
              {activeTab === "journals" && "Archive Vault"}
              {activeTab === "insights" && "Growth Insights"}
              {activeTab === "audit" && "Constitution Audit"}
              {activeTab === "profile" && "Vault Identity"}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === "midnight" ? "Switch to Sanctuary Light" : "Switch to Midnight Obsidian"}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === "midnight" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px]">Zero-Trust Active</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
              <span className="hidden sm:inline text-xs">{user.displayName || "Explorer"}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              journals={journals}
              setActiveTab={setActiveTab}
              onSelectJournal={setSelectedJournal}
              onStartWithPrompt={(prompt) => {
                setChatInitialPrompt(prompt);
                setActiveTab("chat");
              }}
            />
          )}

          {activeTab === "chat" && (
            <ChatReflectionView
              onJournalSaved={(newJournal) => {
                setSelectedJournal(newJournal);
              }}
              initialPrompt={chatInitialPrompt}
            />
          )}

          {activeTab === "journals" && (
            <JournalListView
              journals={journals}
              onSelectJournal={setSelectedJournal}
              onStartReflection={() => {
                setChatInitialPrompt("");
                setActiveTab("chat");
              }}
            />
          )}

          {activeTab === "insights" && (
            <InsightsView
              journals={journals}
              onStartReflectionWithPrompt={(prompt) => {
                setChatInitialPrompt(prompt);
                setActiveTab("chat");
              }}
            />
          )}

          {activeTab === "audit" && <SecurityAuditView />}

          {activeTab === "profile" && <ProfileView journals={journals} />}
        </div>
      </main>

      {/* Modal: Detailed Journal & Replay */}
      {selectedJournal && (
        <JournalDetailModal
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
          onDeleted={() => {
            setSelectedJournal(null);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
