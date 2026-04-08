# Family OS — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                            │
│                                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐  │
│   │   iOS App     │    │ Android App  │    │        Web Browser               │  │
│   │  (Expo +      │    │  (Expo +     │    │  (Expo Web Export served as      │  │
│   │  React Native)│    │ React Native)│    │   static files from Cloud Run)   │  │
│   └──────┬───────┘    └──────┬───────┘    └────────────────┬─────────────────┘  │
│          │                   │                              │                    │
│          └───────────────────┼──────────────────────────────┘                    │
│                              │                                                   │
│                  ┌───────────▼───────────┐                                       │
│                  │   Expo Router          │                                       │
│                  │   (File-based routing) │                                       │
│                  ├───────────────────────┤                                       │
│                  │   Zustand Store        │                                       │
│                  │   (Client state mgmt)  │                                       │
│                  ├───────────────────────┤                                       │
│                  │   Sync Engine          │                                       │
│                  │   (Remote CRUD ops)    │                                       │
│                  └───────────┬───────────┘                                       │
└──────────────────────────────┼──────────────────────────────────────────────────┘
                               │
                          HTTPS REST API
                               │
┌──────────────────────────────┼──────────────────────────────────────────────────┐
│                     GOOGLE CLOUD PLATFORM                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                     Cloud Run  (me-west1)                               │    │
│  │                                                                         │    │
│  │   ┌───────────────────────────────────────────────────────────────┐     │    │
│  │   │              Docker Container (Node 22 Alpine)                │     │    │
│  │   │                                                               │     │    │
│  │   │   ┌─────────────────────┐   ┌────────────────────────────┐   │     │    │
│  │   │   │  Static Web Files   │   │   Hono API Server (:8080)  │   │     │    │
│  │   │   │  /public/           │   │                            │   │     │    │
│  │   │   │  (Expo web export)  │   │   Routes:                  │   │     │    │
│  │   │   └─────────────────────┘   │   ├─ /v1/auth/*            │   │     │    │
│  │   │                             │   ├─ /v1/family/:id/*      │   │     │    │
│  │   │                             │   │   ├─ grocery           │   │     │    │
│  │   │                             │   │   ├─ chores            │   │     │    │
│  │   │                             │   │   ├─ projects          │   │     │    │
│  │   │                             │   │   ├─ notes             │   │     │    │
│  │   │                             │   │   ├─ kids              │   │     │    │
│  │   │                             │   │   ├─ schedule-blocks   │   │     │    │
│  │   │                             │   │   ├─ members           │   │     │    │
│  │   │                             │   │   ├─ events            │   │     │    │
│  │   │                             │   │   └─ push-tokens       │   │     │    │
│  │   │                             │   ├─ /v1/notifications     │   │     │    │
│  │   │                             │   └─ /health               │   │     │    │
│  │   │                             │                            │   │     │    │
│  │   │                             │   Middleware:              │   │     │    │
│  │   │                             │   ├─ JWT Auth (HS256)      │   │     │    │
│  │   │                             │   └─ Family Authorization  │   │     │    │
│  │   │                             │                            │   │     │    │
│  │   │                             │   ORM: Drizzle             │   │     │    │
│  │   │                             └────────────┬───────────────┘   │     │    │
│  │   │                                          │                   │     │    │
│  │   └──────────────────────────────────────────┼───────────────────┘     │    │
│  │                                              │                         │    │
│  └──────────────────────────────────────────────┼─────────────────────────┘    │
│                                                 │                              │
│  ┌──────────────────────────────┐               │                              │
│  │  Artifact Registry           │               │                              │
│  │  (Docker image storage)      │               │                              │
│  │  me-west1-docker.pkg.dev     │               │                              │
│  └──────────────────────────────┘               │                              │
│                                                 │                              │
└─────────────────────────────────────────────────┼──────────────────────────────┘
                                                  │
                                             Neon HTTP
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │   Neon PostgreSQL           │
                                    │   (Serverless, us-east-1)   │
                                    │                             │
                                    │   Tables:                   │
                                    │   ├─ users                  │
                                    │   ├─ families               │
                                    │   ├─ family_members         │
                                    │   ├─ kids                   │
                                    │   ├─ grocery_items          │
                                    │   ├─ chores                 │
                                    │   ├─ projects               │
                                    │   ├─ notes                  │
                                    │   ├─ schedule_blocks        │
                                    │   ├─ family_events          │
                                    │   ├─ push_tokens            │
                                    │   └─ sent_notifications     │
                                    └────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                              CI/CD PIPELINE
                           (GitHub Actions → GCP)
═══════════════════════════════════════════════════════════════════════════════════

  ┌──────────┐     ┌──────────────────────────────────────────────────────────┐
  │  GitHub   │     │              GitHub Actions Workflow                     │
  │  Repo     │     │              (.github/workflows/deploy.yml)              │
  │           │     │                                                          │
  │  push to  ├────►│  1. Checkout code                                       │
  │  master   │     │                                                          │
  │           │     │  2. Authenticate to GCP                                  │
  └──────────┘     │     └─ google-github-actions/auth (GCP_SA_KEY secret)    │
                    │                                                          │
                    │  3. Configure Docker for Artifact Registry               │
                    │     └─ gcloud auth configure-docker me-west1-docker...   │
                    │                                                          │
                    │  4. Build Docker Image (multi-stage)                     │
                    │     ┌──────────────────────────────────────────┐         │
                    │     │  Stage 1: Expo Web Export                 │         │
                    │     │  └─ npx expo export --platform web       │         │
                    │     │                                           │         │
                    │     │  Stage 2: Install backend deps            │         │
                    │     │  └─ npm ci (backend/)                     │         │
                    │     │                                           │         │
                    │     │  Stage 3: Production image                │         │
                    │     │  └─ Node 22 Alpine + backend + /public/  │         │
                    │     └──────────────────────────────────────────┘         │
                    │                                                          │
                    │  5. Push image to Artifact Registry                      │
                    │     └─ Tags: :$COMMIT_SHA and :latest                   │
                    │                                                          │
                    │  6. Deploy to Cloud Run                                  │
                    │     └─ gcloud run deploy family-os                       │
                    │        --image=...:$COMMIT_SHA                           │
                    │        --region=me-west1                                 │
                    │        --platform=managed                                │
                    │                                                          │
                    │  7. Container starts:                                    │
                    │     └─ npm run db:migrate && npm run server.ts           │
                    └──────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════
                            TECH STACK SUMMARY
═══════════════════════════════════════════════════════════════════════════════════

  Frontend                 Backend                  Infra / CI/CD
  ─────────────────────    ─────────────────────    ─────────────────────
  Expo 54                  Hono 4.12               GCP Cloud Run
  React Native 0.81        Drizzle ORM 0.39         GCP Artifact Registry
  React 19                 Node.js 22               Neon PostgreSQL
  Expo Router 6            JWT (HS256)              GitHub Actions
  Zustand 5                Bcrypt                   Docker (multi-stage)
  React Native Paper 5     Zod 4
  Reanimated 4             TypeScript 5.7
  React Hook Form 7
  Zod 4
  TypeScript 5.7
```
