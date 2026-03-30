# Routify

Stop managing your habits in a notes app.

Build and track your daily routines in a focused, distraction-free macOS app — with time blocks, streaks, AI suggestions, and native notifications.

Built with **Tauri 2 + Vue 3 + TypeScript**.

---

## 🚨 The Problem

Building consistent habits is hard when your tools work against you:

- Habit apps are either too simple or too bloated
- No structure for *when* to do things during the day
- No way to build your own routines step by step
- Constant context-switching between apps

## 💥 The Solution

Routify gives you:

- A **time-blocked daily view** — Morning, Afternoon, Evening, Anytime
- **Custom routines** with ordered, checkable steps
- **Streaks** that reward consistency
- **AI-generated suggestions** based on your goals
- **Native macOS notifications** so you never miss a routine

No account. No subscription. No cloud. Everything stays on your machine.

---

## ⚡ Quick Start

**Prerequisites:** Node.js ≥ 18, Rust ≥ 1.77 (for native build)

```bash
npm install

# Frontend only (no Rust needed)
npm run dev
# → http://localhost:1420

# Native macOS app
npm run tauri dev
```

---

## 🎯 Features

### 📅 Today View
See only what matters today. Routines are grouped by time block and filtered by day of the week. A progress bar tracks how much of your day is done.

### 🗂 Routine Management
Create routines with a name, icon, color, time block, and specific days. Each routine contains an ordered list of steps. Reorder steps by dragging, edit or delete them inline.

### ✦ Habit Library
Add habits to any routine from a curated library (health, mindfulness, productivity, fitness, sleep, beauty). Search across all categories, or type anything to create a fully custom step — no library entry needed.

### 🤖 AI Suggestions (Gemini)
Let AI generate 3 personalized routines based on your onboarding goals and anything you describe — your job, your schedule, your interests. Uses the free Gemini API. Your key stays local.

### 📦 Templates
8 curated starter packs to hit the ground running: Morning Power, Glow Up Skincare, Athlete Mode, Deep Work, Evening Wind Down, Clean Space, Entrepreneur Pack, Mindfulness.

### 📊 Stats
Track your best streak, total completions, and a 63-day activity heatmap per routine. Spot patterns and gaps at a glance.

### 🔔 Native Notifications
Set a reminder time on any routine. Routify sends a native macOS notification when it's time — only if the routine isn't already completed.

### 🌬 Breathing Exercise
A built-in 4-7-8 breathing guide to reset between routines. Counts cycles, shows animated phases (Inhale / Hold / Exhale).

### 🌍 Multilingual
Available in English and French. Locale is saved locally and can be switched at any time from settings or the onboarding screen.

---

## 🧠 How It Works

Routify runs entirely offline. All data is stored in `localStorage` — no server, no account, no sync required.

On first launch, a 4-step onboarding wizard collects your name, goals, and schedule type to personalise suggestions and time block ordering.

---

## 🎨 Design

Dark, minimal macOS-native aesthetic. Teal accent (`#14b8a6`), deep background (`#07070a`), JetBrains Sans + Mono typography. Every interaction has a CSS transition — no JS animation libraries.

---

## 📘 Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for full technical details — data model, architecture, store API, design tokens, and more.

---

## 📄 License

MIT
