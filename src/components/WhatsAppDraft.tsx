import { useId, useState } from 'react';
import { useI18n } from '../lib/i18n';

export type Draft = { recipient: string; message: string };

export function parseWhatsAppRequest(text: string): Draft | undefined {
  const match = /^(?:m[áa]ndale|env[íi]ale|escr[íi]bele|dile)\s+(?:un(?:a)?\s+(?:mensaje(?:\s+por\s+whatsapp)?|whatsapp)\s+)?(?:a\s+|al\s+)(.+?)(?:\s+de\s+(?:que|qiue)\s+|\s+(?:diciendo\s+)?que\s+|:\s*)(.+)$/is.exec(text);
  if (!match) return undefined;
  return { recipient: match[1].trim(), message: match[2].trim() };
}

type Contact = { name: string; phone: string };
const validPhone = /^[1-9]\d{6,14}$/;
const contactName = (name: string) => name.normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/\./g, '').trim().replace(/\s+/g, ' ');

function readContacts(storageKey: string): Contact[] {
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(entries) ? entries.filter((value): value is Contact =>
      typeof value?.name === 'string' && typeof value?.phone === 'string' && validPhone.test(value.phone)) : [];
  } catch {
    return [];
  }
}

export default function WhatsAppDraft({ draft, userId, close }: { draft: Draft; userId: string; close: () => void }) {
  const { t } = useI18n();
  const storageKey = `jarvis-whatsapp-contacts:${userId}`;
  const listId = useId();
  const [contacts, setContacts] = useState(() => readContacts(storageKey));
  const [name, setName] = useState(draft.recipient);
  const [message, setMessage] = useState(draft.message);
  const [phoneOverride, setPhoneOverride] = useState<string>();
  const [status, setStatus] = useState('');
  const alias = contactName(name);
  const contact = contacts.find(entry => contactName(entry.name) === alias);
  const phone = phoneOverride ?? contact?.phone ?? '';
  const digits = phone.trim().replace(/[+\s().-]/g, '');
  const invalid = Boolean(phone.trim()) && !validPhone.test(digits);

  const updateContacts = (save: boolean) => {
    try {
      const next = readContacts(storageKey).filter(entry => contactName(entry.name) !== alias);
      if (save) next.push({ name: name.trim(), phone: digits });
      localStorage.setItem(storageKey, JSON.stringify(next));
      setContacts(next);
      setPhoneOverride(undefined);
      setStatus(save ? 'whatsappSaved' : 'whatsappForgotten');
    } catch {
      setStatus('whatsappStorageError');
    }
  };

  return <form className="wa-draft" onSubmit={e => {
    e.preventDefault();
    if (invalid || !message.trim()) return;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`, '_blank', 'noopener,noreferrer');
  }}>
    <strong>{t('whatsappDraft')}</strong>
    <label>{t('whatsappContact')}
      <input list={listId} value={name} maxLength={100} onChange={e => {
        setName(e.target.value);
        setPhoneOverride(undefined);
        setStatus('');
      }} />
    </label>
    <datalist id={listId}>{contacts.map(entry => <option key={entry.name} value={entry.name} />)}</datalist>
    <label>{t('whatsappMessage')}
      <textarea required value={message} onChange={e => setMessage(e.target.value)} maxLength={1500} rows={3} />
    </label>
    <label>{t('whatsappPhone')}
      <input type="tel" value={phone} onChange={e => {
        setPhoneOverride(e.target.value);
        setStatus('');
      }} aria-invalid={invalid} />
    </label>
    {invalid && <p role="alert">{t('whatsappBadPhone')}</p>}
    {!digits && <p className="mute">{t('whatsappRecipientHint')}</p>}
    {status && <p role="status">{t(status)}</p>}
    <div className="bar">
      <button type="submit" disabled={invalid || !message.trim()}>{t('whatsappOpen')}</button>
      {alias && validPhone.test(digits) && contact?.phone !== digits &&
        <button type="button" onClick={() => updateContacts(true)}>{t('whatsappSaveContact')}</button>}
      {contact && <button type="button" onClick={() => updateContacts(false)}>{t('whatsappForgetContact')}</button>}
      <button type="button" onClick={close}>{t('cancel')}</button>
    </div>
  </form>;
}
