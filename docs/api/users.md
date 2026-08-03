# Users API

**Status:** implemented in Milestone 1.

## `GET /api/v1/users/:id`

Returns the public representation of a user. Exists in this milestone to prove the data layer end-to-end — profile browsing, editing, and every other user-facing feature arrive in later milestones.

**Auth required:** No (Guest tier)

**Path parameter:**

| Param | Type | Notes                                                                                                 |
| ----- | ---- | ----------------------------------------------------------------------------------------------------- |
| `id`  | UUID | See [ADR-005](../adr/ADR-005-primary-key-strategy.md) for why ids are UUIDs, not sequential integers. |

**Success — `200 OK`:**

```json
{
  "data": {
    "id": "52051d0f-abaf-4848-b4f0-f170ca6dd5f4",
    "username": "ada_lovelace",
    "profilePic": null
  },
  "error": null
}
```

`email` and `passwordHash` are never present in the response — the repository query selects only `id`, `username`, and `profilePic` from the database, so the excluded fields never enter application memory for this code path (see [docs/architecture.md](../architecture.md) §19). This is also the exact public-user shape [docs/api/authentication.md](authentication.md) already documents for the signup/login/me responses Milestone 2 will add.

**Errors:**

| Status | Case                                     | Code               |
| ------ | ---------------------------------------- | ------------------ |
| 400    | `:id` is not a syntactically valid UUID  | `VALIDATION_ERROR` |
| 404    | `:id` is a valid UUID but no user has it | `NOT_FOUND`        |

Both use the standard error envelope from [docs/architecture.md](../architecture.md) §8/§11:

```json
{ "data": null, "error": { "code": "NOT_FOUND", "message": "No user found with id \"...\"." } }
```
