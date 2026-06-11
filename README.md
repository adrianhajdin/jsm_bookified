<div align="center">
  <br />
    <a href="https://youtu.be/NiwawEe92Co" target="_blank">
      <img src="public/readme/readme-hero-new.webp" alt="Project Banner">
    </a>
  <br />

  <div>
<img src="https://img.shields.io/badge/-Next.js_16-000000?style=for-the-badge&logo=Next.js&logoColor=white" />
<img src="https://img.shields.io/badge/-ElevenLabs-FFFFFF?style=for-the-badge&logo=ElevenLabs&logoColor=black" />
<img src="https://img.shields.io/badge/-Vapi-62F6B5?style=for-the-badge&logo=Vapi&logoColor=black" />
<img src="https://img.shields.io/badge/-Clerk-6C47FF?style=for-the-badge&logo=Clerk&logoColor=white" /><br/>
<img src="https://img.shields.io/badge/-MongoDB-47A248?style=for-the-badge&logo=MongoDB&logoColor=white" />
<img src="https://img.shields.io/badge/-Typescript-3178C6?style=for-the-badge&logo=Typescript&logoColor=white" />
<img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=for-the-badge&logo=Tailwind-CSS&logoColor=white" />
<img src="https://img.shields.io/badge/-Shadcn/UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white" />

  </div>

  <h3 align="center">AI Book Companion | Vapi, ElevenLabs</h3>

   <div align="center">
     Build this project step by step with our detailed tutorial on <a href="https://www.youtube.com/watch?v=XUkNR-JfHwo" target="_blank"><b>JavaScript Mastery</b></a> YouTube. Join the JSM family!
    </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔗 [Assets](#links)
6. 🚀 [More](#more)

## 🚨 Tutorial

This repository contains the code corresponding to an in-depth tutorial available on our YouTube channel, <a href="https://www.youtube.com/@javascriptmastery/videos" target="_blank"><b>JavaScript Mastery</b></a>.

If you prefer visual learning, this is the perfect resource for you. Follow our tutorial to learn how to build projects like these step-by-step in a beginner-friendly manner!

<a href="https://youtu.be/NiwawEe92Co" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/1736fca5-a031-4854-8c09-bc110e3bc16d" /></a>

## <a name="introduction">✨ Introduction</a>

Bookified is an AI-powered platform that lets you have real-time voice conversations with your books. Built with Next.js 16, Vapi, and MongoDB, it transforms PDFs into interactive entities using natural voice synthesis. Choose from custom ElevenLabs personas to chat with your library, request summaries, and view live transcripts—all wrapped in a sleek Shadcn UI with Clerk authentication. 

If you're getting started and need assistance or face any bugs, join our active Discord community with over **50k+** members. It's a place where people help each other out.

<a href="https://discord.com/invite/n6EdbFJ" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/618f4872-1e10-42da-8213-1d69e486d02e" /></a>

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Clerk](https://jsm.dev/books-clerk)** is a comprehensive user management and authentication platform. It provides secure, pre-built components for email and social logins, enabling seamless session management and protected routes with minimal configuration.

- **[CodeRabbit](https://jsm.dev/books-coderabbit)** is an AI-powered code review platform that provides contextual, line-by-line feedback on pull requests. It automates the review process by identifying bugs, suggesting optimizations, and ensuring coding standards are met, significantly reducing the manual effort for developers and improving code quality.

- **[ElevenLabs](https://elevenlabs.io/docs)** is an advanced AI audio platform providing lifelike text-to-speech. It powers the voice previews in Bookified, allowing users to hear and select from a variety of natural-sounding AI personas before starting a conversation.

- **[MongoDB](https://www.mongodb.com/docs/)** is a flexible, document-based NoSQL database designed for scalability and developer ease. Combined with Mongoose, it serves as the core storage for user libraries, book metadata, and conversation transcripts.

- **[Next.js](https://nextjs.org/docs)** is a powerful React framework for building full-stack web applications. It handles the core application logic, server-side rendering, and API routes, enabling a fast and responsive interface for the Bookified platform.

- **[Shadcn UI](https://ui.shadcn.com/)** is a collection of re-usable, accessible components built with Tailwind CSS and Radix UI. It allows for the creation of a clean, modular, and professional-grade user interface that is easy to customize and theme.

- **[TypeScript](https://www.typescriptlang.org/)** is a superset of JavaScript that adds static typing, providing better tooling, code quality, and error detection. It ensures the application remains maintainable and robust as the codebase scales.

- **[Vapi](https://jsm.dev/books-vapi)** is a specialized Voice AI platform that enables real-time, low-latency conversational audio. It serves as the primary engine for Bookified, allowing users to have seamless, back-and-forth verbal interactions with their uploaded content.

## <a name="features">🔋 Features</a>

👉 **PDF Upload & Ingestion**: Seamlessly upload PDF books with automated text extraction, intelligent chunking, and high-dimensional embeddings for precise context retrieval.

👉 **Voice-First Conversations**: Engage in natural, real-time voice dialogues with your uploaded books, allowing you to ask questions or explore complex concepts verbally via Vapi.

👉 **AI Voice Personas**: Choose from a variety of distinct AI personalities and hear instant high-fidelity previews powered by ElevenLabs to find the perfect reading companion.

👉 **Smart Summaries & Insights**: Quickly extract the essence of any chapter or request deep-dive summaries, making long-form content more accessible and digestible.

👉 **Session Transcripts**: Keep a complete record of every vocal interaction with auto-generated text transcripts, ensuring you never lose a key insight from your discussions.

👉 **Library Management**: Effortlessly organize and search through your personal uploads or the global collection with a high-performance search interface.

👉 **Auth & Subscription**: Secure user access via email and social login, paired with a robust billing system to manage premium features and platform subscriptions.

And many more, including code architecture and reusability.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/adrianhajdin/jsm_bookified.git
cd jsm_bookified
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=

# CLERK
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# VERCEL BLOB
BLOB_READ_WRITE_TOKEN=

# MONGODB
MONGODB_URI=

# VAPI
NEXT_PUBLIC_VAPI_API_KEY=
VAPI_SERVER_SECRET=

# Google Gemini API for embeddings
GOOGLE_GEMINI_API_KEY=

# ELEVENLABS
ELEVENLABS_API_KEY=

# 60db (alternative voice provider) — see https://docs.60db.ai
# Set NEXT_PUBLIC_VOICE_PROVIDER=60db to route all voice calls through 60db
# instead of Vapi. Leave unset (or set to "vapi") to keep the original path.
NEXT_PUBLIC_VOICE_PROVIDER=
SIXTYDB_API_KEY=
SIXTYDB_API_BASE=https://api.60db.ai
NEXT_PUBLIC_SIXTYDB_LLM_MODEL=60db-tiny
NEXT_PUBLIC_SIXTYDB_DEFAULT_VOICE_ID=
```

## 60db Provider (alongside Vapi)

This repo ships a parallel **60db** voice path so the same UI can run on either
backend. Set `NEXT_PUBLIC_VOICE_PROVIDER=60db` and the app will route the call
through 60db's STT WebSocket + LLM chat completions + TTS WebSocket instead of
Vapi.

| File | Role |
|---|---|
| `hooks/useSixtyDb.ts` | Drop-in shape match for `useVapi` — same `{ status, messages, currentMessage, start, stop, ... }` surface |
| `lib/sixtydb/agent.ts` | Per-turn orchestrator: STT → LLM (with `searchBook` tool) → TTS, plus retrieval fallback |
| `lib/sixtydb/chat-client.ts` | `POST /v1/chat/completions` (model `60db-tiny`) with OpenAI-compatible `tool` pass-through |
| `lib/sixtydb/stt-socket.ts` | `wss://api.60db.ai/ws/stt` browser-mode (linear PCM 16k) |
| `lib/sixtydb/tts-socket.ts` | `wss://api.60db.ai/ws/tts` (LINEAR16 24k) |
| `lib/sixtydb/audio-pipeline.ts` | Mic capture (48k Float32 → 16k Int16) and Web Audio playback |
| `app/api/sixtydb/key/route.ts` | Clerk-gated server route returning the long-lived API key to the browser (60db has no token-mint endpoint yet) |
| `app/api/sixtydb/discovery/route.ts` | Server proxy for `/default-voices`, `/my-voices`, `/tts/models`, `/stt/models` |

**RAG flow** (matches Vapi's tool-call shape):
1. Every LLM turn defines a `searchBook` tool referencing the current book id.
2. If the model emits a tool call → run `searchBookSegments` (Mongo `$text`), feed
   the result back, re-call the model.
3. If the model didn't call the tool but the user clearly asked a content
   question and the reply looks evasive → inject the top-3 segments and retry.

**Security:** `/api/sixtydb/key` ships the long-lived `SIXTYDB_API_KEY` to the
browser (gated by Clerk auth). When 60db exposes a token-mint endpoint, swap
this for a short-lived token.

**Activation diff:**

```env
- NEXT_PUBLIC_VOICE_PROVIDER=
+ NEXT_PUBLIC_VOICE_PROVIDER=60db
+ SIXTYDB_API_KEY=sk_live_...
```

No code changes — `components/VapiControls.tsx` picks the hook from
`VOICE_PROVIDER` at module init, and `components/VoiceSelector.tsx` fetches the
60db voice catalog at runtime via the discovery proxy.


Replace the placeholder values with your real credentials. You can get these by signing up at: [**Clerk**](https://clerk.com), [**Vercel**](https://vercel.com), [**MongoDB**](https://www.mongodb.com), [**Vapi**](https://vapi.ai), [**Google AI Studio**](https://aistudio.google.com), [**ElevenLabs**](https://elevenlabs.io).

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

## <a name="links">🔗 Assets</a>

Assets and snippets used in the project can be found in the **[video kit](https://jsmastery.com/video-kit/8127ec28-61db-4295-a85b-c649df6ee408)**.

<a href="https://jsmastery.com/video-kit/8127ec28-61db-4295-a85b-c649df6ee408" target="_blank">
  <img src="public/readme/readme-videokit.webp" alt="Video Kit Banner">
</a>

## <a name="more">🚀 More</a>

**Advance your skills with Next.js Pro Course**

Enjoyed creating this project? Dive deeper into our PRO courses for a richer learning adventure. They're packed with
detailed explanations, cool features, and exercises to boost your skills. Give it a go!

<a href="https://jsm.dev/books-jsm" target="_blank">
  <img src="public/readme/readme-jsmpro.webp" alt="Project Banner">
</a>
