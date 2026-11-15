import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from './_lib/http';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return res.status(415).json({ error: 'JSON required' });
  }
  const body = req.body as { token?: unknown; level?: unknown } | undefined;
  const token = body?.token;
  const level = typeof body?.level === 'string' && /^\d{1,3}$/.test(body.level)
    ? Number(body.level) : body?.level;
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token) ||
      typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 100) {
    return res.status(400).json({ error: 'Invalid battery report' });
  }

  try {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return res.status(503).json({ error: 'Battery reporting unavailable' });
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc('report_device_battery', { p_token: token, p_level: level });
    if (error) return res.status(503).json({ error: 'Battery reporting unavailable' });
    if (!data) return res.status(401).json({ error: 'Invalid device token' });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: 'Battery reporting unavailable' });
  }
}
