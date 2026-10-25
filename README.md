# SkillAI

A React and Vite platform for online skill assessments, AI interview practice, career guidance, research discovery, and resume tools.

## Local development

```sh
npm install --prefix frontend
npm install --prefix backend
```

Copy `frontend/.env.example` to `frontend/.env.local` and set the Firebase web app values. Copy `frontend/.env.development.example` to `frontend/.env.development.local`. Copy `backend/.env.example` to `backend/.env` and set the backend credentials.

## Repository structure

```text
frontend/
   public/
   src/
      components/       # shared layout and UI
      data/             # browser data and academic paths
      features/         # auth, interview, assessment, resume
      services/         # authenticated API client
      styles/
backend/
   src/
      middleware/
      modules/          # billing, interview, jobs, research, resume
      http-server.js
      lambda.js
      routes.js
shared/               # small cross-runtime domain modules
api/                   # compatibility entry points
scripts/               # root development launcher
docs/
```

Install frontend and backend dependencies separately with the two commands above. Root scripts remain available for combined development, tests, and production builds.

Start the API backend and frontend together:

```sh
npm run dev
```

Vite is available by itself with `npm run dev:web`. To run the API separately, use:

```sh
npm run start:api:local
```

## AI interview question generation

The interview flow extracts resume text in the browser, then sends that text and the selected branch, domain, and duration to the server-side Gemini endpoint to generate five tailored questions. The original resume file and generated questions/answers are not stored on the server. The browser requires the candidate's consent before sending resume text to Gemini.

The Skill Assessment page's Get started link opens a separate quiz flow. Choosing a branch automatically fills its available courses and domains; Gemini generates a 20-question multiple-choice assessment. The browser scores selected answers against the generated answer key, then sends assessment responses to Gemini for a personalized learning summary and improvement suggestions. Assessment answers are not stored on the server.

### Research paper AI assistant

Each paper result can be summarized or used for up to three follow-up questions in that page session. The assistant sends only the paper title, source metadata, abstract, and the current short conversation to the backend Gemini endpoint; it does not fetch or read the full paper. The server keeps the Gemini API key private, requires Firebase sign-in, enforces monthly plan quotas transactionally, limits request size, and rate-limits research AI requests. Plus includes 10 and Pro includes 30 AI paper requests per UTC calendar month; Free can browse papers but AI paper help requires a paid plan.

OpenAlex metadata may retain links to repository records that were later removed. The search hides records OpenAlex explicitly marks as retracted, avoids presenting a repository landing page as a direct PDF, and offers a title search for other versions; external links should still be checked at the source.

Research searches can be saved in the browser and reloaded later. My Library can save up to 200 papers, keep To read/Reading/Done status and private notes, and export citations as BibTeX or RIS for reference managers. Saved searches, library items, and notes are stored only in that browser on that device; they are not synced to an account, and email alerts are not enabled.

Research Maker creates a local planning template with an editable research question, methodology-specific guidance, population or dataset context, keywords, objectives, evidence criteria, a starter search query, and format-specific section guidance. Plans can be downloaded as text. It does not call an AI model, search or verify sources, or write a finished paper.

For local development, copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY` to a key from Google AI Studio. The key is read only by the backend; do not add it to a `VITE_` variable or commit it. `GEMINI_MODEL` can optionally select a different model.

For deployment, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) as server-side backend environment variables. The key must never be exposed in client-side configuration.

### AWS static frontend and separate API backend

The frontend and backend are deployed as separate AWS services: the static frontend is stored in a private **Amazon S3** bucket and delivered through **CloudFront**, while API requests run independently on **AWS Lambda + API Gateway**. Static page and asset traffic is served by CloudFront instead of occupying API compute. `template.yaml` provisions both sides with separate resources; the frontend output is `frontend/dist/`. The build prerenders page metadata for public routes and CloudFront serves those route-specific files at clean URLs.

The source tree follows the same separation: `frontend/` owns the Vite app, assets, and browser dependencies; `backend/` owns the Node API, domain modules, and server dependencies. Root `shared/` contains small modules consumed by both sides, while `api/` retains thin compatibility entry points.

Install and configure the AWS CLI and AWS SAM CLI with permissions to create S3, CloudFront, API Gateway, Lambda, IAM, and related resources in your AWS account. CloudFront distribution creation can take several minutes.

1. Create a Secrets Manager secret named `albero-innovation/backend`. Use a JSON object with `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET`. Keep secret values in AWS only; use empty values for optional Gemini, Razorpay, or Adzuna integrations you have not configured. Set all three admin values to enable the admin dashboard.
2. Verify the SES sender email/domain in the Lambda's AWS region and request production access if the SES account is still in its sandbox. While sandboxed, verify both the business recipient and each customer recipient. Local development uses the AWS SDK credential chain and the configured local AWS profile.
3. From the repository root, run `sam build`, then `sam deploy --guided`. Keep the default secret name if used, set `SesFromEmail` to the verified sender, and set `PaymentReceiptAdminEmail` to the business recipient. The stack creates a private, encrypted S3 bucket, a CloudFront distribution with private bucket access and SPA route fallback, and the API Gateway/Lambda backend. API CORS is restricted to the generated CloudFront origin. The Lambda role is granted `ses:SendEmail` only for the configured sender identity.
4. After deployment, read the `BackendApiUrl`, `FrontendBucketName`, `FrontendDistributionId`, and `FrontendUrl` stack outputs. Set `VITE_API_BASE_URL` to `BackendApiUrl` and configure the browser-safe `VITE_FIREBASE_*` settings in the frontend build environment. Do not put backend credentials in frontend variables.
5. Build and upload the frontend from PowerShell:

   ```powershell
   $env:VITE_API_BASE_URL = "<BackendApiUrl>"
   npm run build
   aws s3 sync .\frontend\dist\ s3://<FrontendBucketName> --delete
   aws cloudfront create-invalidation --distribution-id <FrontendDistributionId> --paths "/*"
   ```

   `npm run build` creates `frontend/dist/`; upload its contents, not the folder itself. Open `FrontendUrl` after the CloudFront deployment is complete.

The Lambda receives backend-only credentials from Secrets Manager; never place these in frontend variables or upload them to S3. After rotating a secret, redeploy the SAM stack so Lambda's environment picks up the new secret value.

For local development, the frontend and backend can still run in separate terminals with separate env files: `frontend/.env.local` for browser-safe frontend values and `backend/.env` for server-only credentials.

### Search engine setup

The frontend includes page-specific titles and descriptions, canonical URLs, structured `WebSite` data, and a sitemap for public pages. Before submitting it to search engines:

1. Request or import a valid ACM HTTPS certificate for `albero-innovation.in` in `us-east-1`. During SAM deployment, set `FrontendCertificateArn` to that certificate ARN; `FrontendDomainName` defaults to `albero-innovation.in`. The template configures the CloudFront alias and API CORS for this domain. Configure DNS to point to CloudFront only after the distribution is ready.
2. Confirm `https://albero-innovation.in/sitemap.xml` loads over HTTPS.
3. Verify the domain property in Google Search Console using the DNS TXT record Google provides, then submit `https://albero-innovation.in/sitemap.xml`.
4. Publish useful, original assessment guides and field-specific content, and request indexing for the main public pages. Search ranking and first-page placement are determined by search engines and cannot be guaranteed by metadata alone.

## Google, Microsoft, and Apple sign-in

The login and registration pages support Firebase Authentication pop-up sign-in with Google, Microsoft, and Apple. After any successful sign-in or registration, SkillAI asks the user to acknowledge how account data and text submitted to AI features are processed before opening the requested page. Copy the Firebase web app settings into `frontend/.env.local` using the `VITE_FIREBASE_*` variables in `frontend/.env.example`, then enable each provider in Firebase Console under **Authentication → Sign-in method**. Add the local and production website domains under **Authentication → Settings → Authorized domains**. Microsoft and Apple also require their respective OAuth application credentials to be configured in Firebase Console.

The Firebase web app config is intended for browser use. Email/password and social authentication use Firebase when these values are configured. Demo/local accounts are for UI preview only; they cannot access server-verified plan limits or checkout.

## Pricing

The `/pricing` page offers Free ₹0, Plus ₹999, and Pro ₹1,999. Free accounts keep non-AI features such as browsing research papers, saved searches, personal library tools, and the local Research Maker planning template. Free also includes one lifetime AI practice start shared between interviews and skill assessments. Plus allows 5 interviews and 5 20-question assessments per UTC calendar month, plus 10 AI paper requests. Pro allows 12 interviews and 12 20-question assessments, plus 30 AI paper requests per UTC calendar month. AI evaluations and paper requests are also capped server-side. Paid plans are one-time purchases that remain active for 30 days and must be renewed manually; they do not auto-renew.

### Firestore and payment setup

1. Enable Firebase Authentication (Email/Password and any desired OAuth providers) and create a Firestore database in the same Firebase project.
2. Create a Firebase service account in Firebase Console → Project settings → Service accounts. Keep its private key secret. For local development, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON, or set `FIREBASE_SERVICE_ACCOUNT_BASE64` to its base64-encoded contents in `backend/.env`. For AWS, put the base64-encoded value in the `FIREBASE_SERVICE_ACCOUNT_BASE64` field of the Secrets Manager secret used by the SAM stack; the template injects it into Lambda as a server-only environment variable. Never prefix it with `VITE_` or commit it.
3. Set `FIREBASE_PROJECT_ID` and deploy the rules in `firestore.rules`. The app uses the Admin SDK on the server; Firestore rules deny browser clients direct access to user profile/resume, plan, order, and payment documents. User profile and resume operations go through the backend, which verifies the Firebase ID token and scopes access to that UID.
4. Create Razorpay API credentials and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as server-only environment variables. For local testing, use Razorpay test keys. Checkout creates an INR order; the server verifies the signed callback and confirms the payment with Razorpay before granting the plan.
5. Set `AWS_REGION`, `SES_FROM_EMAIL` to an SES-verified sender address, and `PAYMENT_RECEIPT_ADMIN_EMAIL` to the business recipient in `backend/.env`. The backend sends an INR payment receipt to the email on the authenticated Firebase account and blind-copies the business recipient after the payment is captured and the plan is activated. Public contact form submissions are saved in the Firestore `contactSubmissions` collection with name, email, topic, message, and server-generated submission time, using the Firebase Admin credentials from step 2. View submissions in Firebase Console → Firestore Database → `contactSubmissions`. Firestore rules deny browser clients direct access to these records. The form also attempts an SES email notification with the sender's address as Reply-To when SES is configured; email notification failure does not undo the database save. Configure AWS credentials through the AWS SDK credential chain; on Lambda, use its execution role. Missing SES configuration or delivery failures do not reverse a successful payment, and the checkout status explicitly reports that the receipt could not be delivered.
6. Set the Firebase web-app `VITE_FIREBASE_*` values for client sign-in, and configure authorized domains and sign-in providers in Firebase Console. Keep these browser settings separate from the server-only credentials.
7. Configure the separate admin login on the backend. Run `npm --prefix backend run admin:hash-password` and enter a unique password of at least 12 characters; add its printed `scrypt$...` hash as `ADMIN_PASSWORD_HASH`, choose `ADMIN_USERNAME`, and set `ADMIN_SESSION_SECRET` to a random value generated with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. For local development, keep these values in `backend/.env`. For AWS, add all three keys to the Secrets Manager secret named by `BackendSecretsName`. Never put the admin password or session secret in frontend variables or source control. Open `/admin` for the admin sign-in; admin sessions expire after eight hours.

The server transactionally enforces usage against the authenticated Firebase UID, so repeated or simultaneous requests cannot exceed the quota. Failed upstream generation attempts are counted once they have passed authentication and started the AI generation request. Payment activation requires a captured payment; canceled, pending, or unverifiable payments do not grant a plan.

## Resume Intelligence

The Resume navigation mega-menu opens dedicated routes for dashboard, analyzer, builder, Optimize (combined job-description matching and resume tailoring), public job search, combined Career Analysis (skill gaps and project analysis), skill-term checks, project notes, and career profile. PDF, DOC, DOCX, and TXT text extraction is performed in the browser; the original file is not uploaded. For Firebase-authenticated users, newly uploaded extracted resume text is stored in their private Firestore account and synced across devices, while a browser-local copy remains available. Existing local-only resumes require the user to choose whether to sync them. The admin dashboard at `/admin` reports user count, sign-in totals, and extracted-resume storage size, and lists user metadata; it does not expose resume contents. DOCX export creates a Word document; Print / Save PDF uses the browser print dialog.

Resume Builder offers six photo-ready templates. An optional JPG, PNG, or WebP photo is resized in the browser and stored with that user's local profile; it is included in the live preview and photo-ready PDF/DOCX exports, and is not sent to AI services.

Role and skill-term comparisons include example roles across engineering and technology, business and finance, healthcare and life sciences, science and research, design and creative arts, law and public service, agriculture and environment, and education and humanities. These show exact text matches against a limited built-in catalog; they are not job-fit recommendations or an exhaustive list of occupations.

Resume dashboard metrics are counts taken from extracted text (such as words, detected headings, and exact catalog terms). The module does not generate resume-quality, ATS, recruiter, hiring, or career-readiness scores; it does not provide AI analysis, grammar review, or claim verification. PDF extraction preserves text line breaks where available, but columns, scanned pages, and image-based text may not extract correctly; users should inspect extracted text against the original. Job-description matching lists exact catalog terms shared by the job and resume text; it does not assess experience, education, or suitability. Tailoring does not automatically rewrite the source. Career profile data is not yet synchronized across devices or connected to the other platform modules. Review all material and include only information you can substantiate.

Job Match fetches public listings from Arbeitnow, Remote OK, and Jobicy without API credentials, plus India listings from Adzuna. To enable Adzuna, register for an app ID and key at [Adzuna Developer](https://developer.adzuna.com/), then set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` as server-only environment variables in `backend/.env` for local development or in the deployed API environment. Never use a `VITE_` prefix or commit real credentials. Adzuna searches the India market by city/country when selected, or across India when no location is selected. User keywords and resume text are matched in the browser and are not sent to Adzuna; a selected location is sent only to Adzuna for geographic filtering. Jobicy is queried for APAC-eligible remote listings, so an India search can also include APAC-eligible and worldwide remote jobs; this does not guarantee an employer will hire in India. Listings are limited to what the feeds provide, not the entire job market; location, eligibility, availability, and application status must be confirmed on each original listing. Public-feed responses are cached in memory for one hour; Adzuna results are cached on the server for ten minutes. Each result links to its source listing, feed homepages are credited, and partial feed failures are shown alongside available results.

The interview setup offers five locally generated 3D interviewer avatars (three male and two female); only the selected GLB model is loaded and cached. During browser text-to-speech playback, word-boundary vowel cues animate the avatar's mouth blendshape alongside idle head/eye motion. The live interview uses a split-screen call layout and automatically requests camera access when the interview session starts; candidates can turn the camera off with the in-call control. The camera feed stays local, is not sent to Gemini, and its stream is stopped when the session ends. Regenerate the optimized GLB files with `npm run generate:avatars`.

## Production build

```sh
npm run build
npm run preview
```

## Project documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API reference](./docs/API.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Codebase audit](./docs/REFACTORING-AUDIT.md)
