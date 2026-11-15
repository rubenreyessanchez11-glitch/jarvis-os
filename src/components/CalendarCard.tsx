import { useEffect, useMemo, useState } from 'react';
import { iso } from '../lib/date';
import { useI18n } from '../lib/i18n';
import type { EventRow } from '../lib/useEvents';
import { useGoogleCalendar } from '../lib/useGoogleCalendar';
import { deleteGoogleEvent, eventStart, occursOn, saveGoogleEvent, type GoogleEvent } from '../lib/googleCalendar';
import GlassCard from './GlassCard';

type Props = { events: EventRow[]; add: (day: string, time: string, title: string) => Promise<void>; remove: (id: string) => Promise<void> };

export default function CalendarCard({ events, add, remove }: Props) {
  const { t, locale } = useI18n();
  const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [sel, setSel] = useState(iso(new Date()));
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [targetGoogle, setTargetGoogle] = useState(false);
  const [editing, setEditing] = useState<{ event: GoogleEvent; day: string; time: string; title: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday first
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [view]);
  const end = new Date(days[41]);
  end.setDate(end.getDate() + 1);
  const google = useGoogleCalendar(iso(days[0]), iso(end));
  useEffect(() => {
    if (!google.token) { setTargetGoogle(false); setEditing(undefined); }
  }, [google.token]);

  const dow = days.slice(0, 7).map(d => d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2));
  const withEvents = new Set(events.map(e => e.day));
  const today = iso(new Date());
  const list = events.filter(e => e.day === sel);
  const googleList = google.events.filter(event => occursOn(event, sel));
  const selDate = new Date(`${sel}T12:00:00`);

  const writeGoogle = async (write: (token: string) => Promise<void>) => {
    if (!google.token || busy) return false;
    setBusy(true);
    setError('');
    try {
      await write(google.token);
      google.refresh();
      return true;
    } catch {
      setError('googleWriteError');
      google.refresh();
      return false;
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    const v = title.trim(); if (!v) return;
    if (targetGoogle && google.token) {
      if (!await writeGoogle(token => saveGoogleEvent(token, sel, time, v))) return;
    } else {
      await add(sel, time, v);
    }
    setTitle(''); setTime('');
  };
  const go = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <GlassCard id="calendar" title={t('calendar')} wide>
      {google.enabled && <div className="bar">
        {google.token ? <>
          <button type="button" onClick={google.refresh} disabled={busy}>{t('googleRefresh')}</button>
          <button type="button" onClick={() => {
            google.disconnect(); setEditing(undefined); setTargetGoogle(false); setError('');
          }} disabled={busy}>{t('googleDisconnect')}</button>
        </> : <button type="button" onClick={google.connect} disabled={!google.ready}>{t('googleConnect')}</button>}
      </div>}
      {(error || google.error) && <p role="alert" className="empty">{t(error || google.error)}</p>}
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
                  {d.getDate()}{(withEvents.has(k) || google.events.some(event => occursOn(event, k))) && <i />}
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
            <button className="go" disabled={busy} onClick={() => void submit()}>{t('add')}</button>
          </div>
          {google.token && <label>
            <input type="checkbox" checked={targetGoogle} onChange={e => setTargetGoogle(e.target.checked)} />
            {' '}{t('googleCreate')}
          </label>}
          {list.length === 0 && googleList.length === 0 ? <p className="empty">{t('nothing')}</p> : (
            <ul>
              {list.map(e => (
                <li key={e.id}>
                  <span>{e.time ? `${e.time}  ` : ''}{e.title}</span>
                  <button className="x" aria-label={`${t('remove')} ${e.title}`} onClick={() => void remove(e.id)}>{t('remove')}</button>
                </li>
              ))}
              {googleList.map(event => {
                const start = eventStart(event);
                const name = event.summary || t('googleUntitled');
                const mayEdit = event.organizer?.self && !event.locked && event.eventType === 'default';
                return <li key={event.id}>
                  <span>{start.day === sel && start.time ? `${start.time}  ` : ''}{name} · Google Calendar</span>
                  {mayEdit && <div className="row2">
                    <button type="button" disabled={busy} onClick={() => setEditing({ event, ...start, title: name })}>{t('edit')}</button>
                    <button type="button" disabled={busy} onClick={() => {
                      if (window.confirm(t('googleConfirmDelete'))) {
                        void writeGoogle(token => deleteGoogleEvent(token, event)).then(saved => {
                          if (saved && editing?.event.id === event.id) setEditing(undefined);
                        });
                      }
                    }}>{t('remove')}</button>
                  </div>}
                </li>;
              })}
            </ul>
          )}
          {editing && google.token && <form className="bar" onSubmit={async e => {
            e.preventDefault();
            const name = editing.title.trim();
            if (name && await writeGoogle(token => saveGoogleEvent(token, editing.day, editing.time, name, editing.event))) {
              setEditing(undefined);
            }
          }}>
            <input required aria-label={t('eventTitle')} value={editing.title}
              onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <input required type="date" aria-label={t('eventDate')} value={editing.day}
              onChange={e => setEditing({ ...editing, day: e.target.value })} />
            <input type="time" aria-label={t('time')} value={editing.time}
              onChange={e => setEditing({ ...editing, time: e.target.value })} />
            <button type="submit" disabled={busy}>{t('save')}</button>
            <button type="button" onClick={() => setEditing(undefined)}>{t('cancel')}</button>
          </form>}
        </div>
      </div>
    </GlassCard>
  );
}
