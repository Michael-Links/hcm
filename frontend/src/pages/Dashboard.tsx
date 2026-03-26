import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface Stats {
  totalEmployees: number;
  departments: number;
  positions: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, departments: 0, positions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [empRes, treeRes] = await Promise.all([
          api.get('/api/employees'),
          api.get('/api/org/tree'),
        ]);
        const groups = treeRes.data.groups || [];
        let depts = 0;
        let posCount = 0;
        groups.forEach((g: any) =>
          g.entities.forEach((e: any) =>
            e.divisions.forEach((d: any) => {
              depts += d.departments.length;
              d.departments.forEach((dept: any) => {
                posCount += dept.positions.length;
              });
            })
          )
        );
        setStats({ totalEmployees: empRes.data.total ?? empRes.data.items?.length ?? 0, departments: depts, positions: posCount });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-gray-500">{t('common.loading')}</div>;

  const cards = [
    { label: t('dashboard.totalEmployees'), value: stats.totalEmployees, color: 'bg-blue-500' },
    { label: t('dashboard.departments'), value: stats.departments, color: 'bg-green-500' },
    { label: t('dashboard.positions'), value: stats.positions, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3`}>
              {c.value}
            </div>
            <p className="text-gray-600 font-medium">{c.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
