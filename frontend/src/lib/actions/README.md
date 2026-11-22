# Server Actions boundary

Place authenticated feature mutations here after the shared API slice contract is reviewed. Validate input, session, Origin/CSRF and invoke the server-only API client. Do not put pricing, authorization or transition rules in Actions; the backend enforces them. No placeholder business action is registered in the setup increment.
