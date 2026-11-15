import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';
import GlassCard from './GlassCard';

type Mission = { id: string; title: string; done: boolean };

export default function MissionList() {
  const { t } = useI18n();
  const [items, setItems] = useState<Mission[]>([]);
  const [text, setText] = useState('');

  const load = async () => {
    const { data } = await supabase.from('missions').select('id,title,done').order('created_at');
    setItems((data as Mission[]) || []);
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    const v = text.trim(); if (!v) return;
    setText(''); await supabase.from('missions').insert({ title: v }); await load();
  };
  const toggle = async (m: Mission) => { await supabase.from('missions').update({ done: !m.done }).eq('id', m.id); await load(); };
  const del = async (m: Mission) => { await supabase.from('missions').delete().eq('id', m.id); await load(); };

  return (
    <GlassCard id="missions" title={t('missions')}>
      <div className="bar">
        <input type="text" value={text} placeholder={t('addMission')} aria-label={t('addMission')}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && void add()} />
        <button className="go" onClick={() => void add()}>{t('add')}</button>
      </div>
      {items.length === 0 ? <p className="empty">{t('noMissions')}</p> : (
        <ul>
          {items.map(m => (
            <li key={m.id} className={m.done ? 'd' : ''}>
              <input type="checkbox" checked={m.done} aria-label={m.title} onChange={() => void toggle(m)} />
              <span>{m.title}</span>
              <button className="x" aria-label={`${t('remove')} ${m.title}`} onClick={() => void del(m)}>{t('remove')}</button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
