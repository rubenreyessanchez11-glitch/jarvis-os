import { useState } from 'react';
import { useI18n } from '../lib/i18n';

export type Draft = { recipient: string; message: string };

export function parseWhatsAppRequest(text: string): Draft | undefined {
  const match = /^(?:m[áa]ndale|env[íi]ale|escr[íi]bele|dile)\s+(?:un(?:a)?\s+(?:mensaje(?:\s+por\s+whatsapp)?|whatsapp)\s+)?(?:a\s+|al\s+)(.+?)(?:\s+de\s+(?:que|qiue)\s+|\s+(?:diciendo\s+)?que\s+|:\s*)(.+)$/is.exec(text);
  if (!match) return undefined;
  return { recipient: match[1].trim(), message: match[2].trim() };
}

export default function WhatsAppDraft({ draft, close }: { draft: Draft; close: () => void }) {
  const { t } = useI18n();
  const [message, setMessage] = useState(draft.message);
  const [phone, setPhone] = useState('');
  const digits = phone.trim().replace(/[+\s().-]/g, '');
  const invalid = Boolean(phone.trim()) && !/^[1-9]\d{6,14}$/.test(digits);

  return <form className="wa-draft" onSubmit={e => {
    e.preventDefault();
    if (invalid || !message.trim()) return;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`, '_blank', 'noopener,noreferrer');
  }}>
    <strong>{t('whatsappDraft')}{draft.recipient && ` · ${draft.recipient}`}</strong>
    <label>{t('whatsappMessage')}
      <textarea required value={message} onChange={e => setMessage(e.target.value)} maxLength={1500} rows={3} />
    </label>
    <label>{t('whatsappPhone')}
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} aria-invalid={invalid} />
    </label>
    {invalid && <p role="alert">{t('whatsappBadPhone')}</p>}
    <p className="mute">{t('whatsappRecipientHint')}</p>
    <div className="bar">
      <button type="submit" disabled={invalid || !message.trim()}>{t('whatsappOpen')}</button>
      <button type="button" onClick={close}>{t('cancel')}</button>
    </div>
  </form>;
}
