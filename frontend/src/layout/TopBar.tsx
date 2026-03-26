import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationBell from '../components/NotificationBell';
import BrandLockup from '../components/BrandLockup';

export default function TopBar() {
  const { role, logout } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <BrandLockup variant="topbar" />
      <div className="flex items-center gap-4">
        <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">{role}</span>
        <NotificationBell />
        <button onClick={() => setShowChangePw(true)} className="text-sm text-gray-500 hover:text-gray-700 transition">Change Password</button>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition">Sign Out</button>
      </div>
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
    </header>
  );
}
