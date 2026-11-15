import { supabase } from './supabase';

export type Result = { provider: string; model?: string; text?: string; error?: string };
export type ChatBody = {
  provider: string;
  messages: { role: string; content: string }[];
  conversationId?: string;
  mode?: string;
  lang?: string;
  agenda?: string;
  persist?: boolean;
};

// The browser only talks to our own /api route. Provider keys exist only on the server.
export async function chat(body: ChatBody): Promise<{ results: Result[]; conversationId?: string }> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}
