import { useEffect, useRef, useState } from 'react';
import { chat, type Result } from '../lib/api';
import { iso } from '../lib/date';
import { useI18n } from '../lib/i18n';
import type { EventRow } from '../lib/useEvents';
import CompareView from './CompareView';
import GlassCard from './GlassCard';
import WhatsAppDraft, { parseWhatsAppRequest, type Draft } from './WhatsAppDraft';

type Msg = { role: 'user' | 'assistant'; content: string; by?: string };
const MODES = ['coder', 'tutor', 'planner'] as const;
const NAMES: Record<string, string> = { claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini' };

function agendaText(events: EventRow[]) {
  const a = iso(new Date());
  const e = new Date(); e.setDate(e.getDate() + 14);
  const b = iso(e);
  const list = events.filter(x => x.day >= a && x.day <= b);
  return `Today is ${new Date().toDateString()}.\n` + (list.length ? list.map(x => `- ${x.day}${x.time ? ' ' + x.time : ''}: ${x.title}`).join('\n') : '(no events)');
}

export default function ChatPanel({ events }: { events: EventRow[] }) {
  const { t, lang, locale } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [provider, setProvider] = useState('auto');
  const [mode, setMode] = useState<(typeof MODES)[number]>('coder');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [cmp, setCmp] = useState<Result[] | null>(null);
  const [err, setErr] = useState('');
  const [conv, setConv] = useState<string | undefined>();
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState<Draft>();
  const log = useRef<HTMLDivElement>(null);

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [msgs, cmp, busy]);

  const send = async (raw?: string) => {
    const q = (raw ?? text).trim();
    if (!q || busy) return;
    const whatsapp = parseWhatsAppRequest(q);
    if (whatsapp) {
      setDraft(whatsapp);
      setText('');
      return;
    }
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setText(''); setBusy(true); setErr(''); setCmp(null);
    try {
      const j = await chat({
        provider, mode, lang, conversationId: conv, agenda: agendaText(events),
        messages: next.map(m => ({ role: m.role, content: m.content })),
      });
      setConv(j.conversationId);
      if (provider === 'compare') setCmp(j.results);
      else {
        const r = j.results[0];
        if (r?.text) setMsgs([...next, { role: 'assistant', content: r.text, by: r.provider }]);
        else setErr(t('errGeneric'));
      }
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : t('errGeneric')); }
    setBusy(false);
  };

  const mic = () => {
    if (!SR) return;
    const rec = new SR(); rec.lang = locale; rec.interimResults = false;
    rec.onresult = (ev: any) => setText(ev.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true); rec.start();
  };

  return (
    <GlassCard id="chat" title={t('ask')}>
      <div className="modes" role="group" aria-label="Mode">
        {MODES.map(m => <button key={m} className={m === mode ? 'on' : ''} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</button>)}
        <select aria-label="Model" value={provider} onChange={e => setProvider(e.target.value)}>
          <option value="auto">{t('auto')}</option><option value="claude">Claude</option>
          <option value="openai">OpenAI</option><option value="gemini">Gemini</option>
          <option value="compare">{t('compare')}</option>
        </select>
      </div>
      <div className="chips">{['c1', 'c2', 'c3', 'c4', 'c5'].map(k => <button key={k} onClick={() => void send(t(k))}>{t(k)}</button>)}</div>
      <div id="log" ref={log} role="log" aria-live="polite">
        <div className="m note">{t('yes')}</div>
        {msgs.map((m, i) => (
          <div key={i} className={`m ${m.role === 'user' ? 'u' : 'a'}`}>
            {m.by && <small className="mute">{NAMES[m.by] ?? m.by}</small>}
            {m.content}
          </div>
        ))}
        {cmp && <CompareView results={cmp} onUse={r => { setMsgs(p => [...p, { role: 'assistant', content: r.text ?? '', by: r.provider }]); setCmp(null); }} />}
        {busy && <div className="m a">…</div>}
        {err && <div className="m note" role="alert">{err}</div>}
      </div>
      {draft && <WhatsAppDraft key={draft.recipient + '\n' + draft.message} draft={draft} close={() => setDraft(undefined)} />}
      <div className="bar">
        <input type="text" value={text} placeholder={t('placeholder')} aria-label={t('placeholder')}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && void send()} />
        {SR && <button aria-label={t('mic')} onClick={mic} disabled={listening}>{listening ? t('stop') : t('mic')}</button>}
        <button type="button" onClick={() => setDraft(parseWhatsAppRequest(text.trim()) ?? { recipient: '', message: text })}>WhatsApp</button>
        <button className="go" disabled={busy} onClick={() => void send()}>{t('send')}</button>
      </div>
    </GlassCard>
  );
}
