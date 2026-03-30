import { ref } from 'vue';
import type { TTimeBlock, TDayOfWeek, IRoutineItem } from '@/stores/routines.store';

export interface IAiRoutineSuggestion {
  name: string;
  icon: string;
  color: string;
  timeBlock: TTimeBlock;
  days: TDayOfWeek[];
  items: { label: string; durationMin?: number }[];
}

interface IGeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

async function callGemini(
  apiKey: string,
  context: {
    goals: string[];
    scheduleType: string | null;
    interests: string;
    existingNames: string[];
  },
): Promise<IAiRoutineSuggestion[]> {
  const goalsList = context.goals.length ? context.goals.join(', ') : 'general wellness';
  const schedule = context.scheduleType ?? 'balanced';
  const avoidNote = context.existingNames.length
    ? `\nAvoid duplicating these existing routines: ${context.existingNames.join(', ')}.`
    : '';

  const prompt = `You are a wellness and productivity coach creating personalized daily routines.

User profile:
- Goals: ${goalsList}
- Schedule type: ${schedule}
- Additional interests: ${context.interests.trim() || 'none provided'}${avoidNote}

Generate exactly 3 personalized, actionable routine suggestions tailored to this profile.
Use icons from this set only: ☀ ◈ ✦ ◉ ◑ ○ ▣ ▷ ◆ ▲ ◇
Use hex colors. Choose 3 visually distinct colors.
Each routine must have 3 to 5 specific, practical items with realistic durations.

Respond ONLY with a valid JSON array — no markdown, no explanation, no code fences:
[
  {
    "name": "string",
    "icon": "single symbol from the allowed set",
    "color": "#hex",
    "timeBlock": "morning|afternoon|evening|anytime",
    "days": [],
    "items": [
      { "label": "string", "durationMin": number }
    ]
  }
]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, responseMimeType: 'application/json' },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }

  const data = (await res.json()) as IGeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  return JSON.parse(text) as IAiRoutineSuggestion[];
}

export interface IAiImprovedItem {
  label: string;
  durationMin?: number;
}

export interface IAiAnalysis {
  analysis: string;
  suggestion: string;
}

async function callGeminiImprove(
  apiKey: string,
  routine: { name: string; items: Pick<IRoutineItem, 'label' | 'durationMin'>[] },
): Promise<IAiImprovedItem[]> {
  const prompt = `Here is a daily routine named "${routine.name}":
${JSON.stringify(routine.items.map((i) => ({ label: i.label, durationMin: i.durationMin ?? null })))}

Suggest improvements: reorder steps for better flow, adjust durations to be more realistic, remove redundancy. You may add 1-2 missing steps if clearly beneficial.
Return ONLY a valid JSON array — no markdown, no explanation:
[{ "label": "string", "durationMin": number_or_null }]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as IGeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  return JSON.parse(text) as IAiImprovedItem[];
}

async function callGeminiAnalyze(
  apiKey: string,
  routine: {
    name: string;
    itemCount: number;
    totalMin: number;
    completedCount: number;
    totalDays: number;
    streak: number;
  },
): Promise<IAiAnalysis> {
  const prompt = `A user has a daily routine called "${routine.name}" with ${routine.itemCount} steps totalling ${routine.totalMin} minutes.
They have completed it ${routine.completedCount} time(s) in the last ${routine.totalDays} days. Current streak: ${routine.streak} day(s).

In 2–3 concise sentences, explain why they might struggle to maintain this routine based on these stats. Then give exactly 1 short, concrete, actionable suggestion to improve consistency.

Respond ONLY with valid JSON — no markdown, no explanation:
{ "analysis": "2-3 sentences", "suggestion": "one concrete action" }`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as IGeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text) as IAiAnalysis;
}

export function useAiImprove() {
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const improvedItems = ref<IAiImprovedItem[]>([]);
  const errorMessage = ref('');

  async function improve(
    apiKey: string,
    routine: { name: string; items: Pick<IRoutineItem, 'label' | 'durationMin'>[] },
  ) {
    status.value = 'loading';
    errorMessage.value = '';
    try {
      improvedItems.value = await callGeminiImprove(apiKey, routine);
      status.value = 'success';
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Unknown error';
      status.value = 'error';
    }
  }

  function reset() {
    status.value = 'idle';
    improvedItems.value = [];
    errorMessage.value = '';
  }

  return { status, improvedItems, errorMessage, improve, reset };
}

export function useAiAnalyze() {
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const result = ref<IAiAnalysis | null>(null);
  const errorMessage = ref('');

  async function analyze(
    apiKey: string,
    routine: {
      name: string;
      itemCount: number;
      totalMin: number;
      completedCount: number;
      totalDays: number;
      streak: number;
    },
  ) {
    status.value = 'loading';
    errorMessage.value = '';
    try {
      result.value = await callGeminiAnalyze(apiKey, routine);
      status.value = 'success';
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Unknown error';
      status.value = 'error';
    }
  }

  function reset() {
    status.value = 'idle';
    result.value = null;
    errorMessage.value = '';
  }

  return { status, result, errorMessage, analyze, reset };
}

export function useAiSuggestions() {
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const suggestions = ref<IAiRoutineSuggestion[]>([]);
  const errorMessage = ref<string>('');

  async function generate(
    apiKey: string,
    context: {
      goals: string[];
      scheduleType: string | null;
      interests: string;
      existingNames: string[];
    },
  ) {
    status.value = 'loading';
    errorMessage.value = '';
    try {
      suggestions.value = await callGemini(apiKey, context);
      status.value = 'success';
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Unknown error';
      status.value = 'error';
    }
  }

  function reset() {
    status.value = 'idle';
    suggestions.value = [];
    errorMessage.value = '';
  }

  return { status, suggestions, errorMessage, generate, reset };
}
