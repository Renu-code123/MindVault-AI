import React, { useState } from "react";
import { Lock, ShieldCheck, Key, Database, Sparkles, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export function LoginView() {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle();
    } catch {
      // Error is tracked in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full my-auto">
        {/* Main Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 sm:p-10">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 shadow-sm mx-auto mb-2">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              MindVault <span className="text-amber-600 font-serif">AI</span>
            </h1>
            <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed">
              Private AI-powered journaling and personal reflection. Secure by architecture, isolated by design.
            </p>
          </div>

          {/* Error Notice if any */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline ml-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
              <div className="pt-1">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-rose-900 hover:text-rose-950 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-md transition-colors"
                >
                  <span>Open App in Full Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="space-y-4">
            <button
              id="google-signin-btn"
              onClick={handleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-500 font-medium">
              Authoritative identity managed via Firebase Authentication
            </p>
          </div>

          {/* Security & Privacy Guarantees */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-semibold text-slate-900 tracking-wide uppercase mb-3 text-center">
              Security Architecture Principles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100/80 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">User Data Isolation</span>
                  <p className="text-[11px] text-slate-500">Strict `users/&#123;uid&#125;` path scoping in Firestore</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100/80 flex items-start space-x-2">
                <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Server-Side Secrets</span>
                  <p className="text-[11px] text-slate-500">Gemini keys never exposed to the browser bundle</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100/80 flex items-start space-x-2">
                <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Hardened Rules</span>
                  <p className="text-[11px] text-slate-500">Zero cross-user access allowed in security rules</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100/80 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">AI Growth Insights</span>
                  <p className="text-[11px] text-slate-500">Analyzes only your authenticated reflections</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          MindVault AI &middot; Gen AI Academy APAC Edition Ideathon Project &middot; Zero-Trust Architecture
        </p>
      </div>
    </div>
  );
}
