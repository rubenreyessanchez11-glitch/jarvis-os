import { useMemo, useState } from 'react';
import { iso } from '../lib/date';
import { useI18n } from '../lib/i18n';
import type { EventRow } from '../lib/useEvents';
import GlassCard from './GlassCard';

type Props = { events: EventRow[]; add: (day: string, time: string, title: string) => Promise<void>; remove: (id: string) => Promise<void> };

export default function CalendarCard({ events, add, remove }: Props) {
  const { t, locale } = useI18n();
  const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [sel, setSel] = useState(iso(new Date()));
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday first
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [view]);

  const dow = days.slice(0, 7).map(d => d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2));
  const withEvents = new Set(events.map(e => e.day));
  const today = iso(new Date());
  const list = events.filter(e => e.day === sel);
  const selDate = new Date(`${sel}T12:00:00`);

  const submit = async () => {
    const v = title.trim(); if (!v) return;
    setTitle(''); setTime(''); await add(sel, time, v);
  };
  const go = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <GlassCard id="calendar" title={t('calendar')} wide>
      <div className="chead">
        <strong>{view.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong>
        <div className="row2">
          <button aria-label={t('prev')} onClick={() => go(-1)}>‹</button>
          <button onClick={() => { const n = new Date(); setSel(iso(n)); setView(new Date(n.getFullYear(), n.getMonth(), 1)); }}>{t('today')}</button>
          <button aria-label={t('next')} onClick={() => go(1)}>›</button>
        </div>
      </div>
      <div className="cal">
        <div>
          <div className="dow" aria-hidden="true">{dow.map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="days">
            {days.map(d => {
              const k = iso(d);
              const cls = ['day', d.getMonth() !== view.getMonth() ? 'out' : '', k === today ? 'today' : '', k === sel ? 'sel' : ''].join(' ');
              return (
                <button key={k} className={cls} aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  onClick={() => { setSel(k); if (d.getMonth() !== view.getMonth()) setView(new Date(d.getFullYear(), d.getMonth(), 1)); }}>
                  {d.getDate()}{withEvents.has(k) && <i />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3>{selDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <div className="bar">
            <input type="text" value={title} placeholder={t('addEvent')} aria-label={t('addEvent')}
              onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && void submit()} />
            <input type="time" value={time} aria-label={t('time')} onChange={e => setTime(e.target.value)} />
            <button className="go" onClick={() => void submit()}>{t('add')}</button>
          </div>
          {list.length === 0 ? <p className="empty">{t('nothing')}</p> : (
            <ul>
              {list.map(e => (
                <li key={e.id}>
                  <span>{e.time ? `${e.time}  ` : ''}{e.title}</span>
                  <button className="x" aria-label={`${t('remove')} ${e.title}`} onClick={() => void remove(e.id)}>{t('remove')}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
