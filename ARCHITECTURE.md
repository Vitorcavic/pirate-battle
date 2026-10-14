# Architecture

## Overview

Four layers with one-way dependencies:

```
React UI  ──reads──▶  Zustand stores  ◀──snapshots (~10 Hz)──  GameController
                                                                    │
                          ┌─────────────────────────────────────────┼──────────────┐
                          ▼                                         ▼              ▼
                    Simulation (pure TS)  ◀── InputState ──  Keyboard/Touch    GameRenderer (PixiJS)
                    rules, collisions, AI                                     reads the world, never writes
```

- `src/game/sim/` — game rules. Pure TypeScript, **no PixiJS or DOM imports**. Runs in a unit test or Node.
- `src/game/render/` — PixiJS: asset loading, arena, ships, projectiles, effects, health bars. Read-only view of the world.
- `src/game/input/` — keyboard and on-screen touch input, both producing the same `InputState`.
- `src/game/GameController.ts` — owns the ticker, the simulation, the input and the renderer; handles pause and publishes snapshots.
- `src/ui/` — React screens (menu, options, match HUD, pause, result, lists).
- `src/api/` + `src/mocks/` — Axios client, TanStack Query hooks, MSW handlers and fixtures.
- `src/store/` — Zustand stores (UI navigation, HUD snapshot, submission queue) and `localStorage` persistence.

## React / PixiJS integration

- `PixiCanvas` only mounts and unmounts. It creates the Pixi `Application`, then a `GameController`.
- **Strict Mode:** `createPixiApp` is async. An `AbortController` is passed in; if the effect cleanup runs while `app.init()` is
  pending, the app destroys itself when init resolves and returns `null`. A second `aborted` check after the promise
  covers cleanup running between resolve and `.then`. The result is exactly one canvas and no leaked listeners.
- **No React renders per frame.** The controller publishes a plain-data `MatchSnapshot` about 10 times per second into a
  Zustand store (immediately on pause/resume/end). The HUD selects whole numbers, so React re-renders only when a visible
  value changes. Screen-reader status text announces events (score, pause, end), never the clock.
- **Canvas fit:** the world has a fixed logical size (1280×720). Only the CSS size changes (`ResizeObserver`), keeping the
  aspect ratio. `resolution = min(devicePixelRatio, 2)` with `autoDensity`. `clientToWorld` converts pointer coordinates.
- **Match isolation:** `MatchScreen` is keyed by `matchNonce`; every new match remounts with a new `matchId`, a fresh
  settings snapshot, a new controller and a new simulation.

## Simulation loop

- **Fixed timestep** of 1/60 s with an accumulator (`Simulation.advance`). Frame time is clamped to 0.1 s to avoid the
  "spiral of death". All speeds are px/s or rad/s; no value is per frame, so behavior is frame-rate independent.
- Step order: player movement → spawner → enemy AI/movement → combat (cooldowns, firing, projectile motion, hits, cleanup) → clock and end checks.
- **Events:** the simulation appends facts (`shot`, `hit`, `enemyDestroyed`, `matchEnded`) to `world.events`. The renderer
  reacts (effects) and the controller clears them each frame. Rules never call rendering code.
- **Determinism:** spawn positions, kinds and chaser skins come from a seeded PRNG (mulberry32). Same seed and same inputs give the same match.
- **Match end:** `status = 'ended'` makes `step` and `advance` return immediately, so movement, shots, damage, spawns and
  score all stop. The controller reports the result exactly once (`endNotified`).
- **Pause:** while paused the ticker callback returns early (nothing advances). On pause the keyboard is detached (held keys
  dropped) and touch is reset; on resume `resetClock()` clears the accumulator. Resume only comes from an explicit button.
- **Config snapshot:** `buildMatchConfig` deep-clones `DEFAULT_CONFIG` plus the user's two options with `structuredClone`.
  Later changes in Options affect only new matches.

## Collisions

All shapes are circles (ships, projectiles, islands). Tile art on islands is decorative; the collision radius follows the island config.

- Ship vs island: push-out along the center-to-center normal by the penetration depth. This makes ships slide around islands.
- Ship vs arena: clamp the center so the whole circle stays inside the bounds (applied after islands, as the final authority).
- Enemy vs enemy: symmetric separation so ships do not stack.
- Projectiles: point-in-circle tests. At 520 px/s and 1/60 s steps a ball moves about 8.7 px per step, less than any target
  radius, so tunneling cannot occur with the shipped values (a segment test would be needed for much faster balls).
- **Damage applies once:** a projectile is flagged `dead` in the same step it hits; the loops skip dead projectiles and
  `break` after the first target. Dead projectiles and enemies are removed by in-place compaction (no per-step allocations).
- **Chaser impact:** damages the player, destroys the Chaser and does not score. Only player-shot kills add a point.
- **Enemy AI:** Chaser turns toward the player with a limited turn rate. Shooter approaches until 75% of its attack range,
  then holds, aims, and fires when within range and aimed (±0.2 rad) with its cooldown ready. Both steer around islands
  using a tangent-direction avoidance, then the push-out guarantees they never overlap.
- **Spawning:** every `enemySpawnInterval` seconds. The first two spawns are fixed (Chaser, Shooter) so both types always
  appear; afterwards kind is weighted by `spawnWeight`. A point must be inside the arena margin, at least
  `minDistanceFromPlayer` from the player, off islands and off other ships (up to `maxAttempts`, otherwise it retries next step).

## Resource management

- Textures are loaded once through `Assets` with progress and error handling (`AssetLoadError`), cached at module level and
  shared across matches. Failures unload the partial entries so Retry really refetches. Textures are never destroyed on match exit.
- `GameRenderer.destroy()` destroys its container tree (`children: true`, textures untouched). The Pixi app is destroyed by `PixiHandle.destroy()`.
- Projectile sprites are pooled (hidden and reused). Effects have a hard cap (64) and destroy themselves on completion.
  Ship views and health bars are created on first sight of an enemy and disposed when it leaves the world.
- `GameController.destroy()` removes the ticker callback, the keyboard/blur/visibility/orientation listeners and the test hooks.
- Keyboard capture (`preventDefault`) exists only between `attach()` and `detach()`, i.e. while a match is active and not paused.

## Persistence (localStorage)

| Key | Content |
| --- | --- |
| `pb:settings:v1` | The two user options (validated on read, defaults on corruption) |
| `pb:last-match:v1` | Last finished match plus an `acknowledged` flag; an unseen result reappears after a refresh |
| `pb:player:v1` | Anonymous player identity (random id and name) |
| `pb:sync:v1` | Submission queue (unconfirmed and recently saved records) |
| `pb:mock:db:v1` | Confirmed records of the mock server |
| `pb:mock:scenario:v1` | Selected mock scenario |

Reads are defensive: invalid JSON or invalid shapes fall back to defaults instead of crashing.

## Ranking and history

**Contracts** (`src/api/contracts.ts`): `MatchRecord` (matchId, playerId, playerName, endedAt, score, duration, reason, config),
`RankingEntry` (adds global `rank`), `Page<T>`, and `SubmitMatchResponse { record, created }`.

- `GET /ranking?sessionDuration&enemySpawnInterval&page&pageSize` — only matches with the same config are compared.
  Order: score descending, then earlier `endedAt`, then `matchId`. Fully deterministic.
- `GET /players/:id/matches?page&pageSize` — most recent first.
- `POST /matches` — idempotent. The client generates `matchId` when the match starts and sends it also as `Idempotency-Key`.
  An existing id returns the stored record with `200 created:false`; a new one returns `201`.

**Client:** Axios instance with timeout and an interceptor that turns every failure into `ApiError` (`timeout | network | http`,
with a `retryable` flag: network, timeout, 408, 429, 5xx). Responses are shape-checked, so a wrong 200 becomes an error, not a crash.

**TanStack Query:**
- Query keys include the page (and the config for ranking): `['ranking', duration, spawn, page]`, `['history', playerId, page]`.
- `placeholderData: keepPreviousData` keeps the old page visible while the next loads (background refresh). `refetchOnMount: 'always'` refreshes a list every time its tab is shown.
- A new request for a key cancels the previous fetch (the `signal` reaches Axios), and a response can only ever fill its own key, so a late response cannot overwrite newer data.
- Retries: exponential backoff, only for retryable errors, configurable count. UI states: loading, error with retry, empty, and "showing last loaded data" when a background refresh fails.
- After a successful submission, `ranking` and `history` queries are invalidated, so both tabs update.

**Submission queue** (`syncStore` + `useMatchSync`):
- At match end the record is enqueued and persisted immediately (a refresh right then keeps it). `enqueue` ignores an existing `matchId`.
- `useMatchSync` (mounted once at the app root) sends **one record at a time** with `useMutation`; automatic retries reuse the same `matchId`.
- Status per record: `queued → sending → saved | failed`. A failed record shows its error and a **Retry** button (only a failed record can be retried, so repeated clicks do nothing). After a refresh, anything unconfirmed is queued again.
- The player can start another match while a record is pending, and API failures never block gameplay or options.
- Timeout after the server saved the record: the retry returns `created:false` for the same `matchId`, so there is exactly one history entry and one ranking entry.

## MSW

- Handlers, fixtures and the in-memory "server" logic (sorting, pagination, validation, idempotency) are shared by dev, tests and production.
- Scenarios (`src/mocks/scenarios.ts`) are data: latency (fixed, seeded random, out-of-order) plus failure rules per endpoint (`timeout`, `network`, `http`, `persist-then-timeout`, optionally only the first N requests).
- `persist-then-timeout` writes the record and then never answers, reproducing the dangerous "saved but unknown" case.
- A catch-all `passthrough` handler lets game assets through. The worker starts before React renders; if it fails to start the game still works (lists show errors).

## Testing hooks

With `?e2e=1`, `window.__pb` exposes `getState()`, `step(seconds)` and `setup(scenario)`. `?manual=1` makes time advance only through `step()`, which
runs the real fixed-step simulation with the real keyboard/touch input. `setup` only places entities and turns the spawner off; no rule is bypassed.
Fixed seeds make spawns reproducible. The hooks do not exist without `e2e=1`.

## Balance decisions

| Decision | Reason |
| --- | --- |
| Chaser: 130 px/s, 1.8 rad/s turn, 20 HP, 20 contact damage | Slower and less agile than the player (180 px/s, 2.2 rad/s): it can be outrun, but punishes standing still |
| Shooter: 90 px/s, holds at 75% of 320 px range, 1.6 s cooldown, 8 damage | Pressure without making dodging impossible |
| Player: front 10 dmg / 0.35 s; broadside 3×8 dmg / 1.2 s per side | Front is sustained fire; broadsides are burst with a position cost |
| Ship radius 26 | About half the 66 px retina art width at 0.75 scale |
| First spawns fixed (Chaser, Shooter) | Both enemy types are guaranteed in a default match |
| Max 12 alive enemies | Keeps the arena readable and the frame time stable |

## Limitations

- Sound effects are not implemented.
- Circular island colliders approximate the square tile art; ships can stop slightly short of the visible shore.
- Anonymous player identity only (no accounts); history is per browser.
- Ranking compares only matches with identical options, so changing options shows a different (possibly empty) ranking.
- Performance numbers: see `PERFORMANCE.md` for what was and was not measured.
