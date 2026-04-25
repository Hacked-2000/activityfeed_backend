# Activity Feed — Backend

Node.js + TypeScript REST API for a tenant-isolated activity feed with high write throughput, cursor-based pagination, and async job processing.

## Stack

- **Express 5** + TypeScript
- **MongoDB** (Mongoose) — activity storage with compound index
- **Redis** (Upstash in production) — BullMQ queue backend + feed cache
- **BullMQ** — async job queue for decoupled writes

## Project Structure

```
src/
├── config/
│   ├── db.ts          # MongoDB connection
│   └── redis.ts       # Redis client + BullMQ connection factory
├── controller/
│   └── activity.controller.ts  # POST and GET handlers
├── interface/
│   └── activity.interface.ts   # TypeScript types
├── middleware/
│   └── validate.ts    # Request validation
├── model/
│   └── activity.model.ts       # Mongoose schema + compound index
├── routes/
│   └── activity.routes.ts
├── services/
│   ├── cache.service.ts        # Redis feed cache
│   ├── queue.service.ts        # BullMQ queue + enqueue helper
│   └── worker.service.ts       # BullMQ worker — DB writes
└── index.ts           # App entry point
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/activities | Queue a new activity (202) |
| GET | /api/v1/activities/:tenantId | Fetch feed with cursor pagination |
| GET | /health | Health check |

### POST /api/v1/activities

```json
{
  "tenantId": "tenant_001",
  "actorId": "user_1",
  "actorName": "Alice",
  "type": "created",
  "entityId": "doc_42",
  "metadata": {}
}
```

Returns `202 Accepted` immediately — write is queued, not blocking.

Valid types: `created` `updated` `deleted` `commented` `assigned` `status_changed` `uploaded` `exported`

### GET /api/v1/activities/:tenantId

Query params:

| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max 100, default 20 |
| cursor | ISO date string | `nextCursor` from previous response |
| type | string | Filter by activity type |

Response:

```json
{
  "success": true,
  "data": [
    {
      "actorId": "user_1",
      "actorName": "Alice",
      "type": "created",
      "entityId": "doc_42",
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "nextCursor": "2024-01-01T00:00:00.000Z",
  "hasMore": true
}
```

## Architecture

```
POST /activities
  → validate middleware
  → enqueueActivity() — BullMQ job (Redis)
  → 202 Accepted  ← returns here, < 1ms

BullMQ Worker (async)
  → Activity.create() — MongoDB
  → invalidateFeedCache() — Redis

GET /activities/:tenantId
  → check Redis cache
  → if hit: return cached response
  → if miss: MongoDB query with cursor + compound index
  → cache result → return response
```

## Local Setup

```bash
cd Backend
npm install
```

Create a `.env` file:

```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/activityfeed
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CACHE_TTL=60
WORKER_CONCURRENCY=10
```

Start dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

## Deployment (Render)

1. Push to GitHub
2. New Web Service → connect repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables:

```
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/activityfeed
REDIS_URL=rediss://default:<token>@<host>:6379
CACHE_TTL=60
WORKER_CONCURRENCY=10
```

## Design Decisions

**Queue-based writes** — The POST handler enqueues to BullMQ and returns `202` immediately. The worker handles the DB write asynchronously. This decouples write throughput from DB latency and absorbs traffic spikes without dropping requests.

**Cursor pagination** — Uses `createdAt: { $lt: cursor }` with compound index `{ tenantId: 1, createdAt: -1 }`. No `skip()` — seek performance is O(log n) regardless of how deep in the feed you are.

**Redis cache** — Feed results are cached per tenant/cursor/filter with a configurable TTL. Invalidated on every new write via `invalidateFeedCache(tenantId)`.

**Tenant isolation** — Every MongoDB query and Redis cache key is scoped to `tenantId`. No cross-tenant data access is possible.

**Idempotent jobs** — BullMQ job ID is derived from `tenantId + actorId + entityId + type + unix_second`. Duplicate submissions within the same second produce one record.
