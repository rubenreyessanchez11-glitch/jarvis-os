import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import GlassCard from './GlassCard';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const MODES: [number, string][] = [[25, '25 min'], [50, '50 min'], [5, 'break']];

export default function FocusCard() {
  const { t } = useI18n();
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [run, setRun] = useState(false);
  const [finished, setFinished] = useState(false);
  const end = useRef(0);

  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((end.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) { setRun(false); setFinished(true); }
    }, 250);
    return () => clearInterval(id);
  }, [run]);

  useEffect(() => { document.title = run ? `${fmt(left)} · JARVIS OS` : 'JARVIS OS'; }, [run, left]);

  const toggle = () => {
    if (run) { setRun(false); return; }
    const from = left > 0 ? left : mins * 60;
    setLeft(from); setFinished(false); end.current = Date.now() + from * 1000; setRun(true);
  };
  const pick = (m: number) => { setRun(false); setFinished(false); setMins(m); setLeft(m * 60); };

  return (
    <GlassCard id="focus" title={t('focus')}>
      <div className="big fc" role="timer">{fmt(left)}</div>
      <div className="chips">
        {MODES.map(([m, label]) => (
          <button key={m} className={m === mins ? 'on' : ''} onClick={() => pick(m)}>{label === 'break' ? t('break') : label}</button>
        ))}
      </div>
      <div className="bar">
        <button className="go" onClick={toggle}>{run ? t('pause') : t('start')}</button>
        <button onClick={() => pick(mins)}>{t('reset')}</button>
      </div>
      {finished && <p className="empty" role="status">{t('done')}</p>}
    </GlassCard>
  );
}
