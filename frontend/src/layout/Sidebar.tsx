import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import BrandLockup from '../components/BrandLockup';

const navItems = [
  { to: '/', icon: '📊', labelKey: 'navigation.dashboard', roles: ['HR'] },
  { to: '/org', icon: '🏢', labelKey: 'navigation.organization', roles: ['HR'] },
  { to: '/onboard', icon: '➕', labelKey: 'navigation.onboard', roles: ['HR'] },
  { to: '/employees', icon: '👥', labelKey: 'navigation.employees', roles: ['HR'] },
  { to: '/users', icon: '👤', labelKey: 'navigation.users', roles: ['HR'] },
  { to: '/audit', icon: '📋', labelKey: 'navigation.audit', roles: ['HR'] },
  { to: '/directory', icon: '📒', labelKey: 'navigation.directory', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/profile', icon: '👤', labelKey: 'navigation.profile', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/leave', icon: '🏖️', labelKey: 'navigation.leave', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/team', icon: '👥', labelKey: 'navigation.team', roles: ['MANAGER'] },
  { to: '/team/leave', icon: '📅', labelKey: 'navigation.teamLeave', roles: ['MANAGER'] },
  { to: '/leave-admin', icon: '🏖️', labelKey: 'navigation.leaveAdmin', roles: ['HR'] },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const visible = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <div className="p-6">
        <BrandLockup variant="sidebar" />
      </div>
      <nav className="flex-1 px-3">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg mb-1 text-sm transition ${
                isActive ? 'bg-primary-600 text-white' : 'hover:bg-gray-800 text-gray-300'
              }`
            }
          >
            <span className="mr-2">{item.icon}</span>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
