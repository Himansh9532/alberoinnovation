# API reference

The local API is served at `http://localhost:3001`; in production, API Gateway supplies the base URL. The browser constructs requests through `frontend/src/services/api-client.js`.

Firebase-authenticated routes require a Firebase ID token:

```http
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

The backend verifies Firebase ID tokens for account-specific operations. Admin login uses the separately configured admin credentials, and admin statistics require the resulting admin session rather than a Firebase token. Client-side route guards are for navigation only and are not a substitute for API authorization.

## Endpoints

| Method and path | Authentication | Purpose |
| --- | --- | --- |
| `GET /health` | None | Health check; returns `{ "status": "ok" }`. |
| `POST /api/generate-interview` | Firebase | Generate interview questions or evaluate saved answers. |
| `POST /api/skill-assessment` | Firebase | Generate a 20-question assessment or evaluate its answers. |
| `POST /api/research-assistant` | Firebase | Summarize a paper abstract or answer a question about it. |
| `POST /api/resume-assistant` | Firebase | Analyze, tailor, compare, or assess skills from resume text. |
| `POST /api/users/profile` | Firebase | Save or update the signed-in user's profile metadata. |
| `GET /api/users/resume` | Firebase | Read the signed-in user's saved extracted resume text. |
| `PUT /api/users/resume` | Firebase | Save or replace the signed-in user's extracted resume text. |
| `DELETE /api/users/resume` | Firebase | Delete the signed-in user's saved extracted resume text. |
| `POST /api/admin/login` | Admin credentials | Create an admin session. |
| `GET /api/admin/stats` | Admin session | Read aggregate account, sign-in, and resume-storage statistics and user metadata. |
| `GET /api/billing/usage` | Firebase | Read current plan and monthly usage. |
| `POST /api/billing/order` | Firebase | Create a Razorpay order for a supported paid plan. |
| `POST /api/billing/verify-payment` | Firebase | Verify a captured Razorpay payment and activate the associated plan. |
| `GET /api/jobs/india?where=<location>` | Firebase | Search India listings through Adzuna; `where` is optional. |

## Request shapes

### Interview practice

`POST /api/generate-interview` accepts `branch`, `domain`, and `durationMinutes` for both actions. Supported durations are 5, 10, 15, 20, and 30 minutes.

- Question generation (the default action): add `resumeText` (80–12,000 characters). Success returns `{ "questions": ["...", "..."] }` with five questions.
- Evaluation: set `"action": "evaluate"` and provide `answers`, an array of 1–5 `{ "question": "...", "answer": "..." }` entries. Success returns a `result` with score, summary, strengths, improvements, and per-answer feedback.

### Skill assessment

`POST /api/skill-assessment` requires `branch`, `course`, and `domain`.

- Generation: use `"action": "assessment-generate"` and `"questionCount": 20`. Success returns 20 question objects with four options, a correct-option index, and an explanation.
- Evaluation: use `"action": "assessment-evaluate"` and provide exactly 20 answer objects. Success returns a `result` with the computed score and AI feedback.

### Research assistant

`POST /api/research-assistant` requires `action` (`"summarize"` or `"ask"`), `paperId`, `title`, and `abstract`. The title must be 5–800 characters; the abstract must be 40–10,000 characters. `"ask"` additionally requires a 3–500 character `question`. Optional `year`, `journal`, and short `history` provide context. Success returns `{ "answer": "..." }`.

### Resume assistant

`POST /api/resume-assistant` requires `action` and `resumeText` (80–12,000 characters). Supported actions are:

- `"analyze"`: grounded writing feedback.
- `"match-jobs"`: provide 1–30 validated `jobs`.
- `"tailor"`: provide a `jobDescription` (40–12,000 characters); `targetRole` is optional.
- `"skill-gaps"`: provide a `targetRole` and 1–20 `requiredSkills`.

Success returns `{ "result": ... }`; the result structure depends on the selected action and is validated by the handler.

### Plan and payments

- `GET /api/billing/usage` returns the plan, expiry, current UTC usage month, and `{ used, limit }` for interviews, assessments, and research.
- `POST /api/billing/order` accepts `{ "plan": "plus" | "pro", "months": 1 | 3 | 6 | 12 }`. The server determines the INR amount and returns the Razorpay public key ID and order details.
- `POST /api/billing/verify-payment` accepts Razorpay's `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. A plan is activated only after signature and captured-payment verification. Success includes `success`, `plan`, and receipt-delivery status fields.

### India job search

`GET /api/jobs/india` accepts an optional `where` query parameter of at most 100 characters. Success returns `{ "jobs": [...], "fetchedAt": ..., "cached": ... }`. Adzuna credentials are server-only.

## Errors and limits

Handlers return JSON errors using `{ "error": "..." }`, sometimes with a machine-readable `code`. The exact response codes/messages are endpoint-specific today. Common status codes include `400` for invalid input, `401` for missing or invalid sign-in, `402` for exhausted plan quota or uncaptured payment, `403` for disallowed operations, `413` for oversized request bodies where a handler enforces a limit, `429` for rate limiting, and `502`/`503` for upstream or configuration failures.

The interview and assessment handlers limit request bodies to 256 KiB; research and resume handlers enforce their own smaller limits. Plan quotas are checked server-side and updated transactionally in Firestore. Limits, validation rules, and response shapes in the handlers are authoritative if this reference becomes out of date.
