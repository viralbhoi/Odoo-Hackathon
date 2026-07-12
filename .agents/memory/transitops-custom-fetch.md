---
name: TransitOps custom-fetch auth
description: How JWT auth is wired into the API client for TransitOps
---

## Auth flow
- Token stored in `localStorage` as key `transitops_token`
- User object stored as `transitops_user`
- `lib/api-client-react/src/custom-fetch.ts` reads token and attaches `Authorization: Bearer <token>` header on every request
- On 401 response: clears both localStorage keys, redirects to `/login` (only if not already on `/login`)
- Login success: store `accessToken` → `transitops_token`, user JSON → `transitops_user`

## Access token lifetime
15 minutes. Refresh tokens: 7 days, stored in DB (`refresh_tokens` table), hashed with SHA-256.

**Why:** JWT secret constants are in `artifacts/api-server/src/lib/auth.ts` — set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` env vars for production.
