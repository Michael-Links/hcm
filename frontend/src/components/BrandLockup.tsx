import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BRANDING } from '../branding';

type BrandLockupProps = {
  variant: 'login' | 'sidebar' | 'topbar';
};

export default function BrandLockup({ variant }: BrandLockupProps) {
  const { t } = useTranslation();

  if (variant === 'login') {
    return (
      <div className="flex flex-col items-center gap-4">
        <img
          src={BRANDING.logoUrl}
          alt={BRANDING.companyName}
          className="h-12 w-auto sm:h-14"
        />
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img
              src={BRANDING.iconUrl}
              alt={`${BRANDING.appName} icon`}
              className="h-11 w-11 rounded-xl object-cover shadow-sm ring-1 ring-primary-100"
            />
            <h1 className="text-3xl font-bold text-primary-700">{BRANDING.appName}</h1>
          </div>
          <p className="text-sm text-gray-500">{t('brand.appSubtitle')}</p>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Link to="/" className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400">
        <img
          src={BRANDING.iconUrl}
          alt={`${BRANDING.appName} icon`}
          className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10"
        />
        <div>
          <h1 className="text-xl font-bold text-white">{BRANDING.appName}</h1>
          <p className="text-xs text-gray-400 mt-1">{t('brand.companyName')}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/" className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400">
      <img
        src={BRANDING.iconUrl}
        alt={`${BRANDING.appName} icon`}
        className="h-9 w-9 rounded-lg object-cover ring-1 ring-primary-100"
      />
      <div>
        <span className="block text-lg font-semibold text-gray-800">{BRANDING.appName}</span>
        <span className="block text-xs text-gray-500">{t('brand.companyName')}</span>
      </div>
    </Link>
  );
}
