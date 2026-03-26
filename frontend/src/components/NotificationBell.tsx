import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count'),
      ]);
      setNotifications(nRes.data);
      setUnreadCount(cRes.data.count);
    } catch {}
  };

  useEffect(() => { load(); const interval = setInterval(load, 30000); return () => clearInterval(interval); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: number) => {
    await api.patch(`/api/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post('/api/notifications/mark-all-read');
    load();
  };

  const dismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      load();
    } catch {}
  };

  const clearAllRead = async () => {
    try {
      await api.delete('/api/notifications/read');
      load();
    } catch {}
  };

  const hasReadNotifications = notifications.some(n => n.is_read);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-500 hover:text-gray-700 transition">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">{t('notifications.markAllRead')}</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-gray-400 text-sm">{t('notifications.empty')}</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) window.location.href = n.link; }}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!n.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{n.type === 'ALERT' ? '🔴' : n.type === 'ACTION' ? '🟡' : '🔵'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString(i18n.language)}</p>
                  </div>
                  <button
                    onClick={(e) => dismiss(n.id, e)}
                    className="text-gray-400 hover:text-red-500 text-sm leading-none flex-shrink-0 p-0.5"
                    title={t('notifications.dismiss')}
                  >✕</button>
                </div>
              </div>
            ))
          )}
          {hasReadNotifications && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button onClick={clearAllRead} className="text-xs text-red-500 hover:underline w-full text-center">
                {t('notifications.clearAllRead')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
