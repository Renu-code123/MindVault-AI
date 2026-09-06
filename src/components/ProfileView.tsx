import React, { useState } from "react";
import {
  User as UserIcon,
  Shield,
  LogOut,
  CheckCircle2,
  Copy,
  Lock,
  Calendar,
  BookOpen,
  Database,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { JournalEntry } from "../types.ts";

interface ProfileViewProps {
  journals: JournalEntry[];
}

export function ProfileView({ journals }: ProfileViewProps) {
  const { user, logout } = useAuth();
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Vault Account & Security Identity
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Identity verified by Firebase Authentication &middot; User-isolated Firestore root
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center text-xl font-bold shadow-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user?.displayName || "Authenticated Reflector"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{user?.email || "No email provided"}</p>
              <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-emerald-700 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Google OAuth Session Active</span>
              </div>
            </div>
          </div>

          <button
            id="profile-logout-btn"
            onClick={() => logout()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Vault</span>
          </button>
        </div>

        {/* Identity & Scoping Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Firebase Auth UID
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-800 text-xs truncate max-w-[220px]">
                {user?.uid}
              </span>
              <button
                onClick={handleCopyUid}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Copy UID"
              >
                {copiedUid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Firestore Isolated Path
            </span>
            <div className="flex items-center space-x-1.5 font-mono text-slate-800 text-xs truncate">
              <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>users/{user?.uid.slice(0, 8)}.../journals</span>
            </div>
          </div>
        </div>

        {/* Account Activity Summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Vault Activity Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Total Journal Entries</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{journals.length}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Unique Active Days</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {new Set(journals.map((j) => j.createdAt.split("T")[0])).size}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 block">Security Model</span>
              <span className="text-sm font-bold text-emerald-700 mt-1.5 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Trust</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
