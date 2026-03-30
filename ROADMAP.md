# Routify — Roadmap

> Priorités triées par impact produit. Les features marquées 🔥 sont des game-changers qui transforment l'usage quotidien.

---

## v0.2 — Focus & Flow
*Passer d'une checklist à une expérience guidée*

---

### 🔥 1. Mode "Start Routine"

**Pourquoi c'est prioritaire**
Aujourd'hui l'app est une to-do list. Ce mode la transforme en coach personnel. C'est la différence entre "noter ses tâches" et "les faire vraiment".

**UX**
1. Bouton **Start** sur chaque routine card (depuis Today ou Routines)
2. L'app passe en mode focus fullscreen (sidebar masquée, fond `--bg-deep` plus sombre)
3. Une étape à la fois, centrée à l'écran
4. Barre de progression en haut (`étape 2 / 5`)
5. Timer automatique si `durationMin` est défini
6. Boutons : **Done** (passe à la suivante) · **Skip** · **Pause**
7. Fin de routine → animation de complétion + streak mis à jour

**État à ajouter au store**
```ts
// État runtime — ne persiste pas en localStorage
interface IActiveSession {
  routineId: string
  currentItemIndex: number
  startedAt: string       // ISO timestamp
  isPaused: boolean
}
```

**Composants**
- `src/pages/focus.vue` — la vue fullscreen (route `/focus/:routineId`, `meta: { fullscreen: true }`)
- `src/components/ui/FocusTimer.vue` — cercle de progression SVG animé

---

### ⏱️ 2. Timer par étape

**Dépend de :** Mode Start Routine

**UX**
- Cercle SVG de progression (comme `ProgressRing` existant)
- Auto-démarre à l'entrée d'une étape qui a un `durationMin`
- Skip autorise de passer avant la fin
- Son léger à la fin (via l'API Web Audio — pas de fichier audio nécessaire)
- Si aucun `durationMin` : timer en comptage ascendant (stopwatch)

**Note technique**
Utiliser `useIntervalFn` (VueUse) ou un simple `setInterval` dans un composable `useTimer.ts`. Nettoyer dans `onUnmounted`.

---

### 🎨 3. Micro-interactions premium

L'app a déjà une bonne base CSS. Ces ajouts augmentent la rétention sans coût fonctionnel.

| Élément | Animation à ajouter |
|---------|-------------------|
| Checkbox cochée | Scale 1 → 1.2 → 1 + couleur `--card-color` |
| Routine complétée | Burst de particules CSS (pseudo-elements) |
| Drag & drop | Curseur `grab` → `grabbing` + légère élévation de la card |
| Streak +1 | Nombre qui "pop" avec `@keyframes` |
| Bouton Start | Ripple effect au clic |

---

### 🔕 4. Mode Deep Focus

**UX**
- Bouton dans la sidebar ou dans le Focus mode
- Masque : sidebar, progress bar, badges streak
- Fond légèrement plus sombre (`#050508`)
- Une seule routine visible, centrée
- `Escape` pour quitter

**Implémentation**
Ajouter `deepFocus: boolean` dans un store `ui.store.ts` léger. Lire dans `App.vue` pour appliquer une classe globale.

---

## v0.3 — Intelligence & Rétention

---

### 📊 5. Insights comportementaux (sans IA)

**Exemples de messages à générer depuis les données existantes**

| Condition | Message |
|-----------|---------|
| `completedDates` plus dense le matin | "Tu es 2× plus régulier sur tes routines matinales." |
| 3 jours sans compléter une routine | "Tu n'as pas fait *Evening Wind Down* depuis 3 jours." |
| Streak de 7 jours | "7 jours d'affilée sur Morning Routine — c'est une habitude." |
| Routine jamais complétée | "*Workout* n'a jamais été terminée. Trop longue ?" |

**Implémentation**
Computed dans `stats.store.ts` (à créer) qui analyse `completedDates` + `items.length` + `durationMin` total. Affichage dans la vue Stats sous forme de cards texte, sans graphique.

---

### 🧠 6. AI — Au-delà de la génération

**Actuellement :** génère des routines.

**À ajouter dans `AiSuggestModal.vue` — nouveaux modes :**

**"Améliore cette routine"**
- Passe la routine existante (nom, items, durations) au modèle
- Gemini propose : réordonner, fusionner des étapes redondantes, ajuster les durées
- Résultat : diff visuel avec accept/reject par changement

**"Pourquoi j'abandonne ?"**
- Passe les `completedDates` + le nombre d'items à Gemini
- Retourne une analyse courte (3 lignes max) + 1 suggestion concrète

**Prompt type pour "améliore" :**
```
Here is a routine: ${JSON.stringify(routine)}
Suggest improvements: reorder steps for better flow, adjust durations,
remove redundancy. Return ONLY a JSON array of items with the same structure.
```

---

### 🔄 7. Smart Rescheduling

**Problème** : si l'utilisateur rate sa routine de 45 min à 7h, elle disparaît de sa journée.

**Solution**
- Si une routine prévue n'est pas complétée et que l'heure est dépassée → badge "Missed" sur la card
- Bouton **"Do it now"** → crée une session focus immédiate
- Bouton **"Short version"** → lance le mode focus mais ne présente que les N premières étapes (où N = items qui tiennent dans 15 min)

**Données**
Aucun changement au modèle. Calculé à la volée depuis `reminderTime` vs `Date.now()` + `completedDates`.

---

### 🔁 8. Auto-flow entre routines

**UX**
- En fin d'une routine en mode Focus → si une autre routine est prévue dans les 30 min → proposer de l'enchaîner directement
- "Morning Routine terminée. Skincare est aussi prévue ce matin — la faire maintenant ?"
- Bouton **Start next** ou **Not now**

---

## v0.4 — macOS natif

---

### 🍏 9. Menu bar app

**Pourquoi c'est important sur macOS**
L'app menu bar est le point d'entrée le plus naturel sur Mac. Accès sans Alt+Tab, visible en permanence.

**UX**
- Icône dans la menu bar
- Popover : routines du jour avec cases à cocher
- Bouton "Start" par routine
- Click sur l'icône → ouvre la fenêtre principale

**Implémentation Tauri**
```rs
// src-tauri/src/lib.rs
use tauri::Manager;
// SystemTray avec menu dynamique
// Tauri v2 : tauri-plugin-tray
```

Ajouter `tauri-plugin-tray` à `Cargo.toml`. Générer le menu depuis les données en appelant des commandes Tauri côté Rust.

---

### 🔔 10. Notifications interactives

**Actuellement :** la notification s'affiche, c'est tout.

**À ajouter :**

| Action | Effet |
|--------|-------|
| "Démarrer" dans la notif | Ouvre l'app en mode Focus directement |
| "Terminée" dans la notif | Marque la routine comme complétée sans ouvrir l'app |
| "Plus tard (+30 min)" | Reprogramme la notification |

**Implémentation**
`tauri-plugin-notification` supporte les actions. Définir des `actions` dans l'objet notification, écouter les événements côté Rust et envoyer les résultats au frontend via `emit`.

---

## v1.0 — Scalabilité

---

### 💾 11. Migrer de localStorage vers SQLite

**Pourquoi**
`localStorage` est limité (~5MB), synchrone, et non adapté à une croissance des données (historique long, analytics, etc.).

**Avec Tauri : `tauri-plugin-sql`**
```toml
# Cargo.toml
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
```

**Migration**
1. Au premier lancement avec la nouvelle version : lire `localStorage`, écrire en SQLite, vider `localStorage`
2. Schéma : tables `routines`, `routine_items`, `completion_log`, `settings`
3. Garder les stores Pinia comme couche d'abstraction — seul le layer persistance change

---

### 🎭 12. Modes de vie (Profiles)

**Concept**
L'utilisateur peut avoir plusieurs profils de routines selon son contexte.

| Mode | Routines actives |
|------|----------------|
| Semaine de travail | Morning, Deep Work, Evening |
| Week-end | Sport, Skincare, Lecture |
| Voyage | Version courte de tout |

**Implémentation**
Ajouter `profileId?: string` à `IRoutine`. Un store `profiles.store.ts` gère le profil actif. Le filtre `routinesForToday()` prend le profil en compte.

---

### 🌟 13. Routine identity (gamification légère)

**Concept**
L'utilisateur développe une identité à travers ses habitudes — sans points ni badges forcés.

**UX**
- Après 21 jours de streak sur une routine → un label discret apparaît : `"Athlete"`, `"Morning person"`, `"Focused"`
- Visible dans la sidebar sous le nom de l'utilisateur
- Pas de système de points — juste une reconnaissance textuelle

---

### 🔄 14. Sync (optionnel)

**iCloud via Tauri**
Écrire le fichier SQLite dans `~/Library/Mobile Documents/com~apple~CloudDocs/Routify/`. iCloud le synchronise automatiquement entre Macs.

**Export / Import**
Plus simple et immédiatement utile :
- Exporter toutes les routines en JSON
- Importer depuis un fichier JSON
- Permet le partage de routines entre utilisateurs

---

## Récapitulatif des priorités

| # | Feature | Impact | Effort | Version |
|---|---------|--------|--------|---------|
| 1 | Mode Start Routine | 🔥🔥🔥 | Moyen | v0.2 |
| 2 | Timer par étape | 🔥🔥🔥 | Faible | v0.2 |
| 3 | Micro-interactions | 🔥🔥 | Faible | v0.2 |
| 4 | Deep Focus mode | 🔥🔥 | Faible | v0.2 |
| 5 | Insights comportementaux | 🔥🔥🔥 | Moyen | v0.3 |
| 6 | AI — améliorer routine | 🔥🔥 | Moyen | v0.3 |
| 7 | Smart rescheduling | 🔥🔥 | Faible | v0.3 |
| 8 | Auto-flow | 🔥 | Faible | v0.3 |
| 9 | Menu bar app | 🔥🔥🔥 | Élevé | v0.4 |
| 10 | Notifications interactives | 🔥🔥 | Moyen | v0.4 |
| 11 | SQLite migration | 🔥 (tech) | Élevé | v1.0 |
| 12 | Modes de vie | 🔥🔥 | Moyen | v1.0 |
| 13 | Routine identity | 🔥 | Faible | v1.0 |
| 14 | Sync iCloud / export | 🔥🔥 | Élevé | v1.0 |
