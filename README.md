# ArkComply

**AI-native regulatory compliance intelligence for AI companies and fintechs — gap analysis in seconds, not weeks**

## Problem

EU AI Act is fully operative in 2026. US states pass AI liability bills at 2-3 per month. Fintech compliance teams spend 35-40% of work hours manually monitoring 200+ global regulators for rule changes and mapping those changes to internal controls and contracts. Thomson Reuters Regulatory Intelligence and Ascent RegTech cost $50K+/year — inaccessible to every startup and scale-up that needs this most.

## Solution

ArkComply monitors regulatory feeds from EUR-Lex, US Federal Register, FCA, CBN, and SEC. Claude AI classifies every rule change, generates structured gap analyses against your policy library, and surfaces actionable remediation tasks with one click.

**Market:** $9B+ RegTech segment (2026). Same moment GDPR created the cookie-consent tooling category — a single mandate (EU AI Act) generating a mandatory, not discretionary, $1B+ tooling market.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify v5 + TypeScript |
| Frontend | Next.js 15 App Router + Tailwind CSS |
| Database | Neon Postgres + pgvector |
| AI | Claude API (Anthropic) |
| Auth | JWT (bcrypt, @fastify/jwt) |
| Deployment | Vercel (web) + Railway (API) |

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Edit both .env files with your credentials

# 3. Run the database schema
psql $DATABASE_URL -f apps/api/src/db/schema.sql

# 4. Start API server
cd apps/api && npx tsx src/index.ts

# 5. Start web app (separate terminal)
cd apps/web && npm run dev
```

## Environment Variables

### API (apps/api/.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### Web (apps/web/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## MVP Features

1. **Quick Analysis** — Paste any EU AI Act article or US Federal Register notice; Claude returns a structured gap analysis in under 10 seconds
2. **Policy Library** — Upload up to 5 company policy PDFs; Claude extracts control statements and indexes them for semantic matching
3. **Risk Dashboard** — All identified gaps with severity badges (Critical / High / Medium), regulation source, and recommended remediation actions
4. **Remediation Tasks** — One-click Claude-drafted remediation tasks with regulatory citations and due date suggestions
5. **Audit Trail** — Every gap analysis and remediation task stored as an immutable append-only record in Neon Postgres

## Hackathon

**TechEx Amsterdam Hackathon — AI & Big Data Expo Europe**
- URL: https://lablab.ai/ai-hackathons/techex-amsterdam-hackathon
- The live demo pastes EU AI Act Article 13 and receives a gap analysis against a sample AI product's documentation in under 10 seconds
- Every judge at a conference attended by 8,000+ CTOs and compliance officers works at a company that needs this right now

## Architecture Overview

```
Browser (Next.js) → API (Fastify) → Neon Postgres
                         ↓
                   Claude AI (Anthropic)
                         ↓
                   Gap Analysis Results
                         ↓
                   Audit Log (append-only)
```

See ARCHITECTURE.md for the full system diagram and API reference.
