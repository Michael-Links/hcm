import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Position { id: number; title: string; code: string; department_id: number; is_active: boolean; }

const steps = ['Select Position', 'Personal Info', 'Compensation'];

export default function OnboardWizard() {
  const [step, setStep] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState({
    position_id: 0,
    hire_date: new Date().toISOString().split('T')[0],
    first_name: '', last_name: '', gender: '', date_of_birth: '',
    email: '', phone: '', address_line1: '', city: '', country: '',
    salary_amount: '', salary_currency: 'USD',
  });
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/org/positions').then((r) => setPositions(r.data)).catch(() => {});
  }, []);

  const next = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.position_id) errs.position_id = 'Please select a position';
    }
    if (step === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required';
      if (!form.last_name.trim()) errs.last_name = 'Last name is required';
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errs.email = 'Invalid email format';
      }
    }
    setStepErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep((s) => Math.min(s + 1, 2));
  };
  const prev = () => { setStepErrors({}); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const body: any = {
        position_id: form.position_id,
        hire_date: form.hire_date,
        personal_info: {
          first_name: form.first_name,
          last_name: form.last_name,
          gender: form.gender || null,
          date_of_birth: form.date_of_birth || null,
          email: form.email || null,
          phone: form.phone || null,
          address_line1: form.address_line1 || null,
          city: form.city || null,
          country: form.country || null,
        },
      };
      if (form.salary_amount) {
        body.compensation = {
          package_name: 'Initial Package',
          salary_amount: parseFloat(form.salary_amount),
          salary_currency: form.salary_currency,
        };
      }
      await api.post('/api/employees/onboard', body);
      navigate('/employees');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Onboard Employee</h1>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`ml-2 text-sm ${i <= step ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 mx-3 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <select value={form.position_id} onChange={(e) => set('position_id', Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg ${stepErrors.position_id ? 'border-red-500' : 'border-gray-300'}`}>
                <option value={0}>Select a position...</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.code})</option>)}
              </select>
              {stepErrors.position_id && <p className="text-xs text-red-500 mt-1">{stepErrors.position_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
              <input type="date" value={form.hire_date} onChange={(e) => set('hire_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: 'first_name', label: 'First Name', required: true },
              { field: 'last_name', label: 'Last Name', required: true },
              { field: 'email', label: 'Email' },
              { field: 'phone', label: 'Phone' },
              { field: 'gender', label: 'Gender' },
              { field: 'date_of_birth', label: 'Date of Birth', type: 'date' },
              { field: 'address_line1', label: 'Address' },
              { field: 'city', label: 'City' },
              { field: 'country', label: 'Country' },
            ].map(({ field, label, type, required }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
                <input type={type || 'text'} value={(form as any)[field]} onChange={(e) => set(field, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${stepErrors[field] ? 'border-red-500' : 'border-gray-300'}`} required={required} />
                {stepErrors[field] && <p className="text-xs text-red-500 mt-1">{stepErrors[field]}</p>}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Optional: Set up initial compensation package</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary</label>
                <input type="number" value={form.salary_amount} onChange={(e) => set('salary_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.salary_currency} onChange={(e) => set('salary_currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button onClick={prev} disabled={step === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition">
            Back
          </button>
          {step < 2 ? (
            <button onClick={next} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              Next
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {submitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
