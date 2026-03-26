import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Emp {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  hire_date: string;
  status: string;
  position_title: string;
  department_name: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  const handleStatusChange = useCallback((val: string) => {
    setStatusFilter(val);
    setPage(1);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '20');
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);

    api.get(`/api/employees?${params}`)
      .then((r) => {
        setEmployees(r.data.items);
        setTotalPages(r.data.pages);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter, page]);

  const exportCsv = () => {
    api.get('/api/employees/export', { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(() => setImportMsg('Export failed'));
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await api.post('/api/employees/import', formData);
      const data = resp.data;
      let msg = `Created: ${data.created}`;
      if (data.errors?.length) msg += ` | Errors: ${data.errors.length}`;
      setImportMsg(msg);
      setPage(1);
      setDebouncedSearch(debouncedSearch);
    } catch {
      setImportMsg('Import failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            Import CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCsv} />
          <Link to="/onboard" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
            + Onboard New
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {importMsg && <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm mb-4">{importMsg}</div>}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or employee #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{total} employee{total !== 1 ? 's' : ''} found</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Employee #</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Position</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Department</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Hire Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-6 py-3">
                    <Link to={`/employees/${e.id}`} className="text-primary-600 hover:underline">{e.employee_number}</Link>
                  </td>
                  <td className="px-6 py-3">{e.first_name} {e.last_name}</td>
                  <td className="px-6 py-3">{e.position_title}</td>
                  <td className="px-6 py-3">{e.department_name}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{e.status}</span>
                  </td>
                  <td className="px-6 py-3">{e.hire_date}</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No employees found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
