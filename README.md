<p align="center">
  <img src="./RisseHeader.png" alt="Risse - AI-Powered Robotics Learning Platform" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-Composition_API-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/Laravel_10-Backend_API-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/Google_Gemini-Socratic_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Supabase-pgvector_RAG-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vite-Fast_HMR-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

---

## 📌 Latest Commit Changes

> **Current Commit / Update:** `Socratic AI & UI Polish`  
> **Date:** October 23, 2026  
> **Author:** Justin (`acamad.justin@gmail.com`)

### 🚀 What's New in this Commit:

- [x] **AI System Rules Refinement**: Connected custom Socratic persona (`lib/systemRules.ts`) with strict curriculum boundary guards, metric unit rules, and quotation-based emphasis.
- [x] **Markdown & Bold Text Formatting**: Real-time formatting for chat responses (rendering `**bold**` as bold text and inline code blocks cleanly).
- [x] **Home & Constellation Map**: Restored the original "Your Space" interactive star map with connected nodes, live stats, and explore FAB.
- [x] **Recall Practice System**: Restored full interactive recall session with question cards, short answer evaluation, and summary performance review.
- [x] **Notebooks Chatbot & Attachments**: Fixed file chooser to upload & inspect code files, resolved stream cutoffs, and enabled multi-port fallbacks.
- [x] **Zero Mock Data Mode**: Fresh 0% enrollment progression and persistent localStorage logs for authentic learning.
- [x] **Overall**: Merged na po ser

<details>
<summary><b>📜 Previous Commit History (Click to expand)</b></summary>

<br>

#### `Commit: Full Workspace & Design System Merge`

- Combined original "Your Space" and "Notebooks" components with Modules roadmap and Profile portfolios.
- Harmonized the signature orange pill navigation sidebar across all application views.
- Implemented Supabase vector retrieval pipeline (`match_curriculum`) powered by `gemini-embedding-001`.
- Cleaned up obsolete templates and unified layout layers.

</details>

---

## 🌟 Key Features

### 🌌 1. Your Space (Constellation Map)

- **Interactive Star Chart**: Visual nodes representing core robotics concepts (_Microcontrollers_, _Sensors_, _Actuation_, _Control Loops_, _PID_, _Tuning_, etc.).
- **Concept Inspector & Recall Practice**: Select any star to review due recall cards and launch into full-screen practice quizzes.
- **Deep Space Aesthetics**: Layered SVG nebula gradients, procedural starfields, and ambient glow.

### 🤖 2. Socratic AI Learning Guide (Risse AI)

- **Strict Socratic Teaching**: Prompts students with targeted, guiding questions rather than handing out full answers or complete code snippets.
- **Curriculum Grounding (RAG)**: Uses Supabase `pgvector` similarity search to ground all responses in authorized curriculum standards.
- **Out-of-Bounds Topic Guard**: Politely redirects students back to the active module if queries stray outside the curriculum.
- **Quotation Emphasis**: Clean formatting using quotation marks and bold typography rather than raw markdown syntax.

### 📓 3. Notebooks & Engineering Logs

- **Real-time Project Consultation**: Ask questions specific to active projects (_Sumobot_, _Line Tracing_, _Robotics Lab_, etc.).
- **File & Code Inspection**: Attach code scripts (`.ino`, `.c`, `.cpp`, `.py`, `.js`, etc.) or circuit notes directly into chat for AI analysis.
- **Persistent Sessions**: Create, rename, delete, and categorize conversation logs with local persistence.

### 🗺️ 4. Modular Progression & Checkpoints

- **Milestone Roadmaps**: Track checkpoint progression from basic hardware signals to complex PID tuning.
- **Achievement Unlocks**: Earn legendary badges and skill tags upon completing all module milestones.

### 👤 5. Student Profile & Portfolio

- **Skills Showcase**: Real-time demonstration of acquired engineering proficiencies.
- **Badges & Stats**: Track mastered concepts, unlocked achievements, and active robotics project count.

---

## 🛠️ Tech Stack & Architecture

| Layer                  | Technologies                                                                   |
| :--------------------- | :----------------------------------------------------------------------------- |
| **Frontend Framework** | Vue 3 (Composition API, `<script setup>`), Vite                                |
| **Icons & Design**     | Lucide Icons, Custom CSS Design System, Cosmic SVG Layer                       |
| **Backend & API**      | Laravel 10 (PHP), Node.js SSR Chat Proxy                                       |
| **AI & Embeddings**    | Google Gemini (`gemini-3.5-flash-lite`, `gemini-embedding-001`), Vercel AI SDK |
| **Vector Database**    | Supabase (`pgvector`, `match_curriculum` RPC)                                  |

---

## 🚀 Getting Started

### 1. Prerequisites

- **PHP** >= 8.1 & **Composer**
- **Node.js** >= 18.x & **npm**
- Supabase project with `pgvector` enabled and Gemini API key.

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Frontend dependencies
npm install
```

### 4. Ingest Curriculum into Vector Database (Optional)

```bash
npx tsx scripts/ingest.ts
```

### 5. Running the Application

Launch both Laravel and Vite using `start.bat` or manually:

```bash
# Terminal 1: Laravel Backend
php artisan serve

# Terminal 2: Vite Dev Server & Chat Streamer
npm run dev
```

Visit `http://127.0.0.1:8000` in your browser.

---

## 📄 License

This project is proprietary and developed for Risse Educational Platforms.
