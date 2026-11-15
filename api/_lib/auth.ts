import { createClient } from '@supabase/supabase-js';
import type { Request, Response } from './http';

export async function requireUser(req: Request, res: Response) {
  const token = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '')?.[1];
  if (!token) { res.status(401).json({ error: 'Sign in required' }); return null; }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  try {
    if (!url || !key) throw new Error('Supabase environment is incomplete');
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) { res.status(401).json({ error: 'Invalid session' }); return null; }
    return { user: data.user, db };
  } catch {
    res.status(503).json({ error: 'Authentication unavailable' });
    return null;
  }
}
