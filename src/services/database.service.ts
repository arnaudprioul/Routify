/**
 * Database service — wraps @tauri-apps/plugin-sql (SQLite).
 * Falls back gracefully to no-op in browser/dev mode.
 */
import type { IRoutine, IRoutineItem } from '@/stores/routines.store';

export const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Lazy singleton — only created once inside Tauri
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

async function getDb() {
  if (!isTauri) return null;
  if (_db) return _db;
  const Database = (await import('@tauri-apps/plugin-sql')).default;
  _db = await Database.load('sqlite:routify.db');
  return _db;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const DDL = [
  `CREATE TABLE IF NOT EXISTS routines (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    icon          TEXT NOT NULL,
    color         TEXT NOT NULL,
    time_block    TEXT NOT NULL,
    days          TEXT NOT NULL DEFAULT '[]',
    reminder_time TEXT,
    streak        INTEGER NOT NULL DEFAULT 0,
    completed_dates TEXT NOT NULL DEFAULT '[]',
    created_at    TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS routine_items (
    id           TEXT PRIMARY KEY,
    routine_id   TEXT NOT NULL,
    label        TEXT NOT NULL,
    duration_min INTEGER,
    completed    INTEGER NOT NULL DEFAULT 0,
    sort_order   INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------
interface IRoutineRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  time_block: string;
  days: string;
  reminder_time: string | null;
  streak: number;
  completed_dates: string;
  created_at: string;
}

interface IItemRow {
  id: string;
  routine_id: string;
  label: string;
  duration_min: number | null;
  completed: number;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Create tables if they don't exist. Returns false in browser mode. */
export async function initDatabase(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  for (const sql of DDL) {
    await db.execute(sql);
  }
  return true;
}

/** Load all routines with their items. Returns null in browser mode or when DB is empty. */
export async function loadRoutines(): Promise<IRoutine[] | null> {
  const db = await getDb();
  if (!db) return null;

  const routineRows = (await db.select(
    'SELECT * FROM routines ORDER BY created_at ASC',
  )) as IRoutineRow[];
  if (!routineRows.length) return null;

  const itemRows = (await db.select(
    'SELECT * FROM routine_items ORDER BY sort_order ASC',
  )) as IItemRow[];

  const itemsByRoutine = new Map<string, IRoutineItem[]>();
  for (const row of itemRows) {
    const list = itemsByRoutine.get(row.routine_id) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      durationMin: row.duration_min ?? undefined,
      completed: row.completed === 1,
    });
    itemsByRoutine.set(row.routine_id, list);
  }

  return (routineRows as IRoutineRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    timeBlock: row.time_block as IRoutine['timeBlock'],
    days: JSON.parse(row.days) as IRoutine['days'],
    reminderTime: row.reminder_time ?? undefined,
    streak: row.streak,
    completedDates: JSON.parse(row.completed_dates) as string[],
    createdAt: row.created_at,
    items: itemsByRoutine.get(row.id) ?? [],
  }));
}

/** Upsert a single routine and replace all its items. */
export async function saveRoutine(routine: IRoutine): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.execute(
    `INSERT OR REPLACE INTO routines
       (id, name, icon, color, time_block, days, reminder_time, streak, completed_dates, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      routine.id,
      routine.name,
      routine.icon,
      routine.color,
      routine.timeBlock,
      JSON.stringify(routine.days),
      routine.reminderTime ?? null,
      routine.streak,
      JSON.stringify(routine.completedDates),
      routine.createdAt,
    ],
  );

  await db.execute('DELETE FROM routine_items WHERE routine_id = ?', [routine.id]);
  for (let i = 0; i < routine.items.length; i++) {
    const item = routine.items[i];
    await db.execute(
      `INSERT INTO routine_items (id, routine_id, label, duration_min, completed, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.id, routine.id, item.label, item.durationMin ?? null, item.completed ? 1 : 0, i],
    );
  }
}

/** Upsert all routines (used for initial migration). */
export async function saveAllRoutines(routines: IRoutine[]): Promise<void> {
  for (const r of routines) {
    await saveRoutine(r);
  }
}

/** Delete a routine and all its items from the database. */
export async function deleteRoutineFromDb(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute('DELETE FROM routine_items WHERE routine_id = ?', [id]);
  await db.execute('DELETE FROM routines WHERE id = ?', [id]);
}

/** Read a settings value. */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = (await db.select(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  )) as [{ value: string }];
  return rows[0]?.value ?? null;
}

/** Write a settings value. */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}
