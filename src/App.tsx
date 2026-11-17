import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './lib/supabase';
import { LangCtx, useI18n, type Lang } from './lib/i18n';
import { useEvents } from './lib/useEvents';
import { getConfiguredProviders } from './lib/api';
import { iso } from './lib/date';
import ReactorCore from './components/ReactorCore';
import StatusPill from './components/StatusPill';
import GlassCard from './components/GlassCard';
import ChatPanel from './components/ChatPanel';
import MissionList, { type Mission } from './components/MissionList';
import CalendarCard from './components/CalendarCard';
import LanguageLab from './components/LanguageLab';
import FocusCard from './components/FocusCard';
import DeviceBatteryCard from './components/DeviceBatteryCard';
import PasswordForm from './components/PasswordForm';
import Dock from './components/Dock';

function LangBar({ signOut, managePassword }: { signOut?: boolean; managePassword?: () => void }) {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="langbar">
      <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as Lang)}>
        <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
      </select>
      {managePassword && <button onClick={managePassword}>{t('passwordSettings')}</button>}
      {signOut && <button onClick={() => void supabase.auth.signOut()}>{t('signout')}</button>}
    </div>
  );
}

function SignIn() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'link' | 'recovery'>('password');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErr('');
    try {
      const address = email.trim();
      const { error } = mode === 'password'
        ? await supabase.auth.signInWithPassword({ email: address, password })
        : mode === 'recovery'
          ? await supabase.auth.resetPasswordForEmail(address, { redirectTo: window.location.origin })
          : await supabase.auth.signInWithOtp({
            email: address, options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
          });
      if (error?.code === 'over_email_send_rate_limit') setErr(t('emailRateLimit'));
      else if (error?.code === 'invalid_credentials') setErr(t('passwordInvalid'));
      else if (error) setErr(t('errGeneric'));
      else if (mode !== 'password') setSent(true);
    } catch {
      setErr(t('errGeneric'));
    } finally {
      setSending(false);
    }
  };
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setPassword('');
    setErr('');
    setSent(false);
  };
  return (
    <main>
      <LangBar />
      <section className="hero hero--sign-in"><ReactorCore /><h1 className="big small">JARVIS OS</h1></section>
      <GlassCard title={t('signIn')}>
        {!configured ? <p className="empty">{t('setup')}</p> : <>
          {sent ? <p role="status">{t(mode === 'recovery' ? 'passwordResetSent' : 'check')}</p> : (
            <form className="bar" onSubmit={e => void submit(e)}>
              <input type="email" required autoComplete="username" value={email} placeholder={t('email')}
                aria-label={t('email')} onChange={e => setEmail(e.target.value)} />
              {mode === 'password' && <input type="password" required autoComplete="current-password"
                value={password} placeholder={t('password')} aria-label={t('password')}
                onChange={e => setPassword(e.target.value)} />}
              <button className="go" type="submit" disabled={sending}>
                {t(mode === 'password' ? 'passwordSignIn' : mode === 'recovery' ? 'passwordSendReset' : 'magic')}
              </button>
            </form>
          )}
          <div className="bar">
            {mode !== 'password' && <button type="button" disabled={sending} onClick={() => changeMode('password')}>{t('passwordSignIn')}</button>}
            {mode !== 'link' && <button type="button" disabled={sending} onClick={() => changeMode('link')}>{t('passwordUseLink')}</button>}
            {mode !== 'recovery' && <button type="button" disabled={sending} onClick={() => changeMode('recovery')}>{t('passwordForgot')}</button>}
          </div>
        </>}
        {err && <p role="alert" className="empty">{err}</p>}
      </GlassCard>
    </main>
  );
}

function Shell({ userId, managePassword, passwordSaved, passwordForm }: {
  userId: string; managePassword: () => void; passwordSaved: boolean; passwordForm?: JSX.Element;
}) {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(new Date());
  const { events, add, remove } = useEvents();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [planRequests, setPlanRequests] = useState(0);
  const [providers, setProviders] = useState<string[]>();
  const loadMissions = useCallback(async () => {
    const { data } = await supabase.from('missions').select('id,title,done').order('created_at');
    if (data) setMissions(data);
  }, []);
  useEffect(() => { void loadMissions(); }, [loadMissions]);
  useEffect(() => {
    let active = true;
    void getConfiguredProviders().then(configured => {
      if (active) setProviders(configured);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);
  const h = now.getHours();
  const today = iso(now);
  const time = `${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextEvent = events.find(event => event.day > today ||
    (event.day === today && (!event.time || event.time.slice(0, 5) >= time)));
  const pendingMissions = missions.filter(mission => !mission.done);
  const eventDate = nextEvent && new Date(`${nextEvent.day}T${nextEvent.time || '00:00'}`);
  return (
    <>
      <main>
        <LangBar signOut managePassword={managePassword} />
        {passwordForm}
        {passwordSaved && <p role="status">{t('passwordSaved')}</p>}
        <section className="hero hero--dashboard" id="home">
          <ReactorCore />
          <div className="hero-summary">
            <h1 className="hero-brand">JARVIS OS</h1>
            <div className="big">{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div>
            <p className="hello">{t(h < 12 ? 'morning' : h < 19 ? 'afternoon' : 'evening')}</p>
            <p className="date">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="pills">
              {providers && <StatusPill label={t(`models${providers.length}`)} />}
            </div>
            <dl className="arc-brief">
              <div>
                <dt>{t('nextEvent')}</dt>
                <dd>{nextEvent?.title ?? t('noNextEvent')}</dd>
                {eventDate && <dd className="mute">{eventDate.toLocaleString(locale, {
                  weekday: 'short', day: 'numeric', month: 'short',
                  ...(nextEvent?.time && { hour: '2-digit', minute: '2-digit' }),
                })}</dd>}
              </div>
              <div>
                <dt>{t('nextMission')}</dt>
                <dd>{pendingMissions[0]?.title ?? t('noPendingMission')}</dd>
              </div>
            </dl>
            <button type="button" className="go" onClick={() => setPlanRequests(count => count + 1)}>{t('planDay')}</button>
          </div>
        </section>
        <div className="grid">
          <ChatPanel events={events} missions={pendingMissions} planRequests={planRequests} userId={userId} />
          <MissionList items={missions} load={loadMissions} />
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
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => { localStorage.setItem('jarvis-lang', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    if (!configured) { setReady(true); return; }
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setReady(true);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordSaved(false);
        setEditingPassword(true);
      } else if (event === 'SIGNED_OUT') {
        setPasswordSaved(false);
        setEditingPassword(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      {!ready ? null : !session ? <SignIn /> : (
        <Shell key={session.user.id} userId={session.user.id} passwordSaved={passwordSaved}
          managePassword={() => { setPasswordSaved(false); setEditingPassword(true); }}
          passwordForm={editingPassword ? <PasswordForm onCancel={() => setEditingPassword(false)}
            onDone={() => { setEditingPassword(false); setPasswordSaved(true); }} /> : undefined} />
      )}
    </LangCtx.Provider>
  );
}
