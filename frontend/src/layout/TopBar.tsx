import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationBell from '../components/NotificationBell';
import BrandLockup from '../components/BrandLockup';
import LanguageSelector from '../components/LanguageSelector';

export default function TopBar() {
  const { t } = useTranslation();
  const { role, logout } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <BrandLockup variant="topbar" />
      <div className="flex items-center gap-4">
        <LanguageSelector variant="topbar" />
        <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
          {role ? t(`roles.${role}`, { defaultValue: role }) : ''}
        </span>
        <NotificationBell />
        <button onClick={() => setShowChangePw(true)} className="text-sm text-gray-500 hover:text-gray-700 transition">
          {t('auth.changePassword')}
        </button>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition">
          {t('auth.signOut')}
        </button>
      </div>
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
    </header>
  );
}
