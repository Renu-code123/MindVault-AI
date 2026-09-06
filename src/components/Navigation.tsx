import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Lock,
} from "lucide-react";
import { ActiveTab } from "../types.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  entryCount: number;
}

export function Navigation({ activeTab, setActiveTab, entryCount }: NavigationProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard" as ActiveTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "chat" as ActiveTab, label: "AI Reflection", icon: Sparkles, badge: "New" },
    { id: "journals" as ActiveTab, label: "Journal Vault", icon: BookOpen, count: entryCount },
    { id: "insights" as ActiveTab, label: "Growth Insights", icon: TrendingUp },
    { id: "audit" as ActiveTab, label: "Security Audit", icon: ShieldCheck, badge: "Zero-Trust" },
    { id: "profile" as ActiveTab, label: "My Vault Profile", icon: UserIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white/95 backdrop-blur shrink-0 min-h-screen p-5 justify-between select-none"
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-900 tracking-tight text-lg">MindVault</span>
                <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Private Reflection Core</p>
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
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isActive
                          ? "bg-slate-800 text-amber-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && !item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Security Seal */}
        <div className="pt-4 border-t border-slate-200/80 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {user?.displayName || "Authenticated User"}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {user?.uid ? `${user.uid.slice(0, 8)}...` : ""}
                </p>
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 flex items-center space-x-2 text-[11px] text-emerald-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Encrypted UID Isolation Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[11px] transition-colors ${
                isActive ? "text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
