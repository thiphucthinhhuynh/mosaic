# Items API

**Status:** implemented in Milestone 4.

Authorization strategy background: [docs/architecture.md](../architecture.md) §7. All endpoints below are under `/api/v1`. All responses use the standard envelope described in [docs/architecture.md](../architecture.md) §8: `{ data, error, meta }`. Request schemas (`createItemSchema`, `updateItemSchema`) and the `PublicItem`/`PublicItemDetail` response types are defined once in `packages/shared` and used by both the backend and the frontend forms.

Items are nested under stores for **listing and creating** (`/stores/:storeId/items`) and addressed directly for **reading, updating, and deleting** (`/items/:id`). An item has no owner of its own: it is owned by whoever owns its store, and every ownership check below resolves the owner through that relation.

## The `PublicItem` shape

Returned by the list, create, and update endpoints:

```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string | null",
  "price": "string (decimal, e.g. \"24.99\")",
  "quantity": "integer, >= 0",
  "category": "string",
  "createdAt": "string (ISO 8601)",
  "images": [{ "id": "string (UUID)", "url": "string" }]
}
```

`price` is a JSON **string**, not a number. Postgres stores it as `Decimal(10, 2)`; Prisma's `Decimal.toJSON()` serializes it as a string so no float rounding can creep in on the way to the client. Whole-number prices come back normalized (`150.00` → `"150"`). Clients should format it for display only and never do arithmetic on the parsed value.

## The `PublicItemDetail` shape

Returned only by `GET /api/v1/items/:id`. It is a `PublicItem` plus the owning store and that store's owner, so the standalone item page can show who is selling it without a second request:

```json
{
  "...": "PublicItem",
  "store": {
    "id": "string (UUID)",
    "name": "string",
    "owner": { "id": "string (UUID)", "username": "string" }
  }
}
```

The store and owner are fetched with nested Prisma `select`s (never `include`), so `passwordHash`/`email` never leave the database — the same technique documented in [docs/api/users.md](users.md) and [docs/api/stores.md](stores.md). The list-within-a-store endpoint omits `store` because the URL already scopes it.

## `GET /api/v1/stores/:storeId/items`

Paginated list of one store's items, newest first.

**Auth required:** No (Guest tier)

**Query parameters:**

| Param   | Type    | Default | Notes     |
| ------- | ------- | ------- | --------- |
| `page`  | integer | `1`     | 1-indexed |
| `limit` | integer | `20`    | Max `100` |

**Success — `200 OK`:**

```json
{
  "data": [{ "...": "PublicItem" }],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

**Errors:**

| Status | Case                                                  | Code               |
| ------ | ----------------------------------------------------- | ------------------ |
| 400    | `:storeId` is not a valid UUID, or bad `page`/`limit` | `VALIDATION_ERROR` |
| 404    | `:storeId` is a valid UUID but no store has it        | `NOT_FOUND`        |

The 404 is deliberate: the handler checks that the store exists before querying its items, because an empty list would otherwise be indistinguishable from "no such store". The handler lives in the `stores` module (the URL is under `/stores`) and calls into the `items` module's service layer.

## `GET /api/v1/items/:id`

**Auth required:** No (Guest tier)

**Success — `200 OK`:** a single `PublicItemDetail`.

**Errors:**

| Status | Case                                     | Code               |
| ------ | ---------------------------------------- | ------------------ |
| 400    | `:id` is not a syntactically valid UUID  | `VALIDATION_ERROR` |
| 404    | `:id` is a valid UUID but no item has it | `NOT_FOUND`        |

## `POST /api/v1/stores/:storeId/items`

Creates an item in a store the caller owns.

**Auth required:** Resource Ownership (must own the store)

**Request body** (`createItemSchema`):

```json
{
  "name": "string, 1-100 chars",
  "description": "string, up to 2000 chars, optional",
  "price": "number, > 0, at most 99999999.99",
  "quantity": "integer, >= 0",
  "category": "string, 1-50 chars",
  "imageUrls": ["valid URL", "..."]
}
```

`imageUrls` is optional; omitting it creates an item with no images. Images are URLs only — there is no file upload. The price cap mirrors the database column (`Decimal(10, 2)`), so an over-cap value gets a clean `400` instead of a raw database error. Zero and negative prices, and negative or fractional quantities, are rejected.

The item and its images are written in **one database transaction**: either both land or neither does, so a failure partway through can never leave a half-populated item.

**Success — `201 Created`:** the new `PublicItem`.

**Errors:**

| Status | Case                                              | Code               |
| ------ | ------------------------------------------------- | ------------------ |
| 400    | `:storeId` is malformed, or body fails validation | `VALIDATION_ERROR` |
| 401    | No valid session                                  | `UNAUTHORIZED`     |
| 403    | Session is valid but not the store's owner        | `FORBIDDEN`        |
| 404    | `:storeId` is a valid UUID but no store has it    | `NOT_FOUND`        |

Middleware order is `validateParams → requireAuth → requireOwnership → validateBody → handler`, the same as the store mutations: authorization runs before body validation, so a non-owner gets a `403` without learning whether their payload would have been valid.

## `PUT /api/v1/items/:id`

Updates an item in a store the caller owns. Any subset of fields may be sent.

**Auth required:** Resource Ownership (must own the item's store)

**Request body** (`updateItemSchema`): `createItemSchema.partial()`, with a refine rejecting a body that contains none of the fields.

**`imageUrls` is a replacement set, not a patch.** When present, the item's images become exactly that list (an empty array removes them all); when omitted, the existing images are left untouched. The delete-then-insert happens in one transaction, like create. There is no add/remove-by-image-id operation — the edit form submits the full list of URLs, and nothing in this milestone needs finer granularity.

**Success — `200 OK`:** the updated `PublicItem`.

**Errors:**

| Status | Case                                                        | Code               |
| ------ | ----------------------------------------------------------- | ------------------ |
| 400    | `:id` is malformed, body is empty, or body fails validation | `VALIDATION_ERROR` |
| 401    | No valid session                                            | `UNAUTHORIZED`     |
| 403    | Session is valid but doesn't own the item's store           | `FORBIDDEN`        |
| 404    | `:id` is a valid UUID but no item has it                    | `NOT_FOUND`        |

## `DELETE /api/v1/items/:id`

**Auth required:** Resource Ownership (must own the item's store)

Deletes the item; its images are removed with it by the database (`onDelete: Cascade` on `ItemImage.itemId`).

**Success — `200 OK`:** `{ "data": null, "error": null }`, matching the store delete and logout endpoints rather than a bodyless `204`.

**Errors:** same table as `PUT` above, minus the body-related `400`.

## Ownership through a relation

`Item` has no `ownerId` column. `PUT`/`DELETE /items/:id` pass `requireOwnership` a loader, `findItemOwnerId`, that reads `item.store.ownerId` and returns it as `{ ownerId }`; `POST /stores/:storeId/items` reuses the store loader (`findStoreOwnerId`) already used by the store mutations. The middleware itself is unchanged from Milestone 3 and knows nothing about where the owner came from — this is the case its loader-based design was built for. The integration tests explicitly prove that a second signed-in user cannot update or delete another user's item, and that the item is untouched afterwards.
