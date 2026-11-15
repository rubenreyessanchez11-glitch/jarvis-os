import { useState, type FormEvent } from 'react';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import GlassCard from './GlassCard';

export default function PasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || password.length < 12) return;
    if (password !== confirmation) { setError(t('passwordMismatch')); return; }
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) onDone();
      else if (error.code === 'reauthentication_needed') setError(t('passwordNeedsFreshSession'));
      else if (error.code === 'same_password') setError(t('passwordAlreadySet'));
      else if (error.code === 'weak_password') setError(t('passwordWeak'));
      else setError(t('passwordUpdateFailed'));
    } catch {
      setError(t('passwordUpdateFailed'));
    } finally {
      setBusy(false);
    }
  };

  return <GlassCard title={t('passwordSettings')}>
    <form onSubmit={event => void submit(event)}>
      <div className="bar">
        <input type="password" minLength={12} required autoComplete="new-password"
          aria-label={t('newPassword')} placeholder={t('newPassword')} value={password}
          onChange={event => setPassword(event.target.value)} disabled={busy} />
        <input type="password" minLength={12} required autoComplete="new-password"
          aria-label={t('confirmPassword')} placeholder={t('confirmPassword')} value={confirmation}
          onChange={event => setConfirmation(event.target.value)} disabled={busy} />
      </div>
      <p className="mute">{t('passwordLength')}</p>
      {error && <p role="alert">{error}</p>}
      <div className="bar">
        <button className="go" type="submit" disabled={busy}>{t('save')}</button>
        <button type="button" onClick={onCancel} disabled={busy}>{t('cancel')}</button>
      </div>
    </form>
  </GlassCard>;
}
