import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type EventRow = { id: string; day: string; time: string; title: string; source: string };

export function useEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('id,day,time,title,source').order('day').order('time');
    setEvents((data as EventRow[]) || []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const add = async (day: string, time: string, title: string) => {
    await supabase.from('events').insert({ day, time, title });
    await load();
  };
  const remove = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    await load();
  };
  return { events, add, remove };
}
