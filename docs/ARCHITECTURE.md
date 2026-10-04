# Architecture

React 19 + TypeScript (strict) + Tailwind CSS v4, bundled by Vite into **one self-contained HTML file**
(`vite-plugin-singlefile`) so OBS can load it from disk.

## Layout

```
src/
├── main.tsx              Boot: initOptions(), startRankedSync(), render <App/>
├── config.ts             Every default value and tuning constant
├── app/                  Shell: event source selection, help bar, shortcuts, URL parameters
├── game/                 HttpSiraStatus domain
│   ├── protocol.ts       Wire types
│   ├── reducer.ts        Pure event → state reducer
│   ├── store.ts          Game store (batched notifications) + stable slice selectors
│   ├── hooks.ts          useBeatmap, useScore, useCombo, useEnergy, usePPInputs…
│   ├── useSongProgress.ts  Extrapolated song clock (~25 FPS, runs only while displayed)
│   └── sources/          LiveSource (WebSocket) and MockSource (simulator)
├── options/              User options: schema + validation, persistence, store + cross-window sync
├── pp/                   Live PP
│   ├── scoresaber.ts, beatleader.ts, modifiers.ts, curves.ts   Pure formulas
│   ├── mapKey.ts         Map identity and name normalization
│   ├── sources/          Official APIs, ranked index, SongDetails dump, BeatSaver
│   ├── rankedService.ts  Source fallback chain + ranked data store
│   └── useLivePP.ts      Hook combining ranked data with the live accuracy and modifiers
├── settings/             Settings dialog (sections declared in settingsSchema.ts)
├── skins/                registry.ts, shared/ (display hooks, PPBadges), one folder per skin
└── utils/                Formatting and colors
scripts/build-ranked-index.ts   Builds the hosted ranked index (run by GitHub Actions)
```

## Data flow

```
HttpSiraStatus ──ws──► LiveSource ─┐
                                   ├─► gameStore.dispatch(event) ──► reduceEvent() ──► GameState
MockSource (simulator) ────────────┘                                                     │
                                                                                         ▼
                        skins ◄── game/hooks (fine-grained useSyncExternalStore selectors)
                          ▲
                          ├── useLivePP ◄── rankedStore ◄── rankedService (follows the played map)
                          └── useOverlayOptions ◄── optionsStore ◄─► localStorage / IndexedDB / BroadcastChannel
```

- **Event sources** own the connection state; the reducer never touches it.
- **Batching**: bursts of note events within one microtask trigger a single render; lifecycle events
  (song start/end, menu) render immediately.
- **Stable snapshots**: slice selectors (`createSliceSelector`) return the same object while its fields are equal,
  so components re-render only when what they display changes.
- **No import-time side effects**: global services are started explicitly in `main.tsx`.

## PP pipeline

1. `startRankedSync()` watches the game store; on a new map difficulty it calls `loadRankedData(ref)`.
2. For each leaderboard, `resolvePlatform()` tries: official API → ranked index → BeatSaver.
   A request token drops responses that arrive after another map started.
3. `useLivePP()` combines the ranked data with the live accuracy, active modifiers and soft-fail state,
   and calls the pure formulas in `scoresaber.ts` / `beatleader.ts`.

The ranked index format (`pp/sources/rankedIndex.ts`) is shared by the client and the build script.
Bump `RANKED_INDEX_VERSION` on any format change; older clients then fall back to the dump.

## How to add a skin

1. Create `src/skins/<id>/` with a root component (e.g. `<Id>Overlay.tsx`).
2. Use the shared hooks: `useScoreDisplay`, `useComboDisplay`, `useEnergyDisplay`, `useSaberTheme`,
   `useStandbyVisible`, `useAutoHide`, and `<PPBadges/>` for PP.
3. Honor every `show*` option and keep the root `pointer-events-none`.
4. Register it in `src/skins/registry.ts`. It is then reachable with `?skin=<id>` and the `S` key.

## How to add an option

1. Add the field to `OverlayOptions` and `DEFAULT_OPTIONS` in `src/options/schema.ts`
   (non-boolean options also need a rule in `sanitizeOptions`).
2. Boolean options: add an entry to a section in `src/settings/settingsSchema.ts` — the panel renders it.
3. Read it in skins with `useOverlayOptions()`.

## Testing

`npm test` runs Vitest on the pure logic: PP formulas (checked against real ScoreSaber/BeatLeader scores in
`pp/__fixtures__`), modifiers, protobuf dump parsing, ranked index encoding, the source fallback chain,
the game reducer, option validation, URL parsing and formatters.
