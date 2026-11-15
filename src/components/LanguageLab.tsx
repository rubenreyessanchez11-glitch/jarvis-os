import { useState } from 'react';
import { chat } from '../lib/api';
import { useI18n } from '../lib/i18n';
import GlassCard from './GlassCard';

type Q = { q: string; o: string[]; a: number; w: string };
const valid = (x: unknown): x is Q[] =>
  Array.isArray(x) && x.length > 0 && x.every((i: any) => typeof i?.q === 'string' && Array.isArray(i?.o) && i.o.length >= 2 && typeof i?.a === 'number' && typeof i?.w === 'string');

export default function LanguageLab() {
  const { t } = useI18n();
  const [lang, setLang] = useState<'French' | 'English'>('French');
  const [qs, setQs] = useState<Q[]>([]);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async () => {
    setBusy(true); setMsg(t('preparing')); setQs([]); setPicked({});
    try {
      const j = await chat({
        provider: 'auto', mode: 'quiz', persist: false,
        messages: [{ role: 'user', content: `Create a 3-question multiple-choice quiz to practice ${lang} for a teenage learner at intermediate level (vocabulary, grammar, or a short sentence). Return ONLY a JSON array of exactly 3 objects with keys q (string), o (array of 4 strings), a (index 0-3 of the correct option), w (one-sentence explanation in English). Vary the topics each time. Seed: ${Date.now()}` }],
      });
      const parsed: unknown = JSON.parse((j.results[0]?.text || '').replace(/```json|```/g, '').trim());
      if (!valid(parsed)) throw new Error('bad shape');
      setQs(parsed); setMsg('');
    } catch { setMsg(t('quizFail')); }
    setBusy(false);
  };

  const score = qs.filter((q, i) => picked[i] === q.a).length;

  return (
    <GlassCard id="learn" title={t('lab')}>
      <div className="bar">
        <select aria-label={t('lab')} value={lang} onChange={e => setLang(e.target.value as 'French' | 'English')}>
          <option value="French">{t('french')}</option><option value="English">{t('english')}</option>
        </select>
        <button className="go" disabled={busy} onClick={() => void run()}>{t('newQuiz')}</button>
        {qs.length > 0 && <span className="mute">{t('score')}: {score} / {qs.length}</span>}
      </div>
      {msg ? <p className="empty">{msg}</p> : qs.length === 0 && <p className="empty">{t('labHint')}</p>}
      {qs.map((q, i) => (
        <div className="qb" key={i}>
          <b>{i + 1}. {q.q}</b>
          {q.o.map((o, j) => {
            const done = picked[i] !== undefined;
            const cls = 'opt' + (done && j === q.a ? ' ok' : '') + (done && picked[i] === j && j !== q.a ? ' no' : '');
            return <button key={j} className={cls} onClick={() => !done && setPicked({ ...picked, [i]: j })}>{o}</button>;
          })}
          {picked[i] !== undefined && <p className="why">{q.w}</p>}
        </div>
      ))}
    </GlassCard>
  );
}
