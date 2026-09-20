# Stores API

**Status:** implemented in Milestone 3.

Authorization strategy background: [docs/architecture.md](../architecture.md) §7. All endpoints below are under `/api/v1`. All responses use the standard envelope described in [docs/architecture.md](../architecture.md) §8: `{ data, error, meta }`. Request schemas (`createStoreSchema`, `updateStoreSchema`) and the `PublicStore` response type are defined once in `packages/shared` and used by both the backend and the frontend forms.

## The `PublicStore` shape

Every success response below returns one or more objects of this shape:

```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string | null",
  "location": "string | null",
  "createdAt": "string (ISO 8601)",
  "owner": { "id": "string (UUID)", "username": "string" }
}
```

The embedded `owner` is fetched via a Prisma nested `select` (never `include`), so `passwordHash`/`email` never leave the database for this query path — the same technique [docs/api/users.md](users.md) documents for the standalone user endpoint.

## `GET /api/v1/stores`

Paginated list of every store, newest first.

**Auth required:** No (Guest tier)

**Query parameters:**

| Param   | Type    | Default | Notes     |
| ------- | ------- | ------- | --------- |
| `page`  | integer | `1`     | 1-indexed |
| `limit` | integer | `20`    | Max `100` |

**Success — `200 OK`:**

```json
{
  "data": [{ "...": "PublicStore" }],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```

**Errors:**

| Status | Case                                                                 | Code               |
| ------ | -------------------------------------------------------------------- | ------------------ |
| 400    | `page`/`limit` fails validation (e.g. non-numeric, `limit` over 100) | `VALIDATION_ERROR` |

## `GET /api/v1/stores/:id`

**Auth required:** No (Guest tier)

**Success — `200 OK`:** a single `PublicStore`.

**Errors:**

| Status | Case                                      | Code               |
| ------ | ----------------------------------------- | ------------------ |
| 400    | `:id` is not a syntactically valid UUID   | `VALIDATION_ERROR` |
| 404    | `:id` is a valid UUID but no store has it | `NOT_FOUND`        |

## `POST /api/v1/stores`

Creates a store owned by the caller.

**Auth required:** Authenticated

**Request body** (`createStoreSchema`):

```json
{
  "name": "string, 1-100 chars",
  "description": "string, up to 2000 chars, optional",
  "location": "string, up to 255 chars, optional"
}
```

The owner is always taken from the session (`req.user.id`, set by `requireAuth` from the JWT) — the schema has no `ownerId` field, so one supplied in the body is silently stripped rather than trusted.

**Success — `201 Created`:** the new `PublicStore`.

**Errors:**

| Status | Case                  | Code               |
| ------ | --------------------- | ------------------ |
| 400    | Body fails validation | `VALIDATION_ERROR` |
| 401    | No valid session      | `UNAUTHORIZED`     |

## `PUT /api/v1/stores/:id`

Updates a store the caller owns. Any subset of fields may be sent.

**Auth required:** Resource Ownership (must be the store's owner)

**Request body** (`updateStoreSchema`): `createStoreSchema.partial()`, with a refine rejecting a body with none of `name`/`description`/`location` present.

**Success — `200 OK`:** the updated `PublicStore`.

**Errors:**

| Status | Case                                       | Code               |
| ------ | ------------------------------------------ | ------------------ |
| 400    | Body is empty, or fails validation         | `VALIDATION_ERROR` |
| 401    | No valid session                           | `UNAUTHORIZED`     |
| 403    | Session is valid but not the store's owner | `FORBIDDEN`        |
| 404    | `:id` is a valid UUID but no store has it  | `NOT_FOUND`        |

Authorization is checked before body validation (`requireOwnership` runs ahead of `validateBody`), so a non-owner's request 403s regardless of whether its payload would have been valid — they never learn which.

## `DELETE /api/v1/stores/:id`

**Auth required:** Resource Ownership (must be the store's owner)

**Success — `200 OK`:** `{ "data": null, "error": null }` — matching the envelope convention used by logout, rather than a bodyless `204`.

**Errors:** same table as `PUT` above, minus the 400 (no body to validate).

## `GET /api/v1/users/me/stores`

The caller's own stores. Lives under `/users` (matching the URL), implemented in the `users` module but delegating to the `stores` module's service layer.

**Auth required:** Authenticated

**Success — `200 OK`:** `PublicStore[]`, newest first, no pagination (a user's own store count isn't expected to need it).

**Errors:**

| Status | Case             | Code           |
| ------ | ---------------- | -------------- |
| 401    | No valid session | `UNAUTHORIZED` |

## The `requireOwnership` middleware

`PUT`/`DELETE` above are the first real use of the Resource Ownership tier from [docs/architecture.md](../architecture.md) §7. `requireOwnership(loadResource)` takes a loader function resolving to `{ ownerId }` and is generic over any resource type — including one owned through a relation (e.g. an item owned via its store, in Milestone 4) rather than only a direct `ownerId` column. It runs after `requireAuth` and before body validation, in this order: `validateParams → requireAuth → requireOwnership → validateBody → handler`.
