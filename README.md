# 🤖 Scout: Agentic Company Researcher

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

> An intelligent, conversational AI platform for deep company research, strategic account planning, and automated business intelligence gathering.

## 🚀 Access the Live Platform

Interact with Scout’s agentic research capabilities in real time.

**Live URL:**  
🔗 **[https://agentic-company-researcher-web-f8er.vercel.app](https://agentic-company-researcher-web-f8er.vercel.app)**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
- [Design Decisions](#-design-decisions)
- [Evaluation & Testing](#-evaluation--testing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🔭 Overview

**Scout: Agentic Company Researcher** is an AI-powered platform for efficient company analysis and automated account plan generation. It combines conversational interaction with structured data extraction, allowing users to explore organizations naturally while the system compiles accurate, well-organized research in real time. Designed for both quick fact-gathering and deeper exploration, it adapts to any user style and keeps context throughout the conversation.

Whether you're an **Efficient User** who just wants the numbers, or a **Chatty User** who likes to explore ideas, the system adapts to you—not the other way around.

---

## ✨ Key Features

- **🧠 Intelligent Research Agent**: Context-aware conversations that synthesize information and adapt to user personas (Confused, Efficient, Chatty).
- **📊 Dynamic Account Planning**: Real-time updates to structured account plans with Markdown support and dynamic section management.
- **🛡️ Enterprise-Grade Foundation**: Secure Google OAuth, type-safe tRPC API, and robust PostgreSQL database.

---

## 🏗 Architecture & Tech Stack

This project is built as a **Turbo Monorepo**, ensuring modularity, shared configuration, and efficient builds.

### System Architecture

<img width="1359" height="602" alt="light_architecture" src="https://github.com/user-attachments/assets/1cd9488e-f23d-4e79-b15c-b7a7e5c0f1e8" />

### Technology Stack

| Component     | Technology              | Description                            |
| ------------- | ----------------------- | -------------------------------------- |
| **Frontend**  | Next.js 16 (App Router) | React 19, Tailwind CSS, Lucide Icons   |
| **Backend**   | Hono                    | Lightweight, edge-ready Node.js server |
| **API Layer** | tRPC                    | End-to-end type safety without schemas |
| **Database**  | PostgreSQL (Neon)       | Managed serverless Postgres            |
| **ORM**       | Prisma                  | Type-safe database client              |
| **Auth**      | Better Auth             | Secure authentication handling         |
| **Build**     | Turbo & tsup            | High-performance build system          |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **PostgreSQL**: A running instance (or Neon account)
- **Google Cloud Console**: Project with OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/agentic-company-researcher.git
   cd agentic-company-researcher
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   Create `.env` files based on examples:

   **`apps/server/.env`**

   ```env
   DATABASE_URL="postgresql://..."
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   BETTER_AUTH_SECRET="..."
   GEMINI_API_KEY="..."
   CLIENT_URL="http://localhost:3000"
   ```

   **`apps/web/.env.local`**

   ```env
   NEXT_PUBLIC_SERVER_URL="http://localhost:3001"
   ```

4. **Database Initialization**

   ```bash
   # Generate Prisma Client
   pnpm db:generate

   # Push schema to DB
   pnpm db:push
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`

---

## 💡 Design Decisions

### 🧠 Intelligence & Personas

- **System Prompts**: This project uses specialized prompts  
  (`packages/api/src/constants/systemPrompts.ts`) to handle different user types.

  - _Research Assistant_: Helpful and professional
  - _Efficient User_: Direct and data-focused
  - _Confused User_: Educational and guiding
  - _Chatty Partner_: Conversational but goal-oriented
  - _Edge Case Validator_: Graceful error handling

- **Dual-State Architecture**: The system separates **Conversation State** (chat history)
  from **Document State** (structured reports). The AI distinguishes between
  _chatting_ and _fact-finding_ to keep generated documents clean and focused.

- **Adaptive Creativity**: Dynamic temperature control is applied:
  - Low temperature for factual outputs (e.g., revenue)
  - Higher temperature for strategic or creative work (e.g., SWOT analysis)

### 🤖 Model Agnostic LLM Layer

- **Vendor Independence**: Built with Vercel AI SDK to abstract the provider.
- **Task-Specific Routing**: Use different models for different tasks (e.g., Grok for reasoning, Gemini for speed).
- **Future Proofing**: Easily upgrade models via environment variables.

### 🏗️ Engineering & Scalability

- **Turbo Monorepo**: Shared code (`api`, `auth`, `db`) across packages for maintainability.
- **Independent Scaling**: Decoupled frontend (`web`) and backend (`server`).
- **tRPC**: End-to-end type safety without boilerplate. Backend changes trigger immediate frontend errors.

### 🛡️ Trust & Transparency

- **Conflict Detection**: The AI flags conflicting data points instead of guessing.
- **Uncertainty**: The model is trained to admit when it doesn't know something, ensuring intellectual honesty.

---

## 🧪 Evaluation & Testing

The system is designed to handle specific user personas defined in the evaluation criteria:

1. **The Confused User**:
   - _Behavior_: "I don't know what to do."
   - _System Response_: Proactively suggests companies and explains capabilities.
2. **The Efficient User**:

   - _Behavior_: "Give me revenue for Apple, Microsoft, and Google."
   - _System Response_: Returns a table of data immediately without fluff.

3. **The Chatty User**:

   - _Behavior_: Conversational, off-topic.
   - _System Response_: Engages politely but steers back to business goals.

4. **The Edge Case**:
   - _Behavior_: Malformed inputs, system attacks.
   - _System Response_: Graceful error handling and fallback responses.

---

## 🔧 Troubleshooting

| Issue                   | Solution                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| **Build Fails**         | Ensure `pnpm-lock.yaml` is up to date. Run `pnpm install`.         |
| **Auth Redirect 404**   | Check `CLIENT_URL` in server env and Google Console redirect URIs. |
| **Prisma Client Error** | Run `pnpm db:generate` in the root or `packages/db`.               |
| **CORS Errors**         | Verify `cors` middleware config in `apps/server/src/index.ts`.     |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
