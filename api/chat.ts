import type { Request, Response } from './_lib/http';
import { randomUUID } from 'node:crypto';
import { requireUser } from './_lib/auth.js';
import { buildSystem, callProvider, providerConfigured, route, MODELS, type Msg, type Provider } from './_lib/providers.js';

const PROVIDERS: Provider[] = ['claude', 'openai', 'gemini'];
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function isMessage(value: unknown): value is Msg {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Partial<Msg>;
  return (message.role === 'assistant' || message.role === 'user') &&
    typeof message.content === 'string' && message.content.trim().length > 0;
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const session = await requireUser(req, res);
    if (session) return res.json({ providers: PROVIDERS.filter(providerConfigured) });
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return res.status(415).json({ error: 'JSON required' });
  }
  const session = await requireUser(req, res);
  if (!session) return;
  const { user, db } = session;

  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid body' });
  }
  const { provider = 'auto', messages, conversationId, persist = true, mode, lang, agenda, missions } =
    req.body as Record<string, unknown>;
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });
  const recent: unknown[] = messages.slice(-20);
  if (!recent.every(isMessage)) return res.status(400).json({ error: 'Invalid message' });
  const clean = recent.map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (clean[clean.length - 1].role !== 'user') return res.status(400).json({ error: 'last message must be from the user' });
  if (typeof persist !== 'boolean' || (conversationId !== undefined &&
    (typeof conversationId !== 'string' || !UUID.test(conversationId)))) {
    return res.status(400).json({ error: 'Invalid history options' });
  }

  const available = PROVIDERS.filter(providerConfigured);
  const preferred = mode === 'quiz' ? 'claude' : route(clean[clean.length - 1].content);
  const selection = available.includes('gemini') ? 'gemini' : available.includes(preferred) ? preferred : available[0];
  const targets: Provider[] =
    provider === 'compare' ? PROVIDERS :
    provider === 'auto' && selection ? [selection] :
    PROVIDERS.filter(candidate => candidate === provider);
  if (!targets.length && provider !== 'auto') return res.status(400).json({ error: 'unknown provider' });
  const activeTargets = targets.filter(providerConfigured);
  if (!activeTargets.length) return res.status(503).json({ error: 'Provider unavailable' });

  if (conversationId) {
    const { data, error } = await db.from('conversations').select('id')
      .eq('id', conversationId).eq('user_id', user.id).maybeSingle();
    if (error) return res.status(503).json({ error: 'History unavailable' });
    if (!data) return res.status(404).json({ error: 'Conversation unavailable' });
  }

  const { data: allowed, error: quotaError } = await db.rpc('reserve_chat_calls', { calls: activeTargets.length });
  if (quotaError) return res.status(503).json({ error: 'Chat unavailable' });
  if (!allowed) return res.status(429).json({ error: 'Chat limit reached' });

  const system = buildSystem(typeof mode === 'string' ? mode : undefined,
    typeof lang === 'string' ? lang : undefined, typeof agenda === 'string' ? agenda : undefined,
    typeof missions === 'string' ? missions : undefined);
  const settled = await Promise.allSettled(activeTargets.map(p => callProvider(p, clean, system)));
  const results = targets.map(p => {
    const result = settled[activeTargets.indexOf(p)];
    return result?.status === 'fulfilled' && result.value
      ? { provider: p, model: MODELS[p], text: result.value }
      : { provider: p, model: MODELS[p], error: 'Model request failed' };
  });

  let convId = conversationId;
  if (persist) {
    try {
      if (!convId) {
        const { data, error } = await db.from('conversations')
          .insert({ user_id: user.id, title: clean[0].content.slice(0, 60) }).select('id').single();
        if (error) throw error;
        convId = data?.id;
      }
      if (convId) {
        const group = targets.length > 1 ? randomUUID() : null;
        const { error } = await db.from('messages').insert([
          { user_id: user.id, conversation_id: convId, role: 'user', content: clean[clean.length - 1].content },
          ...results.filter(r => r.text).map(r => ({
            user_id: user.id, conversation_id: convId, role: 'assistant', content: r.text!,
            provider: r.provider, model: r.model, compare_group: group,
          })),
        ]);
        if (error) {
          if (!conversationId) await db.from('conversations').delete().eq('id', convId);
          throw error;
        }
      }
    } catch { convId = conversationId; }
  }
  return res.json({ results, conversationId: convId });
}
