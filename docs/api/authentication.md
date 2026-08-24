# Authentication API

**Status:** implemented in Milestone 2.

Auth strategy background: [docs/architecture.md](../architecture.md) §6.

## Overview

Mosaic auth is email/password based. On successful login or signup, the API issues a single JWT access token as an `httpOnly` cookie. There is no refresh token — this is a permanent design choice, not a placeholder for a later addition (see [docs/architecture.md](../architecture.md) §6 and §18 for why).

All endpoints below are under `/api/v1/auth`. All responses use the standard envelope described in [docs/architecture.md](../architecture.md) §8: `{ data, error, meta }`. Request/response schemas are defined once in `packages/shared` (`signupSchema`, `loginSchema`, `PublicUser`) and used by both the backend and the frontend forms.

## `POST /api/v1/auth/signup`

Creates a new user account and logs the user in.

**Auth required:** No (Guest tier)

**Request body:**

```json
{
  "username": "string, 4-30 chars",
  "email": "string, valid email",
  "password": "string, minimum 8 characters"
}
```

**Success — `201 Created`:**

```json
{
  "data": { "id": "string", "username": "string", "profilePic": "string | null" },
  "error": null
}
```

Sets the auth cookie. Response body never includes `email` or `passwordHash`.

Username/email uniqueness is checked **case-insensitively** before creating the user (`"JohnDoe"` and `"johndoe"` cannot both sign up), even though the stored value keeps the caller's exact casing — see [ADR-006](../adr/ADR-006-case-insensitive-uniqueness.md).

**Errors:**

| Status | Case                                                         | Code               |
| ------ | ------------------------------------------------------------ | ------------------ |
| 400    | Request body fails Zod validation (missing/malformed fields) | `VALIDATION_ERROR` |
| 409    | Username or email already taken (case-insensitive)           | `CONFLICT`         |

## `POST /api/v1/auth/login`

**Auth required:** No (Guest tier)

**Request body:**

```json
{ "email": "string", "password": "string" }
```

**Success — `200 OK`:** same shape as signup's success response; sets the auth cookie.

**Errors:**

| Status | Case                                        | Code               |
| ------ | ------------------------------------------- | ------------------ |
| 400    | Request body fails validation               | `VALIDATION_ERROR` |
| 401    | Email not found, or password does not match | `UNAUTHORIZED`     |

Note: login intentionally returns the same `401` with the same message for "no such user" and "wrong password" — distinguishing them in the response would let an attacker enumerate valid emails. Verified by an integration test that asserts both cases produce an identical error message.

## `POST /api/v1/auth/logout`

**Auth required:** Authenticated

**Request body:** none.

**Success — `200 OK`:** `{ "data": null, "error": null }`. Clears the auth cookie.

**Errors:**

| Status | Case                         | Code           |
| ------ | ---------------------------- | -------------- |
| 401    | No valid auth cookie present | `UNAUTHORIZED` |

**Limitation, accepted permanently:** this clears the cookie client-side only. Because there is no refresh-token/session table, the token itself remains cryptographically valid until its natural expiry if captured before logout — see [docs/architecture.md](../architecture.md) §6. Server-side revocation is not planned; see [docs/roadmap.md](../roadmap.md)'s Deliberately Out of Scope section.

## `GET /api/v1/auth/me`

Returns the currently authenticated user. Backs the frontend's session check on every page load — this is what makes a session survive a page refresh, since the cookie itself is what's actually persistent; this endpoint just re-derives the user from it.

**Auth required:** Authenticated

**Success — `200 OK`:**

```json
{
  "data": { "id": "string", "username": "string", "profilePic": "string | null" },
  "error": null
}
```

**Errors:**

| Status | Case                                                                | Code           |
| ------ | ------------------------------------------------------------------- | -------------- |
| 401    | No valid auth cookie present, or the cookie's user no longer exists | `UNAUTHORIZED` |

## Cookie Details

| Attribute  | Value                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Name       | `mosaic_token`                                                                                     |
| `httpOnly` | `true` — inaccessible to client-side JavaScript, mitigating XSS token theft                        |
| `Secure`   | `true` in production (`NODE_ENV === 'production'`), `false` in dev (no HTTPS on localhost)         |
| `SameSite` | `Lax`                                                                                              |
| Expiry     | 7 days (`AUTH_TOKEN_TTL_SECONDS` in `apps/api/src/lib/jwt.ts`), matching the JWT's own `expiresIn` |

## Error Response Shape

All errors use the shared envelope's `error` field, populated by the centralized error handler described in [docs/architecture.md](../architecture.md) §11:

```json
{
  "data": null,
  "error": {
    "code": "string",
    "message": "string",
    "details": "optional, e.g. field-level validation errors"
  }
}
```
