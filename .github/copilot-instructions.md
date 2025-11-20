## Quick orientation

This repo is an Order Execution Engine (Node + TypeScript backend; React + Vite frontend). The AI agent's job is to make small, safe, runnable changes: fix bugs, wire features, and keep the app runnable locally.

Keep edits minimal and runnable: backend uses `npm run dev` (tsx) and expects Redis + Postgres (see `docker-compose.yml`). Frontend uses Vite (`npm run dev`).

## Key architecture notes (read before editing)
- Backend entry: `backend/src/index.ts` — registers Fastify endpoints and two WebSocket entry points: `/ws/logs` and `/api/orders/status/:orderId`.
- Order submission: `backend/src/api/routes/order.ts` — POST `/api/orders/execute` creates a UUID, calls `orderQueue.add('market-order', orderData)` and returns `{ orderId }`.
- Queue & worker: `backend/src/lib/bullmq.ts` — defines `orderQueue` and a Worker with concurrency 10, attempts/backoff options. Worker publishes status updates and writes to Postgres via `sql`.
- Redis pub/sub pattern: status messages are published to a channel named by `orderId` (publisher.publish(orderId, message)). The WebSocket status endpoint subscribes to that channel and forwards messages to the client.
- DEX routing: `backend/src/services/router.ts` uses `services/dex/*` (Raydium, Meteora). To add/mimic a DEX, implement `Dex` in `services/dex/base.ts` and return a `Quote` with `price` and `fee`.
- Logging transport: Fastify/pino configured to forward logs to `transports/websocketTransport.js` which calls `services/logStream.broadcast` — used by `/ws/logs`.
- DB access: `backend/src/db/index.ts` uses the `postgres` tagged-template client. Schema creation is in `backend/src/db/schema.ts` and is invoked at startup (`createOrdersTable()` in `index.ts`).

## Project-specific conventions and gotchas
- ESM + TS with explicit `.js` extensions in imports inside `src` (e.g. `import orderRoutes from './api/routes/order.js'`). Keep `.js` extensions when editing imports so runtime resolution stays consistent with how dev uses `tsx`.
- Dev runner: backend uses `tsx src/index.ts` (see `backend/package.json` "dev" script). Do not assume `ts-node` or `node` for dev runs.
- Hardcoded local dev DB/Redis creds exist in code (`db/index.ts`). Prefer adding env var usage (but do not change credentials silently — mention in PR).
- Redis usage: code often calls `redis.duplicate()` for subscribers/publishers; releasing connections (quit/unsubscribe) is expected in websocket close handlers.

## How to run locally (explicit)
- Start infra: from repo root -> `cd backend` then `docker-compose up -d` (this starts Redis and Postgres on default mapped ports).
- Backend: `npm install` then `npm run dev` (runs `tsx src/index.ts`). The server listens on port 3000.
- Frontend: `cd frontend; npm install; npm run dev` (Vite). Frontend is independent and can be used for UI testing.

## Important files to reference when coding
- `backend/src/api/routes/order.ts` — order submission + WS subscription example (how orderId is used as Redis channel).
- `backend/src/lib/bullmq.ts` — job lifecycle, status publishing, concurrency, SQL updates.
- `backend/src/services/router.ts` and `backend/src/services/dex/*` — place to extend routing logic and add new DEX adapters.
- `backend/src/db/schema.ts` — table definitions and `createOrdersTable()` called on startup.
- `backend/transports/websocketTransport.ts` & `backend/src/services/logStream.ts` — how logs are streamed to WS clients.

## Typical small change flow for AGENTS
1. Run infra: `cd backend; docker-compose up -d`.
2. Start backend: `npm run dev` and frontend if needed: `cd frontend; npm run dev`.
3. Reproduce failing behavior, open the minimal files referenced above, change code, run quick test (e.g., POST to `/api/orders/execute` and open WS `/api/orders/status/:orderId`).
4. When touching production-sensitive configs (DB creds, ports), leave the old values or document the config change in the PR and ask the maintainer for env var names.

## Examples of patterns to follow (copyable mental models)
- Publish status: publisher.publish(orderId, JSON.stringify({ orderId, status, ... })) — messages are plain JSON strings.
- Subscribe in WS: create `subscriber = redis.duplicate(); subscriber.subscribe(orderId, cb); subscriber.on('message', (ch,msg)=> connection.send(msg))` and always `unsubscribe` and `quit` on close.
- Adding a job: `orderQueue.add('market-order', orderData)` (see `order.ts`).

## Safety & guardrails for AI agents
- Do not remove DB or Redis startup steps in `docker-compose.yml` without a maintainer note.
- Avoid changing global logger configuration or removing pino transports without updating logStream usage — these are used for live debugging (`/ws/logs`).
- When changing message formats on Redis channels, update both publisher (worker) and subscriber (WS route) together in the same PR.

## When to run tests & lint
- Backend unit tests: `cd backend; npm run test` (vitest). Run after changes to worker or router logic.
- Frontend build: `cd frontend; npm run build` to verify compile-time issues.

---
If anything above is unclear or you'd like more examples (small PR templates, preferred commit messages, or example HTTP requests), tell me which area to expand and I will update this file.
