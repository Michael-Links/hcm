import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/', label: '📊 Dashboard', roles: ['HR'] },
  { to: '/org', label: '🏢 Organization', roles: ['HR'] },
  { to: '/onboard', label: '➕ Onboard', roles: ['HR'] },
  { to: '/employees', label: '👥 Employees', roles: ['HR'] },
  { to: '/users', label: '👤 Users', roles: ['HR'] },
  { to: '/audit', label: '📋 Audit Log', roles: ['HR'] },
  { to: '/directory', label: '📒 Directory', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/profile', label: '👤 My Profile', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/leave', label: '🏖️ My Leave', roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/team', label: '👥 My Team', roles: ['MANAGER'] },
  { to: '/team/leave', label: '📅 Team Leave', roles: ['MANAGER'] },
  { to: '/leave-admin', label: '🏖️ Leave Admin', roles: ['HR'] },
];

export default function Sidebar() {
  const { role } = useAuth();
  const visible = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">ECM</h1>
        <p className="text-xs text-gray-500 mt-1">Employment Core Module</p>
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
