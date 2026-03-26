import { useEffect, useState } from 'react';
import api from '../api/client';

interface DirectoryEntry {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position_title: string;
  department_name: string;
}

export default function Directory() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    const params = q ? { search: q } : {};
    api.get('/api/directory', { params })
      .then((r) => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load(search || undefined);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Directory</h1>

      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button onClick={handleSearch} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
          Search
        </button>
        {search && (
          <button onClick={() => { setSearch(''); load(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No employees found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                  {e.first_name?.[0]}{e.last_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{e.first_name} {e.last_name}</div>
                  <div className="text-xs text-gray-400">{e.employee_number}</div>
                </div>
              </div>
              <dl className="space-y-1 text-sm">
                {e.position_title && (
                  <div className="flex"><dt className="w-24 text-gray-500">Position</dt><dd className="text-gray-700">{e.position_title}</dd></div>
                )}
                {e.department_name && (
                  <div className="flex"><dt className="w-24 text-gray-500">Department</dt><dd className="text-gray-700">{e.department_name}</dd></div>
                )}
                {e.email && (
                  <div className="flex"><dt className="w-24 text-gray-500">Email</dt><dd className="text-gray-700">{e.email}</dd></div>
                )}
                {e.phone && (
                  <div className="flex"><dt className="w-24 text-gray-500">Phone</dt><dd className="text-gray-700">{e.phone}</dd></div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
