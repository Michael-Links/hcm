import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import type { AppLanguage } from '../i18n/config';

type LanguageSelectorProps = {
  variant: 'login' | 'topbar';
};

export default function LanguageSelector({ variant }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { language, changeLanguagePreference } = useAuth();
  const [error, setError] = useState('');

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as AppLanguage;
    setError('');

    try {
      await changeLanguagePreference(nextLanguage);
    } catch {
      setError(t('language.saveFailed'));
    }
  };

  const wrapperClassName = variant === 'login'
    ? 'mb-6 flex flex-col items-end gap-1'
    : 'flex flex-col items-start gap-1';

  const selectClassName = variant === 'login'
    ? 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200'
    : 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

  return (
    <div className={wrapperClassName}>
      <select
        id={`language-selector-${variant}`}
        value={language}
        onChange={handleChange}
        className={selectClassName}
        aria-label={t('language.label')}
      >
        <option value="en">{t('language.english')}</option>
        <option value="zh-HK">{t('language.zhHK')}</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
