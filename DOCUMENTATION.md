# Routify — Documentation

Version 0.1.0

---

## Installation

**Prerequisites**

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| Rust + Cargo | ≥ 1.77 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLI tools | latest | `xcode-select --install` |

```bash
npm install
```

---

## Commands

```bash
npm run dev          # Frontend dev server → http://localhost:1420
npm run build        # Production web bundle → dist/
npm run tauri dev    # Native macOS app (hot reload, requires Rust)
npm run tauri build  # .app bundle → src-tauri/target/release/bundle/macos/
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 (WKWebView + Rust) |
| Frontend framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict mode) |
| State management | Pinia |
| Routing | Vue Router 4 (hash history) |
| Internationalisation | vue-i18n 9 (Composition API, legacy: false) |
| Build tool | Vite 5 |
| Notifications | @tauri-apps/plugin-notification |
| AI | Google Gemini API (REST, no SDK) |

---

## Project Structure

```
routify/
├── src/
│   ├── main.ts                         # App entry — Pinia, Router, i18n
│   ├── App.vue                         # Root shell + page transitions + notification init
│   ├── assets/
│   │   ├── css/global.css              # ALL design tokens — never use raw hex in components
│   │   └── locales/
│   │       ├── en.json                 # Source of truth for all translation keys
│   │       └── fr.json                 # French translations (mirrors en.json)
│   ├── composables/
│   │   ├── useNotifications.ts         # Native notification scheduler (checks every 60s)
│   │   └── useAiSuggestions.ts         # Gemini API call + reactive status/suggestions
│   ├── routes/
│   │   └── index.route.ts              # Route definitions + onboarding guard
│   ├── stores/
│   │   ├── routines.store.ts           # Routines CRUD, streaks, localStorage
│   │   ├── onboarding.store.ts         # Onboarding state (userName, goals, scheduleType)
│   │   └── settings.store.ts           # App settings (Gemini API key)
│   ├── pages/
│   │   ├── today.vue                   # Time-block daily view
│   │   ├── routines.vue                # Routine list + create/edit modals + AI suggest
│   │   ├── templates.vue               # 8 curated starter packs
│   │   ├── stats.vue                   # Streaks + 63-day heatmap
│   │   ├── breathing.vue               # 4-7-8 breathing exercise
│   │   └── onboarding.vue              # 5-step fullscreen wizard
│   └── components/
│       ├── layout/
│       │   ├── AppSidebar.vue          # Navigation + progress ring + streak
│       │   └── LangSwitcher.vue        # Locale toggle
│       ├── routines/
│       │   └── RoutineCard.vue         # Expandable card, checklist, inline edit, DnD
│       └── ui/
│           ├── ProgressRing.vue        # SVG circular progress indicator
│           ├── HabitLibrary.vue        # Modal: search/browse/create habit items
│           └── AiSuggestModal.vue      # Modal: Gemini AI routine suggestions
├── src-tauri/
│   ├── tauri.conf.json                 # Window config, bundle, identifier
│   ├── capabilities/
│   │   └── default.json                # Tauri v2 permissions (core, shell, notification)
│   ├── Cargo.toml                      # Rust deps: tauri, tauri-plugin-shell, tauri-plugin-notification
│   └── src/
│       ├── main.rs
│       └── lib.rs                      # Tauri builder (shell + notification plugins)
└── public/
    └── fonts/                          # JetBrains Sans + JetBrains Mono (woff2, self-hosted)
```

---

## Data Model

### IRoutine

```ts
interface IRoutine {
  id: string                // random base-36 (8 chars)
  name: string
  icon: string              // single char/symbol e.g. '☀' '✦'
  color: string             // hex — used as per-card accent
  timeBlock: TTimeBlock     // 'morning' | 'afternoon' | 'evening' | 'anytime'
  days: TDayOfWeek[]        // empty = every day; ['mon','wed','fri'] = specific days
  reminderTime?: string     // 'HH:MM' 24h — triggers native notification
  items: IRoutineItem[]
  streak: number            // consecutive days fully completed
  completedDates: string[]  // ISO date strings 'YYYY-MM-DD'
  createdAt: string         // ISO date string
}
```

### IRoutineItem

```ts
interface IRoutineItem {
  id: string
  label: string
  durationMin?: number
  completed: boolean
}
```

### IOnboardingState

```ts
interface IOnboardingState {
  completed: boolean
  userName: string
  goals: TOnboardingGoal[]      // 'morning_routine' | 'fitness' | 'skincare' | 'productivity' | 'sleep' | 'mindfulness'
  scheduleType: TScheduleType | null  // 'morning_person' | 'balanced' | 'night_owl'
}
```

---

## localStorage

| Key | Content |
|-----|---------|
| `routify_routines` | `IRoutine[]` — all routines with items and history |
| `routify_onboarding` | `IOnboardingState` — profile data from wizard |
| `routify_settings` | `{ geminiApiKey: string }` — Gemini API key |
| `routify_locale` | `'en'` \| `'fr'` — active locale |

No server. No account. No sync. Resetting a key in DevTools → Application → Local Storage clears that slice.

---

## Stores

### routines.store.ts

```ts
// State
routines: IRoutine[]

// Computed
routinesByBlock     // { morning, afternoon, evening, anytime } — today only
totalCompleted      // number — items completed today
totalItems          // number — items scheduled today

// Methods
routinesForToday(dateStr?)  → IRoutine[]
toggleItem(routineId, itemId)
addRoutine(data)
addItemToRoutine(routineId, item)
reorderItems(routineId, from, to)   // pointer-DnD reorder
updateItem(routineId, itemId, patch)
deleteItem(routineId, itemId)
updateRoutine(id, patch)
deleteRoutine(id)
resetTodayItems()
```

### onboarding.store.ts

```ts
state: IOnboardingState
completeOnboarding(data)
reset()
```

### settings.store.ts

```ts
geminiApiKey: string
setGeminiApiKey(key)   // persists to localStorage
```

---

## Routing

Hash history (Tauri-compatible, no server needed).

| Path | Page | Guard |
|------|------|-------|
| `/today` | Today view | requires onboarding complete |
| `/routines` | Routine manager | requires onboarding complete |
| `/templates` | Template packs | requires onboarding complete |
| `/stats` | Stats & streaks | requires onboarding complete |
| `/breathing` | Breathing exercise | requires onboarding complete |
| `/onboarding` | Onboarding wizard | `meta: { fullscreen: true }` — hides sidebar |

`router.beforeEach` redirects to `/onboarding` if `onboarding.state.completed === false`.

---

## Notifications

Implemented in `src/composables/useNotifications.ts`, initialised in `App.vue`.

Behaviour:
1. On mount, requests macOS notification permission via `@tauri-apps/plugin-notification`
2. Runs a `setInterval` every 60 seconds
3. For each routine scheduled today with a `reminderTime` set:
   - If current `HH:MM` matches `reminderTime`
   - And the routine is not fully completed
   - And this routine hasn't already been notified today
   - → sends a native macOS notification

Deduplication key: `routineId:YYYY-MM-DD` (in-memory `Set`, resets on app restart).

Tauri permission required: `notification:default` (declared in `src-tauri/capabilities/default.json`).

---

## AI Suggestions

Implemented in `src/composables/useAiSuggestions.ts`.

**Model:** `gemini-2.0-flash`
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
**Response format:** `application/json` (forced via `generationConfig.responseMimeType`)

Context sent to the model:
- User goals from onboarding
- Schedule type from onboarding
- Free-text interests from the modal input
- Existing routine names (to avoid duplicates)

Expected response: a JSON array of 3 `IAiRoutineSuggestion` objects.

```ts
interface IAiRoutineSuggestion {
  name: string
  icon: string          // symbol from allowed set
  color: string         // hex
  timeBlock: TTimeBlock
  days: TDayOfWeek[]
  items: { label: string; durationMin?: number }[]
}
```

The API key is stored in `routify_settings` (localStorage). It is only sent to `generativelanguage.googleapis.com` — never to any other server.

To get a free key: [aistudio.google.com](https://aistudio.google.com)

---

## Drag & Drop

Implemented in `RoutineCard.vue` using **pointer events** (not the HTML5 DnD API, which is unreliable in WKWebView/Tauri).

Mechanism:
1. `mousedown` on the drag handle → captures `dragIndex`, attaches `mousemove` + `mouseup` to `document`
2. `mousemove` → `slotFromY(clientY)` queries all `.checklist-row` elements via `getBoundingClientRect()`, finds the insertion slot, updates `dropIndex`
3. `mouseup` → computes final `to` index (adjusted for splice shift), calls `store.reorderItems(routineId, from, to)`, removes listeners

Index adjustment: when moving an item *downward*, removing it from `from` shifts all subsequent indices by −1, so `to = slot − 1`. When moving *upward*, `to = slot`.

---

## Internationalisation

| File | Role |
|------|------|
| `src/assets/locales/en.json` | Source of truth — add keys here first |
| `src/assets/locales/fr.json` | French mirror — every key in `en.json` must exist here |
| `src/plugins/i18n.ts` | vue-i18n setup, `setLocale()` helper |

Rules:
- Never hardcode strings in templates — always use `t('key')`
- Always call `useI18n()` in `<script setup>`
- Locale persisted in `routify_locale`

---

## Design Tokens

All tokens are in `src/assets/css/global.css`. **Never use raw hex values in components.**

### Colours

| Token | Value | Use |
|-------|-------|-----|
| `--bg-deep` | `#07070a` | App background |
| `--bg-base` | `#0d0d12` | Main content area |
| `--bg-elevated` | `#17171c` | Cards, modals, panels |
| `--bg-overlay` | `rgba(255,255,255,0.05)` | Hover states |
| `--bg-card` | `#111116` | Routine cards |
| `--accent` | `#14b8a6` | Primary CTA, active states, progress |
| `--accent-glow` | `rgba(20,184,166,0.12)` | Subtle accent backgrounds |
| `--accent-orange` | `#ea580c` | Streaks, energy |
| `--border` | `rgba(255,255,255,0.08)` | Default borders |
| `--border-strong` | `rgba(255,255,255,0.14)` | Focused / hover borders |
| `--text-primary` | `#f1f1f3` | Headings, labels |
| `--text-secondary` | `#a0a0b0` | Body text |
| `--text-muted` | `#5a5a72` | Hints, metadata |
| `--success` | `#22c55e` | Completion states |
| `--danger` | `#ef4444` | Delete actions |

### Typography

| Font | Use |
|------|-----|
| JetBrains Sans | All UI text, labels, buttons |
| JetBrains Mono | Numbers, metrics, durations, times |

Both served locally from `/public/fonts/` (woff2).

### Spacing

8pt grid. Tokens `--sp-1` (4px) through `--sp-16` (64px).

### Easing

| Token | Value |
|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--duration-fast` | `120ms` |
| `--duration-base` | `200ms` |
| `--duration-slow` | `400ms` |

---

## Tauri Configuration

**App identifier:** `com.routify.app`
**Window:** 1100×720 (min 820×560), resizable, overlay title bar
**Plugins:** `tauri-plugin-shell`, `tauri-plugin-notification`
**Capabilities:** `core:default`, `shell:allow-open`, `notification:default`

Bundle targets: all (`.app`, `.dmg`).

---

## Features

| Feature | Status |
|---------|--------|
| Onboarding wizard (5 steps) | ✅ |
| Time-block daily view | ✅ |
| Routine CRUD | ✅ |
| Inline item edit / delete | ✅ |
| Drag & drop item reorder | ✅ |
| Habit library (search + custom) | ✅ |
| Templates (8 packs) | ✅ |
| Streak tracking | ✅ |
| 63-day activity heatmap | ✅ |
| Native macOS notifications | ✅ |
| 4-7-8 breathing exercise | ✅ |
| AI routine suggestions (Gemini) | ✅ |
| Multilingual (EN / FR) | ✅ |
| localStorage persistence | ✅ |
| No account / no server | ✅ |
| Pomodoro / step timer | 🔲 |
| iCloud sync | 🔲 |
| Dynamic routines (weather, history) | 🔲 |

---

## Notes

- All animations use CSS transitions — no JS animation libraries
- Hash history routing is required for Tauri compatibility (no server to handle HTML5 history)
- Tauri icons must be RGBA PNGs — `generate_context!()` reads them at compile time; RGB-only PNGs cause a Rust compile error
- Old routines using the legacy `frequency` field are auto-migrated to `timeBlock + days` in `loadFromStorage()`
