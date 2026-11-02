<p align="center">
  <img src="./RisseHeader.png" alt="Risse - AI-Powered Robotics Learning Platform" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-Composition_API-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/Laravel_10-Backend_API-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/Google_Gemini-Adaptive_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Supabase-Auth_&_Vector_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vite-Fast_HMR-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

---

## 🤖 Welcome to RISSE AI

**RISSE** is an adaptive, AI-powered robotics learning platform designed to guide students from foundational engineering concepts to competitive robotics mastery. 

Unlike traditional chatbots that simply spit out code or answers, RISSE acts as an **intelligent pair programmer and robotics mentor**. It uses adaptive pedagogical strategies—prompting students with thought-provoking questions when they are learning, providing step-by-step hints when they are stuck, offering immediate fixes during high-stakes competitions, and enforcing strict emergency safety protocols in the lab.

---

## 🚀 What's New in the Latest Release

### 🧠 1. Adaptive Teaching Intelligence (TSS)
The AI tutor is now equipped with an **Adaptive Teaching Strategy Selector** that dynamically adjusts its tutoring style based on the student's context, confidence, and struggle level:

- **Anti-Frustration Safeguard:** If a student struggles repeatedly with a problem (2 or more failed attempts), the AI automatically detects their frustration, stops asking guessing questions, and provides a clear conceptual explanation with worked examples.
- **Direct Explanation on Demand:** When students explicitly ask *"Can you just explain this to me?"*, RISSE respects their request and explains the concept immediately without withholding information.
- **Competition & Pit Mode:** During high-intensity robot matches and pit sessions, Socratic questioning is temporarily paused. The AI delivers direct, rapid technical fixes so teams can repair their robots quickly.
- **Critical Safety Override:** If a student mentions dangerous physical scenarios (e.g., smoking batteries, short circuits, burning components, or overheating motor drivers), the AI immediately triggers an emergency safety procedure to protect the learner.
- **Tailored Learning Modes:**
  - **Discovery & Foundation:** Introduces new topics using intuitive analogies and guided curiosity.
  - **Guided Assistance:** Breaks down challenging formulas and code into manageable, step-by-step milestones.
  - **Mastery & Deepening:** Challenges advanced students with higher-order synthesis and real-world edge cases.
  - **Engineering Lab:** Guides hardware debugging workflows (multimeters, wiring, motor drivers, microcontroller signals).

---

### 🔐 2. Production Authentication & Student Accounts
The platform has officially migrated from temporary local logins to **real, secure Supabase Authentication**:

- **Real Student Accounts:** Create an account with your email and password, log in securely, and enjoy automatic session persistence across page refreshes.
- **Email Verification Support:** Integrated email verification safeguards to ensure valid accounts and secure communication.
- **Dedicated Student Profiles:** Each student receives an auto-provisioned profile, learning preferences, and skill records.
- **Seamless Guest Mode:** Curious visitors can explore the platform and interact with the AI in guest mode without needing to register upfront.

---

### 🛡️ 3. Security, Privacy & Clean Interface
- **Student Data Privacy:** Strong database-level access rules ensure students can only view and update their own learning records and preferences.
- **Tamper Protection:** Sensitive profile information and user roles (Student, Teacher, Admin) cannot be modified or escalated from the browser.
- **Zero Information Leaks:** Diagnostic logs, system API keys, and internal model instructions are kept private on the server and are never exposed in student chat responses.
- **Clean Chat Formatting:** Internal AI directives are automatically filtered out before reaching the screen, ensuring a natural, professional dialogue with Risse.

---

## 🌟 Core Platform Features

### 🌌 1. Your Space (Interactive Constellation Map)
- **Visual Learning Universe:** Navigate robotics concepts visualized as glowing constellation stars (*Microcontrollers*, *Sensors*, *Actuation*, *Control Loops*, *PID Tuning*, etc.).
- **Recall Practice:** Click on any constellation node to review key flashcards, answer recall questions, and reinforce long-term memory.
- **Live Progress Stats:** Watch your personal engineering galaxy light up as you master each module.

### 🤖 2. Adaptive AI Tutor (Risse AI)
- **Curriculum-Grounded Learning (RAG):** Responses are anchored directly in validated robotics curriculum standards using Supabase vector search.
- **Real-Time Streaming:** Responses stream smoothly character-by-character for a snappy, interactive conversational experience.
- **Curriculum Boundaries:** Gently guides off-topic conversations back to relevant robotics and STEM themes.

### 📓 3. Engineering Notebooks & Code Inspection
- **Project-Specific Workspaces:** Create dedicated notebook sessions for different builds (*Sumobot*, *Line Tracing*, *Maze Runner*, etc.).
- **Code & Circuit Review:** Upload or paste code scripts (`.ino`, `.c`, `.cpp`, `.py`, `.js`) and schematic notes directly into chat for feedback and debugging.
- **Persistent Conversation History:** Easily organize, rename, and review past discussions with your AI mentor.

### 🗺️ 4. Modular Roadmaps & Checkpoints
- **Structured Milestones:** Step-by-step progression through hardware fundamentals, motor control, sensor integration, and advanced autonomous robotics.
- **Milestone Checkpoints:** Verify your understanding before unlocking the next stage of the curriculum.

---

## 🎮 AI Teaching Modes at a Glance

| Teaching Mode | When It Activates | How Risse Responds |
| :--- | :--- | :--- |
| **Discovery / Foundation** | Student encounters a new concept for the first time | Uses intuitive real-world analogies and open-ended curiosity prompts. |
| **Guided Assistance** | Student is working through a problem | Provides scaffolded hints one step at a time without spoiling the answer. |
| **Explanation on Demand** | Student asks *"Can you just explain how this works?"* | Delivers a clear, comprehensive technical explanation directly. |
| **Anti-Frustration** | Student struggles on the same step twice in a row | Automatically steps in with the core explanation and a worked example. |
| **Mastery & Deepening** | Student demonstrates solid understanding | Asks challenging transfer questions to test edge cases and system design. |
| **Engineering Lab** | Student reports hardware or wiring issues | Guides systematic physical checks (power, connections, multimeter readings). |
| **Pit / Competition** | High-pressure competition setting | Skips questions and provides immediate, direct, actionable fixes. |
| **Safety Override** | Physical hazard detected (batteries, smoke, sparks) | Halts all tutoring and gives instant emergency disconnect instructions. |

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Vue 3** (Composition API, `<script setup>`), **Vite** |
| **UI & Styling** | **Tailwind CSS**, Custom Space Design System, **Lucide Icons** |
| **Backend & Web APIs** | **Laravel 10** (PHP API) & **Node.js** Streaming Serverless Endpoints |
| **AI Models & Intelligence** | **Google Gemini** (`gemini-3.5-flash-lite`, `gemini-embedding-001`), **Vercel AI SDK** |
| **Database & Vector Search** | **Supabase** (PostgreSQL, `pgvector` RAG, Row-Level Security, Auth) |
| **Quality & Security** | Automated integration tests for pedagogical intelligence and auth security |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 18.x and **npm**
- **PHP** >= 8.1 and **Composer** *(if running the Laravel backend locally)*
- A **Supabase** project and a **Google Gemini API Key**

### 2. Environment Configuration
Create a `.env.local` file in the project root:

```env
# Google Gemini AI Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install PHP dependencies (from root, if using Laravel)
cd ..
composer install
```

### 4. Apply Database Migrations (Supabase)
To set up user profiles, roles, and security policies:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the migration scripts located in `supabase/migrations/`:
   - `20261102000001_core_profiles_roles.sql`
   - `20261102000003_milestone1_final_security_patch.sql`

---

## 🏃 Running the Application

### Option A: Quick Launch (Windows)
Double-click `start.bat` in the project root to start all development services automatically.

### Option B: Manual Launch
Run the frontend and chat streaming server:

```bash
cd frontend
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Testing & Verification

The project includes an automated test suite verifying both teaching intelligence and authentication security:

```bash
# Run all automated tests
npm --prefix frontend test
```

**What the tests verify:**
- ✅ **Teaching Strategy Selector:** Ensures Socratic hints, anti-frustration rescues, explanation requests, competition fixes, and emergency safety overrides trigger appropriately.
- ✅ **Authentication & Authorization:** Verifies real JWT authentication, guest access, expired token rejection, role validation, and database privacy policies.

To run a production build:
```bash
npm --prefix frontend run build
```

---

## 📄 License

This project is developed for **Risse Educational Robotics Platforms**. All rights reserved.
