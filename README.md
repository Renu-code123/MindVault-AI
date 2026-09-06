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
| 📊 **AI Growth Insights** | Longitudinal pattern detection across your entire journal history — mood rhythms, recurring topics, tailored prompts |
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
- ✅ **User Data Isolation** — All Firestore paths are scoped to `users/{uid}`
- ✅ **Hardened Firestore Rules** — Zero cross-user access permitted at the database level
- ✅ **Firebase Auth (Google OAuth)** — UID is the authoritative identity anchor
- ✅ **Input Sanitization & Payload Limits** — All API inputs are validated, trimmed, and length-capped
- ✅ **Secure HTTP Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- ✅ **No Stack Trace Leakage** — Global error handler returns opaque error messages only
- ✅ **Google Cloud Secret Manager** — Optional production-grade secret resolution

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express, TypeScript (`tsx`) |
| **AI** | Google Gemini (`gemini-2.0-flash`) via `@google/genai` |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Cloud Firestore |
| **Secret Management** | Google Cloud Secret Manager / Environment Variables |
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
│   └── secrets.ts                     # Secret Manager / env resolution
├── server.ts                          # Express server entry point
├── firestore.rules                    # Firestore security rules
├── firebase-applet-config.json        # Firebase project config
├── vite.config.ts                     # Vite build config
├── tsconfig.json                      # TypeScript config
└── package.json
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+ or Bun
- A [Gemini API Key](https://aistudio.google.com/app/apikey)
- Firebase project (already configured — see `firebase-applet-config.json`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> The dev server runs both the Express backend and Vite frontend together on port 3000.

---

## 🚢 Deployment

### Option A — Google AI Studio (Fastest)

1. Open your project in [Google AI Studio](https://aistudio.google.com) → Build mode
2. Set `GEMINI_API_KEY` in the **Secrets panel**
3. Click **Deploy** — AI Studio deploys to Cloud Run automatically

### Option B — Google Cloud Run (Production)

```bash
# Build
npm run build

# Store Gemini key in Secret Manager
echo "YOUR_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Deploy
gcloud run deploy mindvault-ai \
  --image gcr.io/YOUR_PROJECT/mindvault-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT,NODE_ENV=production
```

After deploying, add your Cloud Run URL to **Firebase Console → Authentication → Authorized Domains**.

### Option C — Local Production Build

```bash
npm run build
npm run start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini AI API key |
| `GCP_PROJECT_ID` | Optional | Enables Google Cloud Secret Manager |
| `GEMINI_SECRET_NAME` | Optional | Secret name (default: `gemini-api-key`) |
| `NODE_ENV` | Optional | Set to `production` in Cloud Run |

---

## 🔐 Firestore Security Rules

Rules are in [`firestore.rules`](./firestore.rules). Deploy them with:

```bash
firebase deploy --only firestore:rules
```

The rules enforce:
- Users can **only** read/write their own `users/{uid}` path
- No cross-user access is possible at the database level
- All write operations require authentication

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server (Express + Vite)
npm run build      # Build frontend (Vite) + server (esbuild)
npm run start      # Run production build
npm run lint       # TypeScript type check (tsc --noEmit)
npm run preview    # Preview Vite production build
```

---

## 🧠 AI Features — How They Work

### 1. Reflection Chat (`/api/gemini/chat`)
- User sends a free-form thought or uses a curated prompt category
- Gemini responds as a thoughtful, non-prescriptive reflection partner
- Conversation continues for as many turns as needed (up to 60 messages)

### 2. Journal Distillation (`/api/gemini/summarize`)
- When the user clicks "Save as Journal", the full conversation is sent server-side
- Gemini extracts: `title`, `summary`, `mood`, `topics`, `tags`, `keyThemes`
- The structured entry is saved to Firestore under `users/{uid}/journals/{id}`

### 3. Growth Insights (`/api/gemini/insights`)
- Analyzes up to 30 recent journal entries
- Returns: observations, trajectory patterns, mood distribution, recurring topics, and 3 tailored reflection prompts
- The report is auto-saved to `users/{uid}/insights/{id}`

---

## 🎨 Design System

- **Primary palette**: Slate (dark) + Amber (accent)
- **Typography**: Plus Jakarta Sans (body), Newsreader (serif headings)
- **Dark mode**: Midnight Obsidian (`#020617` base)
- **Light mode**: Sanctuary (`slate-50` base)
- **Animations**: Micro-animations, pulse indicators, smooth transitions

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

---

<p align="center">
  Built with ❤️ using <strong>Google Gemini</strong>, <strong>Firebase</strong>, and <strong>React</strong>
</p>
