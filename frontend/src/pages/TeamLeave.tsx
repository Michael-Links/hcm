import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function TeamLeave() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const params = filter ? `?status=${filter}` : '';
    api.get(`/api/me/team/leave-requests${params}`)
      .then(r => setRequests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: number, status: string) => {
    try {
      await api.patch(`/api/me/team/leave-requests/${id}`, { status });
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📅 {t('teamLeave.title')}</h1>

      <div className="mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">{t('common.allStatuses')}</option>
          <option value="PENDING">{t('common.statusLabel.PENDING')}</option>
          <option value="APPROVED">{t('common.statusLabel.APPROVED')}</option>
          <option value="REJECTED">{t('common.statusLabel.REJECTED')}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.employee')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.type')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.start')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.end')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.days')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.reason')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.status')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="px-6 py-3">{r.employee_name}</td>
                <td className="px-6 py-3">{r.leave_type_name}</td>
                <td className="px-6 py-3">{r.start_date}</td>
                <td className="px-6 py-3">{r.end_date}</td>
                <td className="px-6 py-3">{r.days}</td>
                <td className="px-6 py-3">{r.reason || t('common.notAvailable')}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>
                    {t(`common.statusLabel.${r.status}`, { defaultValue: r.status })}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-2">
                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleAction(r.id, 'APPROVED')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">{t('teamLeave.approve')}</button>
                      <button onClick={() => handleAction(r.id, 'REJECTED')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">{t('teamLeave.reject')}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">{t('teamLeave.noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
