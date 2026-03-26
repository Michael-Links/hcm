import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

interface LeaveBalance {
  id: number;
  leave_type_id: number;
  leave_type_name: string;
  year: number;
  entitled: number;
  used: number;
  pending: number;
  balance: number;
}

interface LeaveType {
  id: number;
  name: string;
  code: string;
}

interface LeaveRequest {
  id: number;
  leave_type_id: number;
  leave_type_name: string;
  employee_name: string;
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

export default function MyLeave() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([
      api.get('/api/me/leave-balances'),
      api.get('/api/leave-types'),
      api.get('/api/me/leave-requests'),
    ]).then(([bRes, tRes, rRes]) => {
      setBalances(bRes.data);
      setLeaveTypes(tRes.data);
      setRequests(rRes.data);
      if (tRes.data.length > 0 && !form.leave_type_id) {
        setForm(f => ({ ...f, leave_type_id: String(tRes.data[0].id) }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setMsg(''); setError('');
    try {
      await api.post('/api/me/leave-requests', {
        leave_type_id: Number(form.leave_type_id),
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason || null,
      });
      setMsg('Leave request submitted!');
      setForm(f => ({ ...f, start_date: '', end_date: '', reason: '' }));
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to submit');
    }
  };

  const cancel = async (id: number) => {
    try {
      await api.post(`/api/me/leave-requests/${id}/cancel`);
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏖️ My Leave</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {balances.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">{b.leave_type_name}</h3>
            <div className="text-3xl font-bold text-primary-600 mb-2">{b.balance}</div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <div>Entitled: {b.entitled}</div>
              <div>Used: {b.used}</div>
              <div>Pending: {b.pending}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-4">New Leave Request</h2>
        {msg && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm mb-4">{msg}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={form.leave_type_id} onChange={e => setForm({ ...form, leave_type_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
          <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Start Date" />
          <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="End Date" />
          <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Reason (optional)" />
        </div>
        <button onClick={submit} disabled={!form.start_date || !form.end_date}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
          Submit Request
        </button>
      </div>

      {/* Request History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Request History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Start</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">End</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Days</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="px-6 py-3">{r.leave_type_name}</td>
                <td className="px-6 py-3">{r.start_date}</td>
                <td className="px-6 py-3">{r.end_date}</td>
                <td className="px-6 py-3">{r.days}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>{r.status}</span>
                </td>
                <td className="px-6 py-3">
                  {r.status === 'PENDING' && (
                    <button onClick={() => cancel(r.id)} className="text-red-600 hover:underline text-xs">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No leave requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
