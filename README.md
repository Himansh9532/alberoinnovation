# SkillAI

A React and Vite platform for online skill assessments, AI interview practice, career guidance, research discovery, and resume tools.

## Local development

```sh
npm install
```

Copy `.env.example` to `.env.local` and set the Firebase web app values. Copy `.env.development.example` to `.env.development.local`. Copy `backend/.env.example` to `backend/.env` and set the backend credentials.

In the first terminal, start the separate API backend:

```sh
npm run start:api:local
```

In a second terminal, start the static frontend:

```sh
npm run dev
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

The frontend is a static Vite site for **Amazon S3 + CloudFront**; the Node API runs separately on **AWS Lambda + API Gateway**. `template.yaml` defines the API routes, CORS, and Lambda deployment. Install/configure the AWS CLI and AWS SAM CLI with deployment permissions in your AWS account first.

1. Create an S3 bucket for the static site and a CloudFront distribution with Origin Access Control to that bucket. Set CloudFront's 403 and 404 custom error responses to serve `/index.html` with response code 200 so React Router routes work.
2. Create a Secrets Manager secret named `robotics-lab/backend`. Use a JSON object with `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADZUNA_APP_ID`, and `ADZUNA_APP_KEY`. Keep secret values in AWS only; use empty values for optional Razorpay/Adzuna credentials you have not configured.
3. From the repository root, run `sam build`, then `sam deploy --guided`. For the `FrontendOrigin` parameter, enter the exact CloudFront origin, such as `https://d123example.cloudfront.net` (no trailing slash). Keep the default secret name if you used it above.
4. After deployment, copy the `BackendApiUrl` stack output. Set `VITE_API_BASE_URL` to that URL and set the `VITE_FIREBASE_*` web app settings in the frontend build environment. Run `npm run build`, upload the contents of `dist/` to S3, then invalidate the CloudFront cache.

The Lambda receives backend-only credentials from Secrets Manager; never place these in frontend variables or upload them to S3. Update the `FrontendOrigin` parameter and redeploy the SAM stack if the CloudFront origin changes. After rotating a secret, redeploy the stack so Lambda's environment picks up the new secret value.

For local development, the frontend and backend use separate terminals and env files: root `.env.local` for browser-safe frontend values and `backend/.env` for server-only credentials.

### Search engine setup

The frontend includes page-specific titles and descriptions, canonical URLs, structured `WebSite` data, `robots.txt`, and a sitemap for public pages. Before submitting it to search engines:

1. Point `www.alberotechnologies.in` to the CloudFront distribution and add it as an alternate domain name with a valid HTTPS certificate issued in `us-east-1`. Configure DNS only after CloudFront is ready.
2. Confirm `https://www.alberotechnologies.in/robots.txt` and `https://www.alberotechnologies.in/sitemap.xml` load over HTTPS.
3. Verify the domain property in Google Search Console using the DNS TXT record Google provides, then submit `https://www.alberotechnologies.in/sitemap.xml`.
4. Publish useful, original assessment guides and field-specific content, and request indexing for the main public pages. Search ranking and first-page placement are determined by search engines and cannot be guaranteed by metadata alone.

## Google, Microsoft, and Apple sign-in

The login and registration pages support Firebase Authentication pop-up sign-in with Google, Microsoft, and Apple. Copy the Firebase web app settings into `.env.local` using the `VITE_FIREBASE_*` variables in `.env.example`, then enable each provider in Firebase Console under **Authentication → Sign-in method**. Add the local and production website domains under **Authentication → Settings → Authorized domains**. Microsoft and Apple also require their respective OAuth application credentials to be configured in Firebase Console.

The Firebase web app config is intended for browser use. Email/password and social authentication use Firebase when these values are configured. Demo/local accounts are for UI preview only; they cannot access server-verified plan limits or checkout.

## Pricing

The `/pricing` page offers Free ₹0, Plus ₹999, and Pro ₹1,999. Free accounts get one lifetime AI practice start shared between interviews and skill assessments. Plus allows 5 interviews and 5 20-question assessments per UTC calendar month, plus 10 AI paper requests. Pro allows 12 interviews and 12 20-question assessments, plus 30 AI paper requests per UTC calendar month. AI evaluations and paper requests are also capped server-side. Paid plans are one-time purchases that remain active for 30 days and must be renewed manually; they do not auto-renew.

### Firestore and payment setup

1. Enable Firebase Authentication (Email/Password and any desired OAuth providers) and create a Firestore database in the same Firebase project.
2. Create a Firebase service account in Firebase Console → Project settings → Service accounts. Keep its private key secret. For local development, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON, or set `FIREBASE_SERVICE_ACCOUNT_BASE64` to its base64-encoded contents in `backend/.env`. For AWS, add one of these as a server-only App Runner environment variable. Never prefix it with `VITE_` or commit it.
3. Set `FIREBASE_PROJECT_ID` and deploy the rules in `firestore.rules`. The app uses the Admin SDK on the server; browser clients are denied direct access to plan, order, and payment documents.
4. Create Razorpay API credentials and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as server-only environment variables. For local testing, use Razorpay test keys. Checkout creates an INR order; the server verifies the signed callback and confirms the payment with Razorpay before granting the plan.
5. Set the Firebase web-app `VITE_FIREBASE_*` values for client sign-in, and configure authorized domains and sign-in providers in Firebase Console. Keep these browser settings separate from the server-only credentials.

The server transactionally enforces usage against the authenticated Firebase UID, so repeated or simultaneous requests cannot exceed the quota. Failed upstream generation attempts are counted once they have passed authentication and started the AI generation request. Payment activation requires a captured payment; canceled, pending, or unverifiable payments do not grant a plan.

## Resume Intelligence

The Resume navigation mega-menu opens dedicated routes for dashboard, analyzer, builder, job-description matching, public job search, role catalog comparisons, tailoring, skill-term checks, project notes, career profile, versions, and career package. Resume file text and builder/profile snapshots are stored in browser local storage only, under keys scoped to the signed-in account ID on that browser. They are not uploaded or synced between devices. Previously stored unscoped resume data is not shown as the signed-in user's resume. PDF, DOC, DOCX, and TXT text extraction is performed in the browser. DOCX export creates a Word document; Print / Save PDF uses the browser print dialog.

Role and skill-term comparisons include example roles across engineering and technology, business and finance, healthcare and life sciences, science and research, design and creative arts, law and public service, agriculture and environment, and education and humanities. These show exact text matches against a limited built-in catalog; they are not job-fit recommendations or an exhaustive list of occupations.

Resume dashboard metrics are counts taken from extracted text (such as words, detected headings, and exact catalog terms). The module does not generate resume-quality, ATS, recruiter, hiring, or career-readiness scores; it does not provide AI analysis, grammar review, or claim verification. PDF extraction preserves text line breaks where available, but columns, scanned pages, and image-based text may not extract correctly; users should inspect extracted text against the original. Job-description matching lists exact catalog terms shared by the job and resume text; it does not assess experience, education, or suitability. Tailoring does not automatically rewrite the source. Career profile data is not yet synchronized across devices or connected to the other platform modules. Review all material and include only information you can substantiate.

Job Match fetches public listings from Arbeitnow, Remote OK, and Jobicy without API credentials, plus India listings from Adzuna. To enable Adzuna, register for an app ID and key at [Adzuna Developer](https://developer.adzuna.com/), then set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` as server-only environment variables in `.env.local`, Vercel, or Netlify. Never use a `VITE_` prefix or commit real credentials. Adzuna searches the India market by city/country when selected, or across India when no location is selected. User keywords and resume text are matched in the browser and are not sent to Adzuna; a selected location is sent only to Adzuna for geographic filtering. Jobicy is queried for APAC-eligible remote listings, so an India search can also include APAC-eligible and worldwide remote jobs; this does not guarantee an employer will hire in India. Listings are limited to what the feeds provide, not the entire job market; location, eligibility, availability, and application status must be confirmed on each original listing. Public-feed responses are cached in memory for one hour; Adzuna results are cached on the server for ten minutes. Each result links to its source listing, feed homepages are credited, and partial feed failures are shown alongside available results.

The interview setup offers five locally generated 3D interviewer avatars (three male and two female); only the selected GLB model is loaded and cached. During browser text-to-speech playback, word-boundary vowel cues animate the avatar's mouth blendshape alongside idle head/eye motion. The live interview uses a split-screen call layout and automatically requests camera access when the interview session starts; candidates can turn the camera off with the in-call control. The camera feed stays local, is not sent to Gemini, and its stream is stopped when the session ends. Regenerate the optimized GLB files with `npm run generate:avatars`.

## Production build

```sh
npm run build
npm run preview
```

## Deploy to Vercel

Import this repository in Vercel. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. The included `vercel.json` rewrites client-side routes to `index.html` while leaving generated assets untouched.
