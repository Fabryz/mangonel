# Mangonel Modernization & Refactor Plan (2026)

## What this repository currently does

Mangonel is a minimal real-time multiplayer browser game template using:

- **Node.js + Express 3** as the web server.
- **Socket.IO 0.9** for real-time communication.
- **HTML5 Canvas 2D** rendering on the client.
- Shared game entities (like `Player`) reused by both client and server.

Core gameplay/template capabilities:

- Player connect/disconnect and synchronized player list.
- Authoritative-ish server-side movement handling with map-bound checks.
- Periodic ping measurement and broadcast.
- Basic projectile event flow (spawn/broadcast), with partial collision scaffolding.
- Client-side viewport/fps/debug panel and keyboard movement input.

## Current architecture and risks

### Runtime/Dependencies
- Node engine is pinned to **0.6.x**, Express to **3.1.x**, Socket.IO to **0.9.x** — all obsolete and unsupported.
- Server still uses legacy Express middleware APIs (`app.configure`, `express.bodyParser`, etc.).

### Reliability/Correctness
- Several projectile functions are incomplete/buggy (`projectile_speed` undefined, recursive `sendProjectiles` naming bug, array `.map()` used without reassignment/filtering).
- Global mutable state (`players`, `projectiles`, `pings`, counters) is not encapsulated.
- No formal tests, linting, or type checks.

### Security/Operations
- No authentication or anti-cheat strategy.
- No rate limits for all event types.
- Logging is ad-hoc `console.log` only (no structured logs, levels, trace IDs).
- No metrics/health checks/observability baseline.

---

## Recommended update stack (2026)

### Backend
- Upgrade to **Node 22 LTS** (or latest active LTS in your deployment policy).
- Move from legacy CommonJS spaghetti to a modular codebase (TS preferred).
- Use **Express 5** (or Fastify if maximizing throughput) + modern middleware.
- Upgrade to **Socket.IO 4.x** with namespaces/rooms and connection middleware.

### Frontend
- Keep Canvas for simplicity, but modularize rendering/input/game loop.
- Optional: migrate rendering to **PixiJS** if richer sprites/effects are planned.
- Use ES modules + Vite for build/dev tooling.

### Cross-cutting
- **TypeScript** end-to-end for shared DTOs and event contracts.
- Runtime schema validation with **zod** (or valibot).
- Structured logging with **pino**.
- Metrics with **prom-client** + `/metrics` endpoint.
- Basic tracing with **OpenTelemetry** (optional phase 2).

---

## Refactor roadmap

## Phase 0 — Baseline & Safety Net (1–2 days)
1. Add CI (lint, typecheck, test).
2. Add smoke tests for connect/move/disconnect using `socket.io-client`.
3. Add benchmark script for tick loop + broadcast load.

## Phase 1 — Platform upgrade (2–4 days)
1. Upgrade Node/Express/Socket.IO.
2. Replace deprecated middleware and startup code.
3. Introduce env-based configuration (`.env`, schema validation).
4. Add graceful shutdown and health/readiness endpoints.

## Phase 2 — Code organization (3–5 days)
1. Split server into modules:
   - `core/game-state`
   - `net/socket-handlers`
   - `domain/player`, `domain/projectile`
   - `infra/logger`, `infra/config`
2. Replace ad-hoc globals with a `GameState` container.
3. Define typed event contracts (client↔server).

## Phase 3 — Performance improvements (3–6 days)
1. Use fixed timestep game loop (`tickRate` configurable, e.g., 20–60 Hz).
2. Replace O(n) linear player lookup with `Map<string, Player>`.
3. Use spatial partitioning (uniform grid/quadtree) for projectile collision broad-phase.
4. Delta-compress/batch movement snapshots.
5. Add per-socket backpressure and event queue limits.

## Phase 4 — Logging & observability (2–3 days)
1. Implement `pino` JSON logs with levels.
2. Correlate logs with request/socket IDs.
3. Add metrics:
   - connected players
   - event throughput (per event)
   - tick duration percentile
   - dropped packets/backpressure counts
4. Add alert thresholds and dashboard starter.

## Phase 5 — Security hardening (3–5 days)
1. Add handshake auth (JWT/session token).
2. Validate all inbound payloads via schemas.
3. Enforce authoritative simulation rules:
   - max movement per tick
   - fire rate limits per player
   - bounds and cooldown checks server-side only
4. Add abuse protections:
   - IP/socket rate limits
   - message size limits
   - invalid-event strike policy
5. Add dependency scanning + SAST in CI.

## Phase 6 — Feature evolution (parallel stream)
1. Player-vs-player collision and hit registration.
2. Deterministic projectile lifecycle (TTL + deletion sync).
3. Map/tileset support and spawn balancing.
4. Reconciliation/interpolation for smoother movement.
5. Optional matchmaking/rooms and persistent profiles.

---

## Suggested target architecture

- **Gateway layer**: Socket.IO handlers, auth, validation.
- **Simulation layer**: deterministic game loop + authoritative state.
- **Replication layer**: state diffing, interest management (viewport-aware updates).
- **Observability layer**: logs/metrics/traces.
- **Security layer**: payload schemas, anti-cheat guards, quotas.

---

## Priority matrix (quick wins first)

### Highest ROI in first sprint
1. Dependency/runtime upgrade.
2. Typed payload validation.
3. Game state encapsulation + `Map` lookups.
4. Structured logging + metrics baseline.

### Next sprint
1. Fixed timestep + snapshot batching.
2. Projectile subsystem rewrite.
3. Security/rate-limiting hardening.

---

## Concrete deliverables for a 2-sprint plan

### Sprint 1
- Node/Express/Socket.IO upgraded and deployed.
- TS migration started (server core + shared event types).
- Healthcheck + basic metrics + structured logs live.
- Existing move/connect flow covered by automated tests.

### Sprint 2
- Projectile subsystem fixed and fully tested.
- Spatial partitioning + performance benchmark report.
- Auth handshake + payload validation + anti-abuse controls.
- Client movement interpolation and smoother visual sync.
