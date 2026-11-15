import { iso } from './date';

const eventsUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
export const calendarScope = 'https://www.googleapis.com/auth/calendar.events.owned';
export const calendarClientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID as string | undefined;

type Token = { access_token?: string; expires_in?: number; scope?: string };
type OAuth = {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    include_granted_scopes: boolean;
    callback: (token: Token) => void;
    error_callback: () => void;
  }): { requestAccessToken(options: { prompt: string }): void };
  revoke(token: string, callback: () => void): void;
};
export const googleOAuth = () =>
  (window as Window & { google?: { accounts: { oauth2: OAuth } } }).google?.accounts.oauth2;

type EventDate = { date?: string; dateTime?: string; timeZone?: string };
export type GoogleEvent = {
  id: string;
  summary?: string;
  start: EventDate;
  end: EventDate;
  etag?: string;
  organizer?: { self?: boolean };
  locked?: boolean;
  eventType?: string;
};

export function eventStart(event: GoogleEvent) {
  if (event.start.date) return { day: event.start.date, time: '' };
  const start = new Date(event.start.dateTime!);
  return {
    day: iso(start),
    time: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
  };
}

export function occursOn(event: GoogleEvent, day: string) {
  if (event.start.date && event.end.date) return event.start.date <= day && day < event.end.date;
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return new Date(event.start.dateTime!) < end && new Date(event.end.dateTime!) > start;
}

async function calendarRequest(token: string, suffix: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(eventsUrl + suffix, {
    ...options, headers, cache: 'no-store', redirect: 'error',
  });
  if (!response.ok) throw new CalendarRequestError(response.status);
  return response;
}

export class CalendarRequestError extends Error {
  constructor(readonly status: number) { super('Google Calendar request failed'); }
}

export async function listGoogleEvents(token: string, from: string, to: string, signal: AbortSignal) {
  const params = new URLSearchParams({
    timeMin: new Date(`${from}T00:00:00`).toISOString(),
    timeMax: new Date(`${to}T00:00:00`).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    fields: 'nextPageToken,items(id,summary,start,end,etag,organizer/self,locked,eventType)',
  });
  const events: GoogleEvent[] = [];
  do {
    const response = await calendarRequest(token, `?${params}`, { signal });
    const page: { items?: GoogleEvent[]; nextPageToken?: string } = await response.json();
    events.push(...(page.items ?? []));
    if (!page.nextPageToken) break;
    params.set('pageToken', page.nextPageToken);
  } while (true);
  return events;
}

export async function saveGoogleEvent(token: string, day: string, time: string, summary: string, event?: GoogleEvent) {
  const previous = event && eventStart(event);
  const datesChanged = !previous || previous.day !== day || previous.time !== time;
  const sameType = time && event?.start.dateTime && event?.end.dateTime;
  let dates: { start: EventDate; end: EventDate } | undefined;
  if (datesChanged && time) {
    const start = new Date(`${day}T${time}:00`);
    if (iso(start) !== day || start.getHours() !== Number(time.slice(0, 2)) ||
        start.getMinutes() !== Number(time.slice(3))) throw new Error('Invalid local time');
    const duration = sameType
      ? Date.parse(event.end.dateTime!) - Date.parse(event.start.dateTime!)
      : 3_600_000;
    dates = {
      start: { dateTime: start.toISOString(), timeZone: event?.start.timeZone },
      end: { dateTime: new Date(start.getTime() + duration).toISOString(), timeZone: event?.end.timeZone },
    };
  } else if (datesChanged) {
    const days = event?.start.date && event.end.date
      ? (Date.parse(event.end.date) - Date.parse(event.start.date)) / 86_400_000
      : 1;
    const end = new Date(`${day}T12:00:00`);
    end.setDate(end.getDate() + days);
    dates = { start: { date: day }, end: { date: iso(end) } };
  }
  await calendarRequest(token, event ? `/${encodeURIComponent(event.id)}` : '', {
    method: event ? 'PATCH' : 'POST',
    headers: event?.etag ? { 'If-Match': event.etag } : undefined,
    body: JSON.stringify({ summary, ...dates }),
  });
}

export async function deleteGoogleEvent(token: string, event: GoogleEvent) {
  await calendarRequest(token, `/${encodeURIComponent(event.id)}`, {
    method: 'DELETE', headers: event.etag ? { 'If-Match': event.etag } : undefined,
  });
}
