import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './lib/supabase';
import { LangCtx, useI18n, type Lang } from './lib/i18n';
import { useEvents } from './lib/useEvents';
import { getConfiguredProviders } from './lib/api';
import ReactorCore from './components/ReactorCore';
import StatusPill from './components/StatusPill';
import GlassCard from './components/GlassCard';
import ChatPanel from './components/ChatPanel';
import MissionList from './components/MissionList';
import CalendarCard from './components/CalendarCard';
import LanguageLab from './components/LanguageLab';
import FocusCard from './components/FocusCard';
import DeviceBatteryCard from './components/DeviceBatteryCard';
import Dock from './components/Dock';

function LangBar({ signOut }: { signOut?: boolean }) {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="langbar">
      <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as Lang)}>
        <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
      </select>
      {signOut && <button onClick={() => void supabase.auth.signOut()}>{t('signout')}</button>}
    </div>
  );
}

function SignIn() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErr('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
      });
      if (error?.code === 'over_email_send_rate_limit') setErr(t('emailRateLimit'));
      else if (error) setErr(error.message);
      else setSent(true);
    } catch {
      setErr(t('errGeneric'));
    } finally {
      setSending(false);
    }
  };
  return (
    <main>
      <LangBar />
      <section className="hero"><ReactorCore /><div><h1 className="big small">JARVIS OS</h1></div></section>
      <GlassCard title="JARVIS OS">
        {!configured ? <p className="empty">{t('setup')}</p> : sent ? <p role="status">{t('check')}</p> : (
          <form className="bar" onSubmit={e => void submit(e)}>
            <input type="email" required value={email} placeholder={t('email')} aria-label={t('email')} onChange={e => setEmail(e.target.value)} />
            <button className="go" type="submit" disabled={sending}>{t('magic')}</button>
          </form>
        )}
        {err && <p role="alert" className="empty">{err}</p>}
      </GlassCard>
    </main>
  );
}

function Shell({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(new Date());
  const { events, add, remove } = useEvents();
  const [providers, setProviders] = useState<string[]>();
  useEffect(() => {
    let active = true;
    void getConfiguredProviders().then(configured => {
      if (active) setProviders(configured);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);
  const h = now.getHours();
  return (
    <>
      <main>
        <LangBar signOut />
        <section className="hero" id="home">
          <ReactorCore />
          <div>
            <div className="big">{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div>
            <p className="hello">{t(h < 12 ? 'morning' : h < 19 ? 'afternoon' : 'evening')}</p>
            <p className="date">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="pills">
              {providers && <StatusPill label={t(`models${providers.length}`)} />}
            </div>
          </div>
        </section>
        <div className="grid">
          <ChatPanel events={events} userId={userId} />
          <MissionList />
          <CalendarCard events={events} add={add} remove={remove} />
          <LanguageLab />
          <FocusCard />
          <DeviceBatteryCard userId={userId} />
        </div>
      </main>
      <Dock />
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const s = localStorage.getItem('jarvis-lang');
    if (s === 'en' || s === 'es' || s === 'fr') return s;
    const n = navigator.language.slice(0, 2);
    return n === 'es' || n === 'fr' ? n : 'en';
  });
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { localStorage.setItem('jarvis-lang', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    if (!configured) { setReady(true); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      {!ready ? null : session ? <Shell key={session.user.id} userId={session.user.id} /> : <SignIn />}
    </LangCtx.Provider>
  );
}
