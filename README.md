# CodeNexus

[![CI](https://github.com/Nikky-SDE/CodeNexus/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikky-SDE/CodeNexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)

**CodeNexus** is a real-time competitive programming platform built for algorithmic problem-solvers. It combines 1v1 live lockout duels (**CodeArena**), Codeforces handle verification and rating synchronization, structured **Wing Editorials** with progressive hints, AI-assisted problem hints, an online multi-language code playground, and real-time community discussions.

Built by **Nikky**.

---

## Key Features

- **CodeArena (1v1 Live Duels):** Elo-based real-time matchmaking over Socket.IO with live Codeforces problem parsing and automated submission verification.
- **Hub & Discussions:** Community feed supporting Markdown, KaTeX math rendering, syntax-highlighted code blocks, `@mentions`, and real-time notifications.
- **Wing Editorials:** Curated problem editorials with progressive, spoiler-free hints.
- **AI Progressive Hints:** Step-by-step problem hints powered by Google Gemini using a user-configured API key stored locally in the browser.
- **Code Playground:** Compile and run C++17, C, Python 3, Java, and JavaScript via Judge0 CE.
- **Contests Hub & Recommender:** Track contests with dedicated discussion channels and discover problems tailored to your Codeforces rating.
- **Codeforces Verification & Sync:** Handle verification via Codeforces submission checks and automated background rating/rank sync using `node-cron`.
- **Direct Messaging & Moderation:** Real-time 1-on-1 chat over Socket.IO and role-based moderation tools.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 5, Tailwind CSS 3, Socket.IO Client, React Markdown, KaTeX, React Syntax Highlighter |
| **Backend** | Node.js (ESM), Express 5, Socket.IO 4, Mongoose 8, JWT (`cookie-parser`), `bcryptjs`, `node-cron`, `nodemailer` |
| **Database** | MongoDB Atlas |
| **Integrations** | Codeforces API, Judge0 CE API, Google OAuth 2.0, Google Gemini API |
| **Deployment** | Render (`render.yaml`) & GitHub Actions CI |

---

## Local Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB instance)

### Installation & Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nikky-SDE/CodeNexus.git
   cd CodeNexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env` (or `backend/.env` and `frontend/.env`) and add your credentials.

4. **Start development servers**
   ```bash
   # Terminal 1 — Backend API & Socket.IO server (http://localhost:5000)
   npm run dev

   # Terminal 2 — Frontend Vite dev server (http://localhost:5173)
   npm run dev:frontend
   ```

5. **Run lint, tests, and production build**
   ```bash
   npm run lint
   npm test
   npm run build --workspace=frontend
   ```

---

## Environment Variables

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | No | Server port (defaults to `5000`) |
| `NODE_ENV` | Backend | Yes (prod) | Set to `production` to serve `frontend/dist` from Express |
| `CLIENT_URL` | Backend | Yes | Frontend origin allowed by CORS |
| `MONGODB_URI` | Backend | Yes | MongoDB connection string |
| `JWT_SECRET` | Backend | Yes | Secret key used to sign JWT session cookies |
| `GOOGLE_CLIENT_ID` | Backend | Optional | Google OAuth 2.0 Client ID |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Optional | Google OAuth 2.0 Client ID exposed to Vite build |
| `VITE_API_URL` | Frontend | Optional | Backend base URL if frontend and backend are hosted separately |
| `JUDGE0_URL` | Backend | Optional | Judge0 API base URL (defaults to `https://ce.judge0.com`) |
| `JUDGE0_API_KEY` | Backend | Optional | Judge0 authentication token |
| `SMTP_HOST` | Backend | Optional | SMTP server hostname for transactional emails |
| `SMTP_PORT` | Backend | Optional | SMTP port (defaults to `587`) |
| `SMTP_SECURE` | Backend | Optional | `true` for port 465 SSL, `false` otherwise |
| `SMTP_USER` | Backend | Optional | SMTP username |
| `SMTP_PASS` | Backend | Optional | SMTP password |
| `SMTP_FROM` | Backend | Optional | Sender display name and email address |

---

## Deployment (Render)

This repository includes a [render.yaml](./render.yaml) Blueprint:

1. Push the repository to GitHub and connect it in the Render Dashboard (**New → Blueprint** or **New → Web Service**).
2. Build and start commands:
   - **Build Command:** `npm install && npm run build --workspace=frontend`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add your production environment variables in the Render **Environment** tab.

---

## License

MIT License — Copyright (c) 2026 Nikky. See [LICENSE](./LICENSE) for details.
