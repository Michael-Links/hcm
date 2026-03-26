import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface TeamMember {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  position_title: string;
  status: string;
  hire_date: string;
}

export default function MyTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/me/team').then((r) => setTeam(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const totalMembers = team.length;
  const avgTenure = totalMembers > 0
    ? (team.reduce((sum, m) => {
        const hire = new Date(m.hire_date);
        const now = new Date();
        return sum + (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }, 0) / totalMembers).toFixed(1)
    : '0';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Team</h1>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">Total Team Members</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{totalMembers}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">Average Tenure</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{avgTenure} years</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">Active Members</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{team.filter(m => m.status === 'ACTIVE').length}</div>
        </div>
      </div>

      {/* Team Summary */}
      {totalMembers > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
          You manage <strong>{totalMembers}</strong> direct report{totalMembers !== 1 ? 's' : ''} with an average tenure of <strong>{avgTenure} years</strong>.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Employee #</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Position</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Hire Date</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr
                key={m.id}
                onClick={() => navigate(`/employees/${m.id}`)}
                className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition"
              >
                <td className="px-6 py-3">{m.employee_number}</td>
                <td className="px-6 py-3 font-medium text-primary-600">{m.first_name} {m.last_name}</td>
                <td className="px-6 py-3">{m.position_title}</td>
                <td className="px-6 py-3">{m.hire_date}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{m.status}</span>
                </td>
              </tr>
            ))}
            {team.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No direct reports</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
