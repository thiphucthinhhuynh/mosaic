# Health Check API

**Status:** implemented in Milestone 0.

## `GET /api/v1/health`

Confirms the API process is running. No database dependency yet — this becomes relevant once Milestone 1 introduces PostgreSQL, at which point this endpoint may be extended to check DB connectivity.

**Auth required:** No (Guest tier)

**Success — `200 OK`:**

```json
{
  "data": { "status": "ok", "timestamp": "2026-07-25T04:56:05.220Z" },
  "error": null
}
```

`status` and `timestamp` are typed by the shared `HealthStatus` type in `packages/shared`, consumed by both the route handler (`apps/api/src/modules/health`) and the frontend's health-check hook (`apps/web/src/features/health`) — see [docs/architecture.md](../architecture.md) §8 for the shared response-envelope convention this follows.

**Errors:** none defined — this endpoint does not currently perform any operation that can fail.
