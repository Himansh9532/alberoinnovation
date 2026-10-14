# Architecture

## Overview

SkillAI is a JavaScript application with a React/Vite browser client and a Node.js API. The same API handlers are exposed through a local HTTP server and an AWS Lambda adapter. Firebase Authentication identifies users; Firebase Admin and Firestore enforce server-side plan usage and persist billing records.

```text
Browser
  React + React Router
  Firebase Web Authentication
    frontend/src/data, auth services, and feature modules
       | API requests with Firebase ID token
       v
  Vite proxy (development) / API Gateway (deployment)
       v
     backend/src/modules endpoint handlers
       |-- Firebase Admin + Firestore
       |-- Gemini
       |-- Razorpay
       |-- Adzuna
       `-- Amazon SES

Static deployment: Vite build -> frontend/dist -> private S3 bucket -> CloudFront
API deployment: backend/src/lambda.js -> AWS Lambda -> API Gateway
```

## Source layout

- `frontend/src/main.jsx` initializes React, React Router, and global stylesheets.
- `frontend/src/App.jsx` owns the site shell, route registration, navigation, session UI, and SEO updates. Resume Intelligence, interview practice, and skill assessment are dynamically imported from `frontend/src/features/`.
- `frontend/src/features/` contains domain-specific interview, resume, and assessment experiences; `frontend/src/components/` contains shared layout and UI components.
- `frontend/src/services/api-client.js` centralizes authenticated first-party API requests. `frontend/src/features/auth/services/` contains Firebase and local-account auth services; `frontend/src/data/` contains academic-path and browser-local data helpers.
- `frontend/public/` contains static assets; Vite outputs production files to `frontend/dist/`.
- `shared/` contains plan-pricing rules and SEO page metadata shared with the frontend.
- `backend/src/modules/` groups billing, interview, jobs, research, and resume handlers. `backend/src/middleware/` contains shared CORS behavior, while `backend/src/http-server.js`, `backend/src/lambda.js`, and `backend/src/routes.js` provide the runtime adapters and route registry.
- `api/` contains thin compatibility wrappers around the shared backend handlers. The root `server/` directory is empty and is not referenced by the active development or SAM configuration.
- Root `scripts/` contains the combined development launcher; `frontend/scripts/` contains SEO prerendering and avatar generation.
- `template.yaml` provisions the S3/CloudFront frontend and API Gateway/Lambda backend.

## Runtime and data flow

1. The browser signs users in through Firebase Authentication. Browser Firebase settings use `VITE_FIREBASE_*` variables; they are not server credentials.
2. The client obtains a Firebase ID token and sends it as a bearer token for account-specific AI, plan, job-search, and billing operations.
3. Backend handlers validate payloads and verify Firebase tokens with Firebase Admin. Plan usage is charged transactionally in Firestore before paid AI work proceeds.
4. AI handlers call Gemini from the backend. Interview and assessment flows submit resume or answer text; the research assistant submits paper metadata, abstract, and optional short conversation. Resume features send resume and, for tailoring, job-description text. These requests are made only when the relevant feature is used.
5. Billing creates and verifies Razorpay orders server-side, activates plans in Firestore after checking captured payment details, and attempts receipt delivery through SES.
6. India job listings are fetched server-side from Adzuna. Other public job feeds are handled by the resume feature in the browser.
7. Resume and research-library data are browser-local as described in the README; plan and payment state are server-side.

## Environments and deployment

- `npm run dev` starts the local API using `backend/.env` and Vite rooted at `frontend/`. Vite proxies `/api` to `http://127.0.0.1:3001`.
- `npm run dev:web` starts only the frontend Vite app. `npm run start:api:local` starts the API with `backend/.env`; `npm run start:api` does not load an env file.
- `npm run build` delegates to the frontend package and prerenders public-route metadata into `frontend/dist/`.
- The SAM template deploys static files through private S3 and CloudFront, and maps API Gateway routes to a Node.js 22 Lambda. Backend credentials are supplied from Secrets Manager/server environment, not the frontend build.
- `.gitignore` excludes local environment files and Firebase Admin service-account JSON files. Keep real credentials out of source control and client-side `VITE_*` variables.

## Current boundaries and known gaps

- Many routes and page implementations remain together in `frontend/src/App.jsx`; `frontend/src/styles/` holds large shared stylesheets. Refactor these incrementally with route-level regression coverage.
- `backend/src/routes.js` is the shared route-to-handler registry used by both the local HTTP and Lambda adapters.
- API validation and response formatting live in endpoint modules rather than shared typed contracts. Error responses use endpoint-specific `{ error, code? }` shapes; there is no single response envelope.
- Rate limits and public job-feed caches are in-memory. They are local to a process and are not distributed across Lambda instances.
- The root package has no configured lint or type-check script. The current automated tests use Node's built-in test runner.
- `npm --prefix frontend audit --omit=dev` reports frontend transitive dependency advisories. Several suggested automatic fixes require breaking upgrades; review and test a deliberate dependency update rather than applying `--force`.

This document describes the repository as currently implemented; it is not a security certification or a claim that every deployment path has been exercised.
