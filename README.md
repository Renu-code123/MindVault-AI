# 🔐 MindVault AI

> **Private AI-powered journaling and personal reflection — Secure by architecture, isolated by design.**

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%20AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Auth%20%26%20DB-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Security](https://img.shields.io/badge/Architecture-Zero--Trust-10B981)](https://en.wikipedia.org/wiki/Zero_trust_security_model)

---

## 📖 Overview

MindVault AI is a **security-first, full-stack journaling application** built for the **Gen AI Academy APAC Edition Ideathon**. It combines private multi-turn AI reflection sessions (powered by Gemini) with structured journal archiving and longitudinal growth insights — all within a strict zero-trust security architecture.

Every piece of data is scoped to the authenticated user's UID. No user can access another user's data — enforced at both the database rules level and the server side.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Reflection Chat** | Multi-turn conversation with Gemini to explore emotions, decisions, and goals |
| 📖 **Auto Journal Archiving** | Gemini distills each reflection session into a structured journal entry (title, summary, mood, topics, tags) |
| 📊 **AI Growth Insights** | Longitudinal pattern detection across your journal history — mood rhythms, recurring topics, tailored prompts |
| 🔒 **Security Audit View** | Live interactive demo of the zero-trust architecture with real cross-user isolation tests |
| 🔍 **Journal Vault** | Searchable, filterable journal archive with grid/list views and JSON export |
| 🎵 **Zen Soundscapes** | Ambient audio (rain, ocean waves, brown noise, theta binaural) for focus during reflection |
| 🎤 **Voice Dictation** | Web Speech API integration for hands-free reflection input |
| 🌙 **Midnight / Sanctuary Themes** | Full dark/light mode with persistent user preference |

---

## 🛡️ Security Architecture

This app was designed with a **Security-First Engineering Constitution**:

```
Browser (React)
    │
    │  Firebase ID Token (Bearer)
    ▼
Express Server (Node.js)  ←── GEMINI_API_KEY never leaves here
    │
    ├── /api/gemini/chat       → Gemini Flash (reflection)
    ├── /api/gemini/summarize  → Gemini Flash (journal distillation)
    └── /api/gemini/insights   → Gemini Flash (growth analysis)
    │
    ▼
Firestore: users/{uid}/journals/{journalId}
           users/{uid}/insights/{insightId}
```

### Security Controls

- ✅ **Server-Side Secret Isolation** — Gemini API key is never exposed to the browser bundle
- ✅ **User Data Isolation** — All Firestore paths are strictly scoped to `users/{uid}`
- ✅ **Hardened Firestore Rules** — Zero cross-user access permitted at the database level
- ✅ **Firebase Auth (Google OAuth)** — UID is the authoritative identity anchor
- ✅ **Input Sanitization & Payload Limits** — All API inputs are validated, trimmed, and length-capped
- ✅ **Secure HTTP Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- ✅ **No Stack Trace Leakage** — Global error handler returns opaque error messages only

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express, TypeScript (`tsx`) |
| **AI** | Google Gemini (`gemini-2.0-flash`) via `@google/genai` |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Cloud Firestore |
| **Build** | Vite (frontend), esbuild (server bundle) |
| **Animations** | Motion (Framer Motion) |

---

## 📁 Project Structure

```
MindVault-AI/
├── src/
│   ├── components/
│   │   ├── ChatReflectionView.tsx     # Multi-turn AI reflection chat
│   │   ├── DashboardView.tsx          # Home dashboard with metrics
│   │   ├── InsightsView.tsx           # AI Growth Insights
│   │   ├── JournalListView.tsx        # Searchable journal archive
│   │   ├── JournalDetailModal.tsx     # Journal entry detail & replay
│   │   ├── SecurityAuditView.tsx      # Zero-trust live audit demo
│   │   ├── ProfileView.tsx            # User identity & vault stats
│   │   ├── LoginView.tsx              # Auth landing page
│   │   └── Navigation.tsx             # Sidebar + mobile nav
│   ├── context/
│   │   ├── AuthContext.tsx            # Firebase Auth state
│   │   └── ThemeContext.tsx           # Dark/light theme
│   ├── utils/
│   │   ├── ambientSound.ts            # Web Audio API soundscapes
│   │   └── speechRecognition.ts       # Web Speech API
│   ├── firebase.ts                    # Firebase client init
│   ├── types.ts                       # Shared TypeScript types
│   └── App.tsx                        # Root app & layout
├── server/
│   ├── gemini.ts                      # Gemini API server-side logic
│   └── secrets.ts                     # Secure key resolution
├── server.ts                          # Express server entry point
├── firestore.rules                    # Firestore security rules
├── vite.config.ts                     # Vite build config
├── tsconfig.json                      # TypeScript config
└── package.json
```

---

## 🚀 Getting Started (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file based on `.env.example`:

```env
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Start development

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server (Express + Vite)
npm run build      # Build frontend (Vite) + server (esbuild)
npm run start      # Run production server
npm run lint       # TypeScript type check (tsc --noEmit)
npm run preview    # Preview Vite production build
```

---

## 🏆 Ideathon Context

Built for the **Gen AI Academy APAC Edition Ideathon** as a demonstration of:
- Production-grade security architecture with Google AI
- Zero-trust principles applied to an AI-powered consumer app
- Responsible AI design (user data isolation, no cross-contamination)
- Full-stack integration of Firebase Auth + Firestore + Gemini API

---

## 📄 License

This project was created for the Gen AI Academy APAC Ideathon. All rights reserved.
