import { useI18n } from '../lib/i18n';

const ITEMS: [string, string][] = [['home', '#home'], ['chat', '#chat'], ['calendar', '#calendar'], ['learn', '#learn'], ['focus', '#focus']];

export default function Dock() {
  const { t } = useI18n();
  return (
    <nav className="tabs" aria-label="Sections">
      {ITEMS.map(([k, href]) => <a key={k} href={href}>{t(k)}</a>)}
    </nav>
  );
}
