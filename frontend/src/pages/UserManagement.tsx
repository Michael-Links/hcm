import { useState, useEffect } from 'react';
import api from '../api/client';

interface User {
  id: number;
  email: string;
  role: string;
  employee_id: number | null;
  is_active: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'EMPLOYEE', employee_id: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        employee_id: form.employee_id ? parseInt(form.employee_id) : null,
      });
      setShowCreate(false);
      setForm({ email: '', password: '', role: 'EMPLOYEE', employee_id: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setError('');
    try {
      await api.post(`/api/users/${resetTarget.id}/reset-password`, { new_password: resetPassword });
      setResetTarget(null);
      setResetPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const changeRole = async (user: User, role: string) => {
    try {
      await api.put(`/api/users/${user.id}`, { role });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update role');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          + Create User
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <select value={user.role} onChange={(e) => changeRole(user, e.target.value)}
                    className="border rounded px-2 py-1 text-sm">
                    <option value="HR">HR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{user.employee_id ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => setResetTarget(user)}
                    className="text-primary-600 hover:text-primary-800 text-xs font-medium">Reset Password</button>
                  <button onClick={() => toggleActive(user)}
                    className={`text-xs font-medium ${user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID (optional)</label>
                <input type="number" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Reset Password for {resetTarget.email}</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setResetTarget(null); setResetPassword(''); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
