import { useI18n } from '../lib/i18n';
import type { Result } from '../lib/api';

const NAMES: Record<string, string> = { claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini' };

export default function CompareView({ results, onUse }: { results: Result[]; onUse: (r: Result) => void }) {
  const { t } = useI18n();
  return (
    <div className="compare">
      {results.map(r => (
        <div className="m a" key={r.provider}>
          <b>{NAMES[r.provider] ?? r.provider}</b>
          <p>{r.text ?? t('errGeneric')}</p>
          {r.text && <button onClick={() => onUse(r)}>{t('use')}</button>}
        </div>
      ))}
    </div>
  );
}
