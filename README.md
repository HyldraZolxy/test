# ⚔️ Beat Saber Stream Overlay

Real-time **Beat Saber** overlay for **OBS Studio / Streamlabs**, powered by the
[HttpSiraStatus](https://github.com/denpadokei/HttpSiraStatus) mod, with **live ScoreSaber and BeatLeader PP**.

A single HTML file: no server, nothing to install besides the game mod.

## Features

- **Three skins**: Horizon Glass (default), Neon Cyber, Classic Terminal — switch with `S`.
- **Live PP** on ranked maps for ScoreSaber and BeatLeader, including modifiers (see [How PP are computed](#how-pp-are-computed)).
- Song card with cover, difficulty, BPM, note count and a smooth progress bar.
- Score, accuracy, rank, combo, multiplier and energy widgets — each can be hidden.
- Map saber colors used as accent colors (optional).
- Settings panel (`O`) saved locally and synced live across every OBS source; profiles can be exported/imported.
- Built-in simulator (`M` or `?mock=true`) to position the overlay without launching the game.

## Setup in OBS

1. Install [HttpSiraStatus](https://github.com/denpadokei/HttpSiraStatus) in Beat Saber.
2. Download `beat-saber-overlay.html` from the [latest release](../../releases/latest).
3. In OBS, add a **Browser** source:
   - check **Local file** and select `beat-saber-overlay.html`
     (or uncheck it and use `file:///C:/path/to/beat-saber-overlay.html?skin=neon` to pass [URL parameters](#url-parameters));
   - size **1920 × 1080**;
   - enable **Shutdown source when not visible**.
4. To configure: right-click the source → **Interact**, then use the [shortcuts](#keyboard-shortcuts).

The page background is transparent.

## URL parameters

| Parameter | Values | Default | Description |
| :--- | :--- | :--- | :--- |
| `skin` | `horizon`, `neon`, `classic` | `horizon` | Initial skin |
| `scale` | `0.5` – `3` | saved option (`1.15`) | Overlay zoom; overrides the saved option |
| `twitch` (alias `stream`) | `true` / `1` | `false` | Twitch preset: scale 125% |
| `mock` | `true` / `1` | `false` | Start with the simulator |
| `settings` (alias `config`) | `true` / `1` | `false` | Open the settings panel at load |
| `host` | IP or hostname | `127.0.0.1` | HttpSiraStatus host |
| `port` | `1` – `65535` | `6557` | HttpSiraStatus port |
| `debug` | `true` / `1` | `false` | Log every game event to the browser console |

## Keyboard shortcuts

Active when the overlay has focus (OBS → **Interact**):

| Key | Action |
| :--- | :--- |
| `S` | Next skin |
| `O` | Open / close the settings panel |
| `M` | Toggle live game / simulator |
| `Esc` | Close the settings panel |

## How PP are computed

### Star ratings

The overlay looks the played map up in this order, per leaderboard. An answer of "not ranked" is final;
only unreachable sources are skipped:

1. **Official APIs** (ScoreSaber, BeatLeader). They only accept requests from `localhost`, so they are
   **blocked when the overlay is opened from `file:///`** — the normal OBS setup.
2. **Ranked index** — a compact file (~280 KB) rebuilt every 6 hours by a GitHub Action and served from GitHub,
   which works from `file:///`. It contains ScoreSaber stars and complete BeatLeader data. Cached locally.
   If unreachable, the overlay downloads the full [SongDetailsCache](https://github.com/kinsi55/BeatSaber_SongDetails)
   dump instead (~10 MB, BeatLeader ratings estimated).
3. **BeatSaver** — last resort; its star ratings can be outdated.

### Formulas

Accuracy comes from the game and is modifier-neutral.

- **ScoreSaber**: `pp = curve(accuracy × M) × maxPP`, `M = 1 + Σ modifiers`.
  Negative modifiers always count (NO −5%, NB −10%, NA −30%, SS −30%, NF −50%).
  Positive modifiers (FS +8%, DA +2%, GN +4%) **only count on leaderboards that allow them** — almost none.
- **BeatLeader**: port of the server formula (pass + acc + tech PP, inflated).
  Speed modifiers (FS / SF / SS) use **per-map ratings**; other modifiers scale all ratings.
- **No Fail** only counts once energy reached 0 (soft fail): −50% on ScoreSaber, 0 PP on BeatLeader.

The test suite checks both formulas against real leaderboard scores.

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev          # dev server on http://localhost:5173 (official APIs reachable from here)
npm run build        # type check + single-file build → dist/index.html
npm test             # unit tests (Vitest)
npm run lint
npm run build:index  # build the ranked index locally → ranked-index.json
```

Open `http://localhost:5173/?mock=true` to work without the game.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is organized, how to add a skin or an option.

### Publishing

- **Release**: push a tag (`git tag v1.2.0 && git push origin v1.2.0`). The
  [Release workflow](.github/workflows/release.yml) lints, tests, builds and attaches `beat-saber-overlay.html`.
- **Ranked index**: the [Ranked index workflow](.github/workflows/ranked-index.yml) publishes
  `ranked-index.json` to the `ranked-index` branch every 6 hours (run it once manually after the first push).
  The repository must be public, and `HOSTED_RANKED_INDEX_URL` in [src/config.ts](src/config.ts)
  must point to it.
