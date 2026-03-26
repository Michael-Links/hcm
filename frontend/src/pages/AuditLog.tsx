import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  timestamp: string;
}

interface AuditResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const ENTITY_TYPES = ['', 'Employee', 'OrgGroup', 'Entity', 'Division', 'Department', 'Position'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE'];

export default function AuditLog() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', '50');
      if (entityType) params.set('entity_type', entityType);
      if (action) params.set('action', action);
      if (userEmail) params.set('user_email', userEmail);
      const res = await api.get(`/api/audit?${params.toString()}`);
      setData(res.data);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, userEmail]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterReset = () => {
    setEntityType('');
    setAction('');
    setUserEmail('');
    setPage(1);
  };

  const actionBadge = (a: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[a] || 'bg-gray-100 text-gray-700'}`}>
        {a}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Audit Log</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type</label>
          <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All</option>
            {ACTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">User Email</label>
          <input type="text" value={userEmail} onChange={(e) => { setUserEmail(e.target.value); setPage(1); }}
            placeholder="Search email..." className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={handleFilterReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg">
          Reset
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entity Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entity ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data && data.items.length > 0 ? (
                  data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{log.user_email ?? '—'}</td>
                      <td className="px-4 py-3">{actionBadge(log.action)}</td>
                      <td className="px-4 py-3">{log.entity_type}</td>
                      <td className="px-4 py-3 text-gray-500">{log.entity_id ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{log.description ?? '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                Page {data.page} of {data.pages} ({data.total} total)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  Previous
                </button>
                <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
