import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import GlassCard from './GlassCard';

type BrowserBattery = EventTarget & { level: number; charging: boolean };
type Device = { id: string; name: string; level: number | null; reported_at: string | null };
const asHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export default function DeviceBatteryCard({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const storageKey = `jarvis-battery-device:${userId}`;
  const [localId, setLocalId] = useState(() => {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  });
  const [battery, setBattery] = useState<{ level: number; charging: boolean }>();
  const [devices, setDevices] = useState<Device[]>();
  const [name, setName] = useState('');
  const [pairingToken, setPairingToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const localLevel = battery?.level;

  useEffect(() => {
    const browser = navigator as Navigator & { getBattery?: () => Promise<BrowserBattery> };
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void browser.getBattery?.().then(manager => {
      if (!active) return;
      const read = () => {
        if (manager.level >= 0 && manager.level <= 1) {
          setBattery({ level: Math.round(manager.level * 100), charging: manager.charging });
        }
      };
      read();
      manager.addEventListener('levelchange', read);
      manager.addEventListener('chargingchange', read);
      unsubscribe = () => {
        manager.removeEventListener('levelchange', read);
        manager.removeEventListener('chargingchange', read);
      };
    }).catch(() => {});
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('device_batteries')
      .select('id,name,level,reported_at').order('name');
    if (!error) setDevices(data);
    else setError('batteryLoadError');
  }, []);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (!localId || localLevel === undefined) return;
    let active = true;
    const publish = async () => {
      const { data, error } = await supabase.from('device_batteries')
        .update({ level: localLevel, reported_at: new Date().toISOString() }).eq('id', localId)
        .select('id').maybeSingle();
      if (!active || error) return;
      if (!data) {
        try { localStorage.removeItem(storageKey); } catch { /* Current tab still stops. */ }
        setLocalId(null);
      }
      await load();
    };
    void publish();
    const heartbeat = window.setInterval(() => void publish(), 300_000);
    return () => { active = false; window.clearInterval(heartbeat); };
  }, [load, localId, localLevel, storageKey]);

  const add = async (fromBrowser: boolean) => {
    const label = name.trim();
    if (!label || busy || (fromBrowser && localLevel === undefined)) return;
    setBusy(true);
    setError('');
    setPairingToken('');
    setCopied(false);
    try {
      const token = fromBrowser ? '' : asHex(crypto.getRandomValues(new Uint8Array(32)));
      const hash = token && asHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))));
      const { data, error } = await supabase.from('device_batteries').insert({
        name: label,
        token_hash: hash || null,
        level: fromBrowser ? localLevel : null,
        reported_at: fromBrowser ? new Date().toISOString() : null,
      }).select('id').single();
      if (error) throw error;
      if (fromBrowser) {
        setLocalId(data.id);
        try { localStorage.setItem(storageKey, data.id); } catch { setError('batteryStorageError'); }
      } else {
        setPairingToken(token);
      }
      setName('');
      await load();
    } catch {
      setError('batterySaveError');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (device: Device) => {
    if (busy || !window.confirm(`${t('batteryConfirmRemove')} ${device.name}?`)) return;
    setBusy(true);
    setError('');
    setPairingToken('');
    try {
      const { error } = await supabase.from('device_batteries').delete().eq('id', device.id);
      if (error) throw error;
      if (localId === device.id) {
        try { localStorage.removeItem(storageKey); } catch { /* Current tab still stops. */ }
        setLocalId(null);
      }
      await load();
    } catch {
      setError('batterySaveError');
    } finally {
      setBusy(false);
    }
  };

  const percent = (level: number) => new Intl.NumberFormat(locale, { style: 'percent' }).format(level / 100);
  return <GlassCard id="devices" title={t('batteryDevices')}>
    <p>{battery ? <>{t('batteryThisDevice')} <strong>{percent(battery.level)}</strong> · {t(battery.charging ? 'batteryCharging' : 'batteryDischarging')}</>
      : t('batteryUnavailable')}</p>
    {devices && <form className="bar" onSubmit={e => { e.preventDefault(); void add(false); }}>
      <input aria-label={t('batteryName')} placeholder={t('batteryName')} value={name}
        onChange={e => setName(e.target.value)} maxLength={60} required />
      <button type="submit" disabled={busy || !name.trim()}>{t('batteryPair')}</button>
      {battery && !localId && <button type="button" disabled={busy || !name.trim()} onClick={() => void add(true)}>
        {t('batteryShare')}
      </button>}
    </form>}
    {pairingToken && <div className="bar">
      <button type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(pairingToken); setCopied(true); }
        catch { setError('batteryCopyError'); }
      }}>{t(copied ? 'batteryCopied' : 'batteryCopy')}</button>
      <button type="button" onClick={() => setPairingToken('')}>{t('close')}</button>
    </div>}
    {error && <p role="alert" className="empty">{t(error)}</p>}
    {devices && devices.length > 0 && <ul>{devices.map(device => <li key={device.id}>
      <span>{device.name} · {device.level === null ? t('batteryWaiting') : percent(device.level)}
        {device.reported_at && <small className="mute">
          {' · '}{new Date(device.reported_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
        </small>}
      </span>
      <button type="button" disabled={busy} onClick={() => void remove(device)}>{t('remove')}</button>
    </li>)}</ul>}
  </GlassCard>;
}
