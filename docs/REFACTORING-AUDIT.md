# Codebase Audit and Refactoring Status

## Scope and baseline

This is an initial repository audit and incremental refactoring record, not a claim that every module has completed a line-by-line review. The working tree already contained user changes across the application, backend, deployment template, SEO files, and docs. Those changes were preserved while the existing frontend/backend files were relocated into the requested structure.

The application is a JavaScript ESM project with a React 18/Vite 6 frontend and a Node.js API. The browser uses Firebase Authentication; API handlers verify Firebase tokens and use Firebase Admin/Firestore for plan and payment data. The same `backend/src/modules` handlers are exposed through a local HTTP server, an AWS Lambda adapter, and thin files under `api/`. The documented deployment uses AWS SAM, API Gateway, Lambda, private S3, and CloudFront. Integrations include Gemini, Razorpay, Adzuna, and Amazon SES.

The frontend now lives under `frontend/`, grouped into feature modules, shared components, services, data, and styles. The app shell remains concentrated in `frontend/src/App.jsx` (2,836 lines); its shared stylesheets were moved under `frontend/src/styles/` without behavior changes. UI state is primarily React-local; resume and research library data are browser-local, while plan/payment state is server-side. `api/` wrappers remain because the repository's external hosting usage is not confirmed.

## Findings

- **Structure:** Frontend and backend now have separate top-level packages. Frontend features are grouped under `frontend/src/features/`; backend handlers are grouped under `backend/src/modules/`. `frontend/src/App.jsx` still combines the app shell, routing, and substantial page implementations, and the stylesheets remain large.
- **Backend contracts:** Local HTTP and Lambda adapters share route handlers, but error serialization and adapter behavior are duplicated. Endpoint modules own validation and return endpoint-specific `{ error, code? }` shapes. There is no shared request ID or centralized error contract. In-memory rate limits and caches do not coordinate across Lambda instances.
- **Frontend API integration:** First-party calls use `frontend/src/services/api-client.js` for API URL construction, Firebase bearer tokens, and JSON headers. Feature modules retain their own response validation and user-facing errors; direct fetches remain for external data providers.
- **Tests and tooling:** Node's built-in test runner covers billing, interview, resume validation, route registration, pricing, API requests, and resume-photo processing. The root `npm test` script now runs 18 tests. No lint or type-check scripts/configuration are present. Adapter-level integration tests and component tests are not present in the discovered Node test set.
- **Performance:** Production build succeeds, but Vite reports chunks over its 500 kB threshold: `VirtualInterviewer` about 639 kB, PDF code about 484 kB, and the PDF/DOCX-related Mammoth bundle about 305 kB minified. These are concrete candidates for measuring deferred loading and feature-level splitting; no speculative memoization was added.
- **Security/configuration:** Local frontend/backend `.env` files and the Firebase Admin service-account JSON remain ignored by Git. Backend credentials are configured server-side; Firestore rules deny direct client reads/writes to plan, order, and payment documents. The backend production dependency audit reports zero advisories. The isolated frontend production dependency audit reports 9 advisories (4 high, 5 moderate), including `@grpc/grpc-js`, `react-router`, and `sprintf-js`. A non-forced audit fix applied one compatible patch before the package split; the remaining fixes proposed by npm require deliberate compatibility review. No forced update was applied.

## Changes made in this pass

- Added `npm test` to run the backend, shared, and frontend API-client Node tests.
- Centralized authenticated first-party frontend API requests in `frontend/src/services/api-client.js`, migrated the affected features, and added focused tests while preserving feature-specific response handling.
- Moved resume photo validation, resizing, and DOCX byte conversion into `frontend/src/features/resume/services/resume-photo.js`, with tests for rejected formats, oversized files, and JPEG decoding. Uploaded images remain local and are not part of AI requests.
- Combined job-description matching and resume tailoring into one page with shared description input and tabs; retained the former routes as aliases. Successful sign-in and registration also pass through an account-data consent step before creating the app session.
- Removed stale root build/dependency artifacts after verifying they were unreferenced and package-local installs worked. Retained compatibility API wrappers and assets whose usage could not be ruled out.
- Moved the browser app into `frontend/` and organized interview, resume, and assessment components under `frontend/src/features/`; moved API handlers into `backend/src/modules/` and shared CORS into `backend/src/middleware/`.
- Removed the Resume Versions and Career Package navigation, screens, and unused presentation rules. Existing version snapshots remain untouched in browser storage; old routes redirect to the Resume Dashboard.
- Declared `@aws-sdk/client-sesv2` in the backend package, where the SAM `CodeUri` points, so a clean backend build does not rely on the root install. Regenerated the backend lockfile and verified a clean install and Lambda bundle.
- Applied npm's non-forced compatible audit fix; the lockfile records one transitive package update. The remaining dependency advisories are documented above and still need a compatibility-led update plan.
- Added this audit record and updated contributor verification instructions. No public API, pricing rule, or database rule was changed.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Root tests | **Passed** | `npm test`: 18 passed, 0 failed. |
| Production frontend build | **Passed** | `npm run build` built successfully and prerendered metadata for 3 public routes. Vite emitted the large-chunk warning noted above. |
| Split package resolution | **Passed** | Frontend lockfile was regenerated and the production build passed; backend clean install was verified. |
| Backend clean install and dependency audit | **Passed** | `npm --prefix backend ci` installed the backend lockfile; `npm --prefix backend audit --omit=dev` reported 0 vulnerabilities. |
| Lambda bundle | **Passed** | Backend-only esbuild bundle succeeded with the SAM entry point, Node platform, ES2022 target, minification, and Firebase Admin externals. |
| Frontend production dependency audit | **Failed** | `npm --prefix frontend audit --omit=dev`: 9 vulnerabilities remain (4 high, 5 moderate). Do not use `--force` without reviewing the required breaking changes. |
| Root orchestrator dependency audit | **Passed** | The root package has no runtime dependencies. |
| Lint / type check | **Not run** | No corresponding root scripts or lint/TypeScript configuration were found. |
| AWS SAM build | **Blocked** | SAM CLI is not installed in this environment; the Lambda bundle was checked directly with the configured esbuild settings. |
| Combined local dev smoke | **Passed** | Vite started at `http://localhost:5173/`; `GET http://localhost:3001/health` returned `{ "status": "ok" }`. |
| Cloud deployment | **Not run** | No deployment was attempted; cloud credentials and state are intentionally untouched. |

## Recommended next work

1. Add HTTP/Lambda adapter contract tests for body limits, CORS, status codes, and consistent error behavior before consolidating their boundary logic.
2. Split `frontend/src/App.jsx` and the large stylesheets by existing feature boundaries, preserving routes and user-visible behavior and adding focused UI tests where practical.
3. Measure first-load and feature-route bundles, then defer the 3D interviewer and document parsing paths further where that measurably reduces initial downloads.
4. Review the frontend dependency advisories individually. Upgrade React Router and other major dependencies only with compatibility tests; avoid `npm audit fix --force`.
5. Add lint/format/type-check gates only after selecting tools compatible with the current JavaScript code and deployment setup.
6. Confirm whether `api/` is used by any external hosting target before changing or removing those thin wrappers.
