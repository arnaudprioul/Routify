# Routify

A macOS routine management app — daily, weekly, and monthly habits with a premium dark UI.

Built with **Tauri 2 + Vue 3 + TypeScript + Pinia**.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) or `nvm` |
| Rust + Cargo | ≥ 1.77 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLI tools | latest | `xcode-select --install` |

After installing Rust, reload your shell:
```bash
source "$HOME/.cargo/env"
rustc --version   # should print rustc 1.xx.x
```

---

## Setup

```bash
# Install JS dependencies
npm install
```

---

## Development

### Frontend only (browser, no Rust needed)
```bash
npm run dev
# → http://localhost:1420
```

### Native macOS app (requires Rust)
```bash
npm run tauri dev
```

---

## Build

```bash
# Production web bundle
npm run build

# macOS .app bundle (requires Rust)
npm run tauri build
```

Output: `src-tauri/target/release/bundle/macos/Routify.app`

---

## Project Structure

```
routify/
├── src/
│   ├── main.ts                     # App entry point
│   ├── App.vue                     # Root layout + page transitions
│   ├── assets/
│   │   ├── css/global.css          # Design tokens, reset, animations
│   │   └── scss/                   # SCSS files (future)
│   ├── routes/
│   │   └── index.route.ts          # Vue Router (hash history)
│   ├── stores/
│   │   └── routines.store.ts       # Pinia store — routines, streaks, localStorage
│   ├── pages/
│   │   ├── today.vue               # Dashboard — today's routines
│   │   ├── routines.vue            # Manage all routines + create new
│   │   ├── templates.vue           # 8 curated template packs
│   │   └── stats.vue               # Streaks + 63-day heatmap
│   └── components/
│       ├── layout/
│       │   └── AppSidebar.vue      # Fixed sidebar, progress ring, nav
│       ├── routines/
│       │   └── RoutineCard.vue     # Expandable card with checklist
│       └── ui/
│           └── ProgressRing.vue    # SVG circular progress indicator
├── src-tauri/
│   ├── tauri.conf.json             # App config (name, window size, bundle)
│   ├── Cargo.toml                  # Rust dependencies
│   ├── build.rs
│   └── src/
│       ├── main.rs
│       └── lib.rs                  # Tauri builder entry
├── public/
│   └── fonts/                      # JetBrains Sans + Mono (woff2)
├── vite.config.ts
└── tsconfig.json
```

---

## Data

All data is stored locally via **localStorage** — no server, no account needed.

Key: `routify_routines` — JSON array of routines with items, streaks, and completion dates.

To reset: open DevTools → Application → Local Storage → delete `routify_routines`.

---

## Design System

Tokens are defined in `src/styles/global.css`.

| Token | Value | Use |
|-------|-------|-----|
| `--bg-deep` | `#07070a` | App background |
| `--bg-elevated` | `#17171c` | Cards, panels |
| `--accent` | `#14b8a6` | Teal — active states, progress, CTAs |
| `--accent-orange` | `#ea580c` | Streaks, energy indicators |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | All transitions |

Fonts: **JetBrains Sans** (UI text) + **JetBrains Mono** (numbers, metrics) — served from `/public/fonts/`.

---

## Roadmap

### Version 1 (current)
- [x] Daily / Weekly / Monthly routines
- [x] Expandable checklists with completion tracking
- [x] Streak counter per routine
- [x] 8 curated templates (Morning, Skincare, Workout, Deep Work, Evening, Cleaning, Entrepreneur, Mindfulness)
- [x] Stats view with streak board + activity heatmap
- [x] LocalStorage persistence
- [x] Tauri native shell config

### Version 2
- [ ] Pomodoro / per-step timer
- [ ] macOS local notifications (reminders)
- [ ] "You haven't done your workout this week" nudges
- [ ] Guided mode — step-by-step walkthrough

### Version 3
- [ ] AI routine generation ("Create a morning routine for a founder")
- [ ] Dynamic routines (adapt to weather, fatigue, history)
- [ ] iCloud sync
