import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';

interface LeaveType {
  id: number;
  name: string;
  code: string;
  default_balance: number;
  is_paid: boolean;
  requires_approval: boolean;
  max_consecutive_days: number | null;
}

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

export default function LeaveManagement() {
  const { t } = useTranslation();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', code: '', default_balance: '0', is_paid: true, requires_approval: true, max_consecutive_days: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', default_balance: '', is_paid: true, requires_approval: true, max_consecutive_days: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const load = useCallback(() => {
    const params = filter ? `?status=${filter}` : '';
    Promise.all([
      api.get('/api/leave-types'),
      api.get(`/api/leave-requests${params}`),
    ]).then(([tRes, rRes]) => {
      setLeaveTypes(tRes.data);
      setRequests(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const createType = async () => {
    setMsg('');
    try {
      await api.post('/api/leave-types', {
        name: form.name,
        code: form.code,
        default_balance: Number(form.default_balance),
        is_paid: form.is_paid,
        requires_approval: form.requires_approval,
        max_consecutive_days: form.max_consecutive_days ? Number(form.max_consecutive_days) : null,
      });
      setMsg(t('leaveAdmin.created'));
      setMsgType('success');
      setForm({ name: '', code: '', default_balance: '0', is_paid: true, requires_approval: true, max_consecutive_days: '' });
      setShowForm(false);
      load();
    } catch { showMsg(t('leaveAdmin.createFailed'), 'error'); }
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
  };

  const startEdit = (lt: LeaveType) => {
    setEditingId(lt.id);
    setEditForm({
      name: lt.name,
      code: lt.code,
      default_balance: String(lt.default_balance),
      is_paid: lt.is_paid,
      requires_approval: lt.requires_approval,
      max_consecutive_days: lt.max_consecutive_days != null ? String(lt.max_consecutive_days) : '',
    });
  };

  const updateType = async () => {
    if (editingId == null) return;
    setMsg('');
    try {
      await api.put(`/api/leave-types/${editingId}`, {
        name: editForm.name,
        code: editForm.code,
        default_balance: Number(editForm.default_balance),
        is_paid: editForm.is_paid,
        requires_approval: editForm.requires_approval,
        max_consecutive_days: editForm.max_consecutive_days ? Number(editForm.max_consecutive_days) : null,
      });
      showMsg(t('leaveAdmin.updated'));
      setEditingId(null);
      load();
    } catch { showMsg(t('leaveAdmin.updateFailed'), 'error'); }
  };

  const confirmDelete = (id: number) => setDeleteConfirm({ open: true, id });

  const deleteType = async () => {
    if (deleteConfirm.id == null) return;
    setMsg('');
    setDeleteConfirm({ open: false, id: null });
    try {
      await api.delete(`/api/leave-types/${deleteConfirm.id}`);
      showMsg(t('leaveAdmin.deleted'));
      load();
    } catch (err: unknown) {
      const message = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      showMsg(message || t('leaveAdmin.deleteFailed'), 'error');
    }
  };

  if (loading) return <div className="text-gray-500">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏖️ {t('leaveAdmin.title')}</h1>
      {msg && <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${msgType === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

      {/* Leave Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">{t('leaveAdmin.leaveTypes')}</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('leaveAdmin.addType')}</button>
          )}
        </div>
        {showForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder={t('common.name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder={t('common.code')} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder={t('leaveAdmin.defaultBalance')} value={form.default_balance}
                onChange={e => setForm({ ...form, default_balance: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="number" placeholder={t('leaveAdmin.maxConsecutiveDays')} value={form.max_consecutive_days}
                onChange={e => setForm({ ...form, max_consecutive_days: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_paid} onChange={e => setForm({ ...form, is_paid: e.target.checked })} /> {t('leaveAdmin.paid')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.requires_approval} onChange={e => setForm({ ...form, requires_approval: e.target.checked })} /> {t('leaveAdmin.requiresApproval')}
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={createType} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">{t('common.save')}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2">{t('common.name')}</th><th className="pb-2">{t('common.code')}</th><th className="pb-2">{t('leaveAdmin.defaultBalance')}</th>
            <th className="pb-2">{t('leaveAdmin.paid')}</th><th className="pb-2">{t('leaveAdmin.approval')}</th><th className="pb-2">{t('leaveAdmin.maxDays')}</th>
            <th className="pb-2">{t('common.actions')}</th>
          </tr></thead>
          <tbody>
            {leaveTypes.map(lt => editingId === lt.id ? (
              <tr key={lt.id} className="border-b last:border-0 bg-gray-50">
                <td className="py-2 pr-2">
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </td>
                <td className="py-2 pr-2">
                  <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </td>
                <td className="py-2 pr-2">
                  <input type="number" value={editForm.default_balance} onChange={e => setEditForm({ ...editForm, default_balance: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </td>
                <td className="py-2 pr-2">
                  <input type="checkbox" checked={editForm.is_paid} onChange={e => setEditForm({ ...editForm, is_paid: e.target.checked })} />
                </td>
                <td className="py-2 pr-2">
                  <input type="checkbox" checked={editForm.requires_approval} onChange={e => setEditForm({ ...editForm, requires_approval: e.target.checked })} />
                </td>
                <td className="py-2 pr-2">
                  <input type="number" value={editForm.max_consecutive_days} onChange={e => setEditForm({ ...editForm, max_consecutive_days: e.target.value })}
                    placeholder="—" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={updateType} className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">{t('common.save')}</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">{t('common.cancel')}</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={lt.id} className="border-b last:border-0">
                <td className="py-2">{lt.name}</td>
                <td className="py-2">{lt.code}</td>
                <td className="py-2">{lt.default_balance}</td>
                <td className="py-2">{lt.is_paid ? '✓' : '✗'}</td>
                <td className="py-2">{lt.requires_approval ? '✓' : '✗'}</td>
                <td className="py-2">{lt.max_consecutive_days ?? '—'}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(lt)} className="px-2 py-1 text-xs text-primary-600 border border-primary-300 rounded hover:bg-primary-50">{t('common.edit')}</button>
                    <button onClick={() => confirmDelete(lt.id)} className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50">{t('common.delete')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">{t('leaveAdmin.allRequests')}</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">{t('common.allStatuses')}</option>
            <option value="PENDING">{t('common.statusLabel.PENDING')}</option>
            <option value="APPROVED">{t('common.statusLabel.APPROVED')}</option>
            <option value="REJECTED">{t('common.statusLabel.REJECTED')}</option>
            <option value="CANCELLED">{t('common.statusLabel.CANCELLED')}</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.employee')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.type')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.start')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.end')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.days')}</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">{t('common.status')}</th>
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
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>
                    {t(`common.statusLabel.${r.status}`, { defaultValue: r.status })}
                  </span>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('leaveAdmin.noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={deleteConfirm.open}
        title={t('leaveAdmin.deleteTypeTitle')}
        message={t('leaveAdmin.deleteTypeMessage')}
        onConfirm={deleteType}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </div>
  );
}
