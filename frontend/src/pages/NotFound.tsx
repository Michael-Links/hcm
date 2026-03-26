import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500 mt-2">{t('errors.pageNotFound')}</p>
      <Link to="/" className="mt-4 text-primary-600 hover:underline text-sm">{t('errors.goToDashboard')}</Link>
    </div>
  );
}
