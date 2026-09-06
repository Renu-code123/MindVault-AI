import React, { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Lock,
  Volume2,
  VolumeX,
  Headphones,
  Sun,
  Moon,
} from "lucide-react";
import { ActiveTab } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";
import { ambientSound, SoundscapeType } from "../utils/ambientSound.ts";

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  entryCount: number;
}

export function Navigation({ activeTab, setActiveTab, entryCount }: NavigationProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Soundscape state
  const [activeSound, setActiveSound] = useState<SoundscapeType | null>(null);
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const handleToggleSound = (type: SoundscapeType) => {
    if (activeSound === type) {
      ambientSound.stop();
      setActiveSound(null);
    } else {
      ambientSound.play(type, 0.25);
      setActiveSound(type);
    }
  };

  const navItems = [
    { id: "dashboard" as ActiveTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "chat" as ActiveTab, label: "AI Reflection", icon: Sparkles, badge: "New" },
    { id: "journals" as ActiveTab, label: "Journal Vault", icon: BookOpen, count: entryCount },
    { id: "insights" as ActiveTab, label: "Growth Insights", icon: TrendingUp },
    { id: "audit" as ActiveTab, label: "Security Audit", icon: ShieldCheck, badge: "Zero-Trust" },
    { id: "profile" as ActiveTab, label: "Vault Profile", icon: UserIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0 min-h-screen p-5 justify-between select-none transition-colors duration-200"
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-amber-400/10 text-amber-400 dark:text-amber-400 border border-slate-800 dark:border-amber-400/30 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-lg">MindVault</span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Private Reflection Core</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 dark:bg-amber-400/15 text-white dark:text-amber-300 shadow-xs border dark:border-amber-400/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isActive
                          ? "bg-slate-800 dark:bg-amber-400/20 text-amber-300 dark:text-amber-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && !item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? "bg-slate-800 dark:bg-amber-400/20 text-slate-300 dark:text-amber-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zen Ambient Focus Player Widget */}
          <div className="pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Headphones className="w-3.5 h-3.5 text-amber-500" />
                  <span>Zen Soundscapes</span>
                </div>
                {activeSound ? (
                  <button
                    onClick={() => {
                      ambientSound.stop();
                      setActiveSound(null);
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Mute</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Off</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => handleToggleSound("rain")}
                  className={`px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                    activeSound === "rain"
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                >
                  🌧️ Gentle Rain
                </button>
                <button
                  onClick={() => handleToggleSound("ocean")}
                  className={`px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                    activeSound === "ocean"
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                >
                  🌊 Ocean Waves
                </button>
                <button
                  onClick={() => handleToggleSound("brownNoise")}
                  className={`px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                    activeSound === "brownNoise"
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                >
                  🤎 Warm Noise
                </button>
                <button
                  onClick={() => handleToggleSound("binaural")}
                  className={`px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                    activeSound === "binaural"
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                >
                  🧠 Theta Waves
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Security Seal */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user?.displayName || "Authenticated User"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  {user?.uid ? `${user.uid.slice(0, 8)}...` : ""}
                </p>
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 flex items-center space-x-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Zero-Trust UID Scoping Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around transition-colors"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] transition-colors ${
                isActive ? "text-amber-500 dark:text-amber-400 font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`} />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
