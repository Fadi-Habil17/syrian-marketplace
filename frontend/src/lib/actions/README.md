# Server Actions boundary

Server Actions use first-party session cookies, Next.js origin checks and the server-only REST client. Mutation dispatch selects known OpenAPI operations and passes their request parameters, idempotency keys and expected order versions. The backend validates the DTO, actor, financial authority and transition. Order room tickets are distinct from session tokens and are the only credentials returned to the browser for Socket.IO.
