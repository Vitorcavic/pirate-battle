# Performance report

> **Status: measurements still to be taken.** No FPS, frame-time or memory value below has been measured yet.

## Environment (fill in)

| Item | Value |
| --- | --- |
| Hardware | TO FILL (e.g. MacBook model, CPU, RAM) |
| Browser | TO FILL (Chrome version) |
| Resolution / DPR | TO FILL |
| Build | `npm run build && npm run preview` (production build, http://localhost:4173) |
| Match configuration | 180 s session, 2.5 s spawn interval (defaults otherwise) |

## 1. Frame rate over a three-minute match

How to measure (5 minutes of setup, 3 minutes of play):

1. Open the preview build, set **Game session time = 180** in Options.
2. DevTools → Performance → enable *Screenshots* off, start recording, press **Play**, play the full match (move, fire all weapons), stop recording at the end.
3. Read from the *Frames* track: average FPS and the share of dropped frames. For the 95th percentile of frame time, export the trace and compute it, or use the snippet below.

Snippet (paste in the console right after the match starts; run for 180 s, then read `report()`):

```js
const t = []; let last = performance.now();
(function loop(now){ t.push(now - last); last = now; requestAnimationFrame(loop) })(last);
window.report = () => {
  const s = [...t].sort((a,b)=>a-b);
  const avg = t.reduce((a,b)=>a+b,0)/t.length;
  return { frames: t.length, avgFps: +(1000/avg).toFixed(1), p95ms: +s[Math.floor(s.length*0.95)].toFixed(2), maxMs: +s.at(-1).toFixed(2) };
};
```

Entity count: in dev (`npm run dev`) the console exposes `__sim`; `__sim.world.enemies.length` and `__sim.world.projectiles.length` give the live counts. The configured maximum is 12 alive enemies.

| Metric | Result |
| --- | --- |
| Average FPS | TO FILL |
| p95 frame time (ms) | TO FILL |
| Max frame time (ms) | TO FILL |
| Peak enemies alive | TO FILL (cap: 12) |
| Peak projectiles alive | TO FILL |

## 2. Memory after five start / play / exit cycles

1. DevTools → Memory → take a heap snapshot (**baseline**) on the main menu.
2. Repeat 5 times: **Play**, play about 30 s (fire a lot), pause, **Main Menu**.
3. Click the trash icon (force GC) and take a second heap snapshot.
4. Compare *Summary* sizes; check that the number of `Sprite`, `Container`, `Graphics` and `canvas` elements does not grow per cycle (the DOM should have 0 canvases on the menu).

| Measure | Baseline | After 5 cycles |
| --- | --- | --- |
| JS heap (MB) | TO FILL | TO FILL |
| Detached DOM nodes | TO FILL | TO FILL |
| Canvas elements on the menu | 0 expected | TO FILL |

Conclusion: TO FILL (stable / growth observed and where).

## What the implementation does to avoid growth

- Textures are loaded once and shared; only display objects are destroyed on exit.
- Projectile sprites are pooled; effects are capped at 64 and destroy themselves.
- Dead entities are removed by in-place compaction (no per-step array allocations).
- The ticker callback and all window/document listeners are removed on `destroy()`.

## Limitations (fill in what you observe)

- TO FILL (e.g. throttled background tabs, high-DPR displays, low-end mobile not tested).
