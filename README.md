# MathStream

A modern queue-based computation engine built with Next.js, tRPC, BullMQ, MongoDB, Redis, and Google Gemini AI.

## Overview

MathStream demonstrates a production-ready queue/worker architecture where users can submit mathematical computations that are processed asynchronously with real-time progress updates. Choose between classic mathematical calculations or AI-powered computations using Google Gemini.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| API | tRPC v11 + Zod |
| Auth | BetterAuth + Google OAuth |
| Database | MongoDB Native Driver + Zod |
| Queue | BullMQ + Redis (concurrency: 4) |
| Cache | Redis (completed computations) |
| AI | AI SDK + Google Gemini |
| Styling | Tailwind CSS + shadcn/ui |
| Monorepo | Turborepo + pnpm |
| Deployment | Railway |

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
- **Real-time Progress**: Randomized progress updates create a dynamic UI experience
- **Dual Computation Modes**: Toggle between Classic (math) and AI (Gemini) modes
- **Smart Caching**: Completed computations are cached in Redis for instant retrieval
- **Google OAuth**: Secure authentication with BetterAuth
- **Error Handling**: Graceful handling of errors (e.g., division by zero)

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
│   └── typescript-config/  # Shared TS configs
├── docker-compose.yml
└── turbo.json
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for MongoDB and Redis)

### Setup

1. **Clone the repository**

```bash
git clone <repo-url>
cd mathstream
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/)
- `GOOGLE_GENERATIVE_AI_API_KEY` from [Google AI Studio](https://aistudio.google.com/)
- `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)

4. **Start local services**

```bash
# Start MongoDB and Redis
docker-compose up -d

# Or use the dev script
./scripts/dev.sh
```

5. **Run development servers**

```bash
pnpm dev
```

This starts:
- Web app at http://localhost:3000
- Worker process listening for jobs

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

### Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `.env` as `GOOGLE_GENERATIVE_AI_API_KEY`

## Design Decisions

### Why Queue-Based Architecture?

- **Scalability**: Workers can be scaled independently
- **Reliability**: Failed jobs can be retried
- **Real-time Updates**: Progress tracking for long-running operations
- **Resource Management**: Control concurrency and prevent overload

### Why BullMQ?

- Redis-backed for persistence and distribution
- Built-in support for concurrency, retries, and job priorities
- Clean API with TypeScript support

### Why Dual Computation Modes?

- **Classic Mode**: Instant, deterministic results for production use
- **AI Mode**: Demonstrates integration with LLMs for complex scenarios
- Users can choose based on their needs

### Why MongoDB?

- Flexible document model for computation results
- Native support in BetterAuth
- Easy to deploy on Railway

### Why Redis for Caching?

- Already used for BullMQ queue
- Sub-millisecond latency
- TTL-based expiration for completed computations

## Available Scripts

```bash
# Development
pnpm dev           # Start all services in dev mode
pnpm dev:services  # Start Docker containers
pnpm dev:full      # Start containers + dev servers

# Build
pnpm build         # Build all packages

# Utilities
pnpm lint          # Run linters
pnpm clean         # Clean build artifacts
```

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

## License

MIT

