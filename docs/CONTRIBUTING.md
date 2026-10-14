# Contributing

## Local setup

Install the root dependencies with `npm install`. For the local API, copy `backend/.env.example` to `backend/.env` and provide the required server-only credentials. For Firebase browser sign-in, configure the `VITE_FIREBASE_*` values in `.env.local` using `.env.example`. Never put private credentials in a `VITE_*` variable or commit real credentials.

Run the combined local app with `npm run dev`. The frontend is available at Vite's local URL and proxies `/api` to the local API. `npm run dev:web` runs only the frontend.

## Change guidelines

- Preserve existing routes, API contracts, authentication, pricing, data ownership, and user-visible behavior unless a verified defect requires a documented change.
- Use PascalCase for React components, camelCase for functions and variables, and descriptive names consistent with the surrounding module.
- Keep browser-safe configuration separate from server credentials. Validate untrusted request data in the API handler before using it.
- Add or update focused regression tests for business rules, API validation, access control, and error cases.
- Avoid broad file moves or new dependencies unless a measurable need justifies them. Confirm dynamic imports, build configuration, deployment templates, and runtime references before removing files.
- Use semantic HTML, keyboard-operable controls, accessible names, responsive styles, and the existing design tokens when changing the UI.

## Verification

Run the project Node test suite with:

```sh
npm test
```

Build the frontend with:

```sh
npm run build
```

The root package currently does not define lint or type-check scripts. For deployment-template changes, also run `sam build` with the AWS SAM CLI and check the resulting artifacts before deployment. Never run a production deploy, destructive data operation, or credential rotation as part of routine development work.
