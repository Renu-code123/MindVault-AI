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
| 🤖 **AI Reflection Chat** | Multi-turn conversation with Gemini to explore emotions, decisions, and personal goals |
| 📖 **Auto Journal Archiving** | Gemini distills each reflection session into a structured journal entry (title, summary, mood, topics, tags) |
| 📊 **AI Growth Insights** | Longitudinal pattern detection across journal history — mood rhythms, recurring topics, tailored prompts |
| 🔒 **Security Audit View** | Interactive zero-trust architecture demonstration with cross-user isolation verification |
| 🔍 **Journal Vault** | Searchable, filterable journal archive with grid/list views and JSON export |
| 🎵 **Zen Soundscapes** | Ambient audio (rain, ocean waves, brown noise, theta binaural) for focus during reflection |
| 🎤 **Voice Dictation** | Web Speech API integration for hands-free reflection input |
| 🌙 **Midnight / Sanctuary Themes** | Full dark/light mode with persistent user preference |

---

## 🛡️ Security Architecture

MindVault AI follows a strict **zero-trust design**:

```
Browser (React)
    │
    │  Firebase ID Token (Bearer)
    ▼
Express Server (Node.js)  ←── GEMINI_API_KEY isolated server-side
    │
    ├── /api/gemini/chat       → Gemini Flash (reflection)
    ├── /api/gemini/summarize  → Gemini Flash (journal distillation)
    └── /api/gemini/insights   → Gemini Flash (growth analysis)
    │
    ▼
Firestore: users/{uid}/journals/{journalId}
           users/{uid}/insights/{insightId}
```

### Key Security Controls

- ✅ **Server-Side Secret Isolation** — Gemini API key is never exposed to the browser
- ✅ **User Data Isolation** — All database paths are strictly scoped to `users/{uid}`
- ✅ **Hardened Firestore Rules** — Cross-user data access is blocked at the database layer
- ✅ **Firebase Authentication** — Google OAuth UID is the authoritative identity anchor
- ✅ **Input Sanitization** — All API inputs are validated and length-capped
- ✅ **Secure HTTP Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express, TypeScript |
| **AI Engine** | Google Gemini (`gemini-2.0-flash`) via `@google/genai` |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Cloud Firestore |
| **Animations** | Motion (Framer Motion) |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API key

Copy `.env.example` to `.env` and add your Gemini API key:

```env
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Start app

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🏆 Ideathon Highlights

Built for the **Gen AI Academy APAC Edition Ideathon** demonstrating:
- Production-grade security architecture with Google AI
- Zero-trust principles applied to an AI-powered consumer app
- Responsible AI design with complete user data isolation
- Full-stack integration of Firebase Auth + Firestore + Gemini API

---

## 📄 License

Created for the Gen AI Academy APAC Ideathon. All rights reserved.
