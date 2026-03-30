import { ref } from 'vue';
import type { TTimeBlock, TDayOfWeek } from '@/stores/routines.store';

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
