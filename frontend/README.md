# Dukkan & Hara web

Next.js 15 App Router and React 19 web client. `/ar` is Arabic RTL and the default locale. `/en` is English LTR. Run the shared packages build before starting Next.js.

```sh
npm run build:packages
npm run dev:frontend
npm run typecheck --workspace frontend
npm run lint --workspace frontend
npm test --workspace frontend
npm run contracts:check --workspace frontend
npm run build --workspace frontend
```

Set `NEST_API_URL` to the server-only REST base including `/api/v1`. Set `NEXT_PUBLIC_WS_URL` to the public Socket.IO origin and `/orders` namespace. The backend must allow the web origin. In production, serve the site over HTTPS. Use the root README for backend and seeded review account setup.

The web app uses App Router route groups, server components, Server Actions, route handlers, streaming and loading boundaries, metadata, typed shared responses, and Redux Toolkit for the mobile navigation menu. JWTs stay in first-party HttpOnly cookies. The browser receives a one-use order ticket for Socket.IO and fetches authorized private files through the Next.js route handler. Screen actions call server-owned operations with the version and idempotency headers defined in OpenAPI.

`node frontend/scripts/sync-api.mjs` derives the method/path and input form registry from canonical OpenAPI. Update that registry alongside the shared contract after backend contract releases. The payload editors use the canonical JSON field names and submit typed primitive values, nested objects, arrays and explicit confirmation flags.

The Responsive Web Figma layouts informed the storefront. Order and administrative pages extend its cream and green design tokens. The landing photograph is a locally bundled generated fallback because the available Figma session could not export its source asset. The built-in image tool was prompted for an editorial photograph of a narrow Damascus souq lane with a weathered limestone arch, muted teal shutters, textile and produce stalls and warm daylight.

See the [frontend API issues](../docs/FRONTEND_API_ISSUES.md) for remaining contract gaps.
