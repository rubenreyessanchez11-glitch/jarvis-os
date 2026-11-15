import { useEffect, useState } from 'react';
import {
  calendarClientId, calendarScope, CalendarRequestError, googleOAuth, listGoogleEvents, type GoogleEvent,
} from './googleCalendar';

export function useGoogleCalendar(from: string, to: string) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{ token: string; expiry: number }>();
  const [result, setResult] = useState<{ token: string; from: string; events: GoogleEvent[] }>();
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!calendarClientId) return;
    if (googleOAuth()) { setReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setReady(Boolean(googleOAuth()));
    script.onerror = () => setError('googleError');
    document.head.append(script);
    return () => { script.remove(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setSession(undefined);
      setResult(undefined);
      setError('googleExpired');
    }, Math.max(0, session.expiry - Date.now()));
    void listGoogleEvents(session.token, from, to, controller.signal).then(events => {
      if (!controller.signal.aborted) setResult({ token: session.token, from, events });
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof CalendarRequestError && error.status === 401) {
        setSession(undefined);
        setResult(undefined);
        setError('googleExpired');
      } else {
        setError('googleError');
      }
    });
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [session, from, to, revision]);

  const connect = () => {
    if (!calendarClientId) return;
    setError('');
    try {
      const client = googleOAuth()?.initTokenClient({
        client_id: calendarClientId,
        scope: calendarScope,
        include_granted_scopes: false,
        callback: data => {
          const expires = Number(data.expires_in);
          if (!data.access_token || !data.scope?.split(' ').includes(calendarScope) || !(expires > 0)) {
            setError('googleError');
            return;
          }
          setSession({ token: data.access_token, expiry: Date.now() + expires * 1000 });
        },
        error_callback: () => setError('googleError'),
      });
      client?.requestAccessToken({ prompt: 'select_account' });
    } catch { setError('googleError'); }
  };

  const disconnect = () => {
    if (session) googleOAuth()?.revoke(session.token, () => {});
    setSession(undefined);
    setResult(undefined);
    setError('');
  };
  const refresh = () => { setError(''); setRevision(value => value + 1); };
  const events = session && result?.token === session.token && result.from === from ? result.events : [];
  return { enabled: Boolean(calendarClientId), ready, token: session?.token, events, error, connect, disconnect, refresh };
}
