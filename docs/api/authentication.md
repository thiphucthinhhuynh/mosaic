# Authentication API

**Status:** design only — not yet implemented. This documents the approved contract for Milestone 3 (see [docs/roadmap.md](../roadmap.md)). It will be updated to match the real implementation, including any corrections found during coding, in the same PR that implements Milestone 3 — until then, treat this as the spec, not a description of running behavior.

Auth strategy background: [docs/architecture.md](../architecture.md) §6.

## Overview

Mosaic V1 auth is email/password based. On successful login or signup, the API issues a single JWT access token as an `httpOnly` cookie. There is no refresh token in V1 (see [docs/architecture.md](../architecture.md) §6 and §18 for why, and Milestone 14 in the roadmap for when that changes).

All endpoints below are under `/api/v1/auth`. All responses use the standard envelope described in [docs/architecture.md](../architecture.md) §8: `{ data, error, meta }`.

## `POST /api/v1/auth/signup`

Creates a new user account and logs the user in.

**Auth required:** No (Guest tier)

**Request body:**
```json
{
  "username": "string, 4-30 chars",
  "email": "string, valid email",
  "password": "string, minimum length TBD by the Zod schema in packages/shared"
}
```

**Success — `201 Created`:**
```json
{
  "data": { "id": "string", "username": "string", "profilePic": "string | null" },
  "error": null
}
```
Sets the auth cookie. Response body never includes `email` or `password_hash`.

**Errors:**
| Status | Case |
|---|---|
| 400 | Request body fails Zod validation (missing/malformed fields) |
| 409 | Username or email already taken |

## `POST /api/v1/auth/login`

**Auth required:** No (Guest tier)

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Success — `200 OK`:** same shape as signup's success response; sets the auth cookie.

**Errors:**
| Status | Case |
|---|---|
| 400 | Request body fails validation |
| 401 | Email not found, or password does not match |

Note: login intentionally returns the same `401` for "no such user" and "wrong password" — distinguishing them in the response would let an attacker enumerate valid emails.

## `POST /api/v1/auth/logout`

**Auth required:** Authenticated

**Request body:** none.

**Success — `200 OK`:** `{ "data": null, "error": null }`. Clears the auth cookie.

**V1 limitation:** this clears the cookie client-side only. Because there is no refresh-token/session table yet, the token itself remains cryptographically valid until its natural expiry if captured before logout — see [docs/architecture.md](../architecture.md) §6. Server-side revocation on logout is a Milestone 14 addition.

## `GET /api/v1/auth/me`

Returns the currently authenticated user.

**Auth required:** Authenticated

**Success — `200 OK`:**
```json
{
  "data": { "id": "string", "username": "string", "profilePic": "string | null" },
  "error": null
}
```

**Errors:**
| Status | Case |
|---|---|
| 401 | No valid auth cookie present |

## Cookie Details

| Attribute | Value |
|---|---|
| Name | TBD in implementation (e.g. `mosaic_token`) |
| `httpOnly` | `true` — inaccessible to client-side JavaScript, mitigating XSS token theft |
| `Secure` | `true` in production (requires HTTPS) |
| `SameSite` | `Lax` |
| Expiry | Matches JWT expiry (V1: long-lived, e.g. 7 days — see [docs/architecture.md](../architecture.md) §6) |

## Error Response Shape

All errors use the shared envelope's `error` field, populated by the centralized error handler described in [docs/architecture.md](../architecture.md) §11:

```json
{
  "data": null,
  "error": { "code": "string", "message": "string", "details": "optional, e.g. field-level validation errors" }
}
```
