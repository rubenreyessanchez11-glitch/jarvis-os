export type Provider = 'claude' | 'openai' | 'gemini';
export type Msg = { role: 'user' | 'assistant'; content: string };

export const MODELS: Record<Provider, string> = {
  claude: process.env.CLAUDE_MODEL || '',
  openai: process.env.OPENAI_MODEL || '',
  gemini: process.env.GEMINI_MODEL || '',
};

const BASE = 'You are Jarvis, a calm, sharp personal assistant in the style of the Iron Man AI. Be concise and honest. If something is a bad idea or unsafe, say so briefly and offer a better route.';
const MODES: Record<string, string> = {
  coder: 'Mode: coding partner. Give small working snippets, explain why, and point out bugs or risks. Never put secret keys in code.',
  tutor: 'Mode: English and French tutor. Correct mistakes kindly, explain briefly, then ask one follow-up question.',
  planner: 'Mode: planner. Turn goals into short, concrete steps with times. Ask one question if something is unclear.',
};
const LANGS: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };

export function buildSystem(mode?: string, lang?: string, agenda?: string): string {
  if (mode === 'quiz') return 'You output only valid JSON. No prose and no markdown fences.';
  let s = BASE;
  if (mode && Object.prototype.hasOwnProperty.call(MODES, mode)) s += '\n\n' + MODES[mode];
  if (lang && Object.prototype.hasOwnProperty.call(LANGS, lang)) s += `\n\nThe app language is ${LANGS[lang]}. Reply in ${LANGS[lang]} unless the user writes in another language.`;
  if (agenda) s += `\n\nThe user's calendar for the next 14 days (only these events are known):\n${agenda.slice(0, 2000)}`;
  return s;
}

// Simple automatic routing. Edit the rules to taste.
export function route(text: string): Provider {
  if (/```|\b(code|bug|error|function|react|api|sql|regex)\b/i.test(text)) return 'claude';
  if (/\b(latest|news|today|image|photo|search)\b/i.test(text)) return 'gemini';
  if (/\b(summari[sz]e|translate|email|rewrite|essay)\b/i.test(text)) return 'openai';
  return 'claude';
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
    redirect: 'error',
  });
  if (!r.ok) throw new Error(`Provider returned ${r.status}`); // never echo keys or raw bodies
  return r.json();
}

export async function callProvider(p: Provider, msgs: Msg[], system: string): Promise<string> {
  const model = MODELS[p];
  if (!model) throw new Error(`${p} model not configured`);
  if (p === 'claude') {
    const key = process.env.ANTHROPIC_API_KEY; if (!key) throw new Error('claude key not configured');
    const j = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      { model, max_tokens: 1024, system, messages: msgs });
    return j.content?.[0]?.text ?? '';
  }
  if (p === 'openai') {
    const key = process.env.OPENAI_API_KEY; if (!key) throw new Error('openai key not configured');
    const j = await post('https://api.openai.com/v1/chat/completions', { Authorization: `Bearer ${key}` },
      { model, max_completion_tokens: 2048, store: false, messages: [{ role: 'system', content: system }, ...msgs] });
    return j.choices?.[0]?.message?.content ?? '';
  }
  const key = process.env.GEMINI_API_KEY; if (!key) throw new Error('gemini key not configured');
  const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key },
    { systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 2048 },
      contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) });
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
