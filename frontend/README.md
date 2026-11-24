# Dukkan & Hara web

Address and public venue editors use governorate/city selectors and a draggable map pin instead of visible coordinate inputs. City choices load from the backend; a known city center positions the initial pin. Cities without center data allow manual placement on the map. Dragging, map clicks and arrow keys update the exact saved point. Existing private pins remain unchanged until edited, and changing an address city clears its old area. Map rendering requires `NEXT_PUBLIC_MAP_STYLE_URL`.

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

The top header stays visible while scrolling. A separate category bar links to the three marketplace workspaces. The menu button opens an accessible side drawer with navigation, language switching and a two-state dark-mode switch. Appearance persists locally; a first visit uses the device's current appearance, without exposing a System option. The drawer supports Escape, backdrop dismissal and keyboard focus containment. Shared select styling and the footer support both Arabic RTL and English LTR.

The web app uses App Router route groups, server components, Server Actions, route handlers, streaming and loading boundaries, metadata, typed shared responses, and Redux Toolkit for the mobile navigation menu. JWTs stay in first-party HttpOnly cookies. The browser receives a one-use order ticket for Socket.IO and fetches authorized private files through the Next.js route handler. Screen actions call server-owned operations with the version and idempotency headers defined in OpenAPI.

`node frontend/scripts/sync-api.mjs` derives the method/path and input form registry from canonical OpenAPI. Update that registry alongside the shared contract after backend contract releases. The payload editors use the canonical JSON field names and submit typed primitive values, nested objects, arrays and explicit confirmation flags.

The Responsive Web Figma layouts informed the storefront. Order and administrative pages extend its cream and green design tokens. The landing photograph is a locally bundled generated fallback because the available Figma session could not export its source asset. The built-in image tool was prompted for an editorial photograph of a narrow Damascus souq lane with a weathered limestone arch, muted teal shutters, textile and produce stalls and warm daylight.

See the [frontend API issues](../docs/FRONTEND_API_ISSUES.md) for remaining contract gaps.

The [combined merge review](../docs/FRONTEND_MERGE_REVIEW.md) records actual validation and limits. Server-side refresh coalesces concurrent requests; forms/uploads bind to the rendered account ID to reject stale-account submissions. Unknown command outcomes retain the original retry key. Full device/visual/deployment acceptance and documented API gaps remain open.
