# MathStream

A queue-based computation engine built with Next.js, tRPC, BullMQ, MongoDB, Redis, and Google Gemini AI.

**🚀 Live Demo:** [math-stream-production.up.railway.app](https://math-stream-production.up.railway.app/)

## What is MathStream?

MathStream is a demo app that shows a production-ready queue/worker architecture. Users submit math computations that are processed asynchronously with real-time progress updates. You can choose between classic math calculations or AI-powered computations using Google Gemini.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| API | tRPC v11 + Zod |
| Auth | BetterAuth + Google OAuth |
| Database | MongoDB Native Driver |
| Queue | BullMQ + Redis |
| Cache | Redis |
| AI | AI SDK + Google Gemini |
| Styling | Tailwind CSS + shadcn/ui |
| Monorepo | Turborepo + pnpm |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Web App   │────▶│   MongoDB   │
└─────────────┘     │  (Next.js)  │     └─────────────┘
                    └──────┬──────┘            ▲
                           │                   │
                           ▼                   │
                    ┌─────────────┐     ┌──────┴──────┐
                    │    Redis    │◀───▶│   Worker    │
                    │ Queue+Cache │     │  (BullMQ)   │
                    └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Gemini AI  │
                                        │ (optional)  │
                                        └─────────────┘
```

## Features

- **Parallel Processing**: All 4 operations (add, subtract, multiply, divide) run simultaneously
- **Real-time Progress**: Live progress updates as computations are processed
- **Dual Computation Modes**: Toggle between Classic (math) and AI (Gemini) modes
- **Smart Caching**: Completed computations are cached in Redis
- **Google OAuth**: Secure authentication with BetterAuth

## Project Structure

```
mathstream/
├── apps/
│   ├── web/          # Next.js frontend + tRPC API
│   └── worker/       # BullMQ job processor
├── packages/
│   ├── cache/        # Redis cache utilities
│   ├── db/           # MongoDB client + repositories
│   ├── queue/        # BullMQ queue setup
│   ├── shared/       # Shared types, schemas, config
│   └── typescript-config/
├── docker-compose.yml
└── turbo.json
```

---

## Local Development

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 9 or higher
- **Docker** (for MongoDB and Redis)

### Step 1: Clone and Install

```bash
git clone https://github.com/alazzawimahmoud/math-stream.git
cd mathstream
pnpm install
```

### Step 2: Start MongoDB and Redis

```bash
docker-compose up -d
```

This starts:
- MongoDB on port `27017`
- Redis on port `6379`

### Step 3: Create Environment File

Copy the example environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Then edit `apps/web/.env` with your values:

```env
# Database
MONGODB_URL=mongodb://localhost:27017/mathstream
REDIS_URL=redis://localhost:6379

# Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini AI (from Google AI Studio)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Optional
JOB_DELAY_MS=3000
```

### Step 4: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add this authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### Step 5: Set Up Gemini API (Optional)

> Skip this step if you only want to use Classic computation mode.

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to your `.env` file as `GOOGLE_GENERATIVE_AI_API_KEY`

### Step 6: Run the App

```bash
pnpm dev
```

This starts:
- **Web app** at http://localhost:3000
- **Worker** listening for queue jobs

---

## Quick Start (One Command)

If you have all environment variables configured, you can start everything at once:

```bash
./scripts/dev.sh
```

Or manually:

```bash
pnpm dev:full
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web app and worker in dev mode |
| `pnpm dev:services` | Start MongoDB and Redis via Docker |
| `pnpm dev:full` | Start Docker services + dev servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Run linters |
| `pnpm clean` | Clean build artifacts |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URL` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `BETTER_AUTH_SECRET` | Secret for session encryption (min 32 chars) | Yes |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key | Yes |
| `JOB_DELAY_MS` | Artificial delay for jobs (default: 3000) | No |

---

## Railway Deployment

### Architecture on Railway

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Cloud                           │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Web Service  │  │    Worker     │  │   External    │   │
│  │   (Next.js)   │  │   (BullMQ)    │  │   Services    │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘   │
│          │                  │                               │
│          ▼                  ▼                               │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │    MongoDB    │  │    Redis      │                      │
│  │   (Plugin)    │  │   (Plugin)    │                      │
│  └───────────────┘  └───────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Steps

1. **Push to GitHub**

2. **Create Railway Project**
   - Go to [Railway](https://railway.app/)
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your repository

3. **Add Databases**
   - Click **New** → **Database** → **Add MongoDB**
   - Click **New** → **Database** → **Add Redis**

4. **Configure Web Service**
   - Click **New** → **GitHub Repo** → Select your repo
   - Set **Dockerfile Path**: `apps/web/Dockerfile`

5. **Configure Worker Service**
   - Click **New** → **GitHub Repo** → Select your repo
   - Set **Dockerfile Path**: `apps/worker/Dockerfile`

6. **Set Environment Variables** (for both services)

   | Variable | Value |
   |----------|-------|
   | `MONGODB_URL` | `${{MongoDB.MONGO_URL}}` |
   | `REDIS_URL` | `${{Redis.REDIS_URL}}` |
   | `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | Your Railway web URL |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | From Google AI Studio |

7. **Update Google OAuth Redirect URI**
   - Add: `https://your-app.up.railway.app/api/auth/callback/google`

8. **Deploy** - Railway will build and deploy automatically

### Scaling

To scale the worker, go to Worker service → **Settings** → **Scaling** and increase replicas. Each worker runs with concurrency of 4.

---

## Design Decisions

### Why Queue-Based Architecture?

- **Scalability**: Workers can be scaled independently
- **Reliability**: Failed jobs can be retried
- **Real-time Updates**: Progress tracking for long-running operations

### Why Dual Computation Modes?

- **Classic Mode**: Instant, deterministic results
- **AI Mode**: Demonstrates LLM integration for complex scenarios

---

## License

MIT
