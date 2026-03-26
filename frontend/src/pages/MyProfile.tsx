import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
}

interface Dependent {
  id: number;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
}

interface RecurringPayment {
  id: number;
  type: string;
  amount: number;
  currency: string;
  frequency: string;
}

interface OneTimePayment {
  id: number;
  type: string;
  amount: number;
  currency: string;
  payment_date: string;
}

interface CompensationPackage {
  id: number;
  name: string;
  effective_date: string;
  recurring_payments: RecurringPayment[];
  one_time_payments: OneTimePayment[];
}

const emptyContact = { name: '', relationship: '', phone: '', email: '' };
const emptyDependent = { name: '', relationship: '', date_of_birth: '', gender: '' };

export default function MyProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', email: '', address_line1: '', address_line2: '', city: '', country: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Emergency contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  // Dependents state
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [depForm, setDepForm] = useState(emptyDependent);
  const [editingDepId, setEditingDepId] = useState<number | null>(null);
  const [showDepForm, setShowDepForm] = useState(false);

  // Compensation state
  const [compensation, setCompensation] = useState<CompensationPackage[]>([]);

  const loadContacts = useCallback(() => {
    api.get('/api/me/emergency-contacts').then(r => setContacts(r.data)).catch(() => {});
  }, []);

  const loadDependents = useCallback(() => {
    api.get('/api/me/dependents').then(r => setDependents(r.data)).catch(() => {});
  }, []);

  const loadCompensation = useCallback(() => {
    api.get('/api/me/compensation').then(r => setCompensation(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/api/me')
      .then((r) => {
        setProfile(r.data);
        const pi = r.data.personal_info;
        if (pi) setForm({ phone: pi.phone || '', email: pi.email || '', address_line1: pi.address_line1 || '', address_line2: pi.address_line2 || '', city: pi.city || '', country: pi.country || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    loadContacts();
    loadDependents();
    loadCompensation();
  }, [loadContacts, loadDependents, loadCompensation]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    setMsg('');
    if (!validate()) return;
    try {
      const res = await api.patch('/api/me', form);
      setProfile(res.data);
      setEditing(false);
      setMsg('Profile updated!');
    } catch {
      setMsg('Failed to update');
    }
  };

  // --- Emergency Contact handlers ---
  const saveContact = async () => {
    try {
      if (editingContactId) {
        await api.put(`/api/me/emergency-contacts/${editingContactId}`, contactForm);
      } else {
        await api.post('/api/me/emergency-contacts', contactForm);
      }
      setShowContactForm(false);
      setEditingContactId(null);
      setContactForm(emptyContact);
      loadContacts();
    } catch { /* ignore */ }
  };

  const editContact = (c: EmergencyContact) => {
    setContactForm({ name: c.name, relationship: c.relationship, phone: c.phone, email: c.email || '' });
    setEditingContactId(c.id);
    setShowContactForm(true);
  };

  const deleteContact = async (id: number) => {
    await api.delete(`/api/me/emergency-contacts/${id}`);
    loadContacts();
  };

  // --- Dependent handlers ---
  const saveDep = async () => {
    try {
      const payload = { ...depForm, date_of_birth: depForm.date_of_birth || null, gender: depForm.gender || null };
      if (editingDepId) {
        await api.put(`/api/me/dependents/${editingDepId}`, payload);
      } else {
        await api.post('/api/me/dependents', payload);
      }
      setShowDepForm(false);
      setEditingDepId(null);
      setDepForm(emptyDependent);
      loadDependents();
    } catch { /* ignore */ }
  };

  const editDep = (d: Dependent) => {
    setDepForm({ name: d.name, relationship: d.relationship, date_of_birth: d.date_of_birth || '', gender: d.gender || '' });
    setEditingDepId(d.id);
    setShowDepForm(true);
  };

  const deleteDep = async (id: number) => {
    await api.delete(`/api/me/dependents/${id}`);
    loadDependents();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!profile) return <div className="text-gray-500">No profile linked to your account</div>;

  const pi = profile.personal_info;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      {msg && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm mb-4">{msg}</div>}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Personal Information</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-primary-600 hover:underline">Edit</button>
          )}
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex"><dt className="w-40 text-gray-500">Name</dt><dd>{pi?.first_name} {pi?.last_name}</dd></div>
          <div className="flex"><dt className="w-40 text-gray-500">Employee #</dt><dd>{profile.employee_number}</dd></div>
          <div className="flex"><dt className="w-40 text-gray-500">Email</dt><dd>{pi?.email || '—'}</dd></div>
          <div className="flex"><dt className="w-40 text-gray-500">Gender</dt><dd>{pi?.gender || '—'}</dd></div>
          {editing ? (
            <>
              <div className="flex items-center"><dt className="w-40 text-gray-500">Phone *</dt>
                <div>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`px-3 py-1 border rounded-lg text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                  <p className="text-xs text-gray-400 mt-0.5">e.g., +1-555-0100</p>
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div></div>
              <div className="flex items-center"><dt className="w-40 text-gray-500">Email</dt>
                <div>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`px-3 py-1 border rounded-lg text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div></div>
              <div className="flex items-center"><dt className="w-40 text-gray-500">Address</dt>
                <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex items-center"><dt className="w-40 text-gray-500">Address Line 2</dt>
                <input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex items-center"><dt className="w-40 text-gray-500">City</dt>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex items-center"><dt className="w-40 text-gray-500">Country</dt>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex gap-2 mt-2">
                <button onClick={save} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">Save</button>
                <button onClick={() => { setEditing(false); setErrors({}); }} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex"><dt className="w-40 text-gray-500">Phone</dt><dd>{pi?.phone || '—'}</dd></div>
              <div className="flex"><dt className="w-40 text-gray-500">Address</dt><dd>{pi?.address_line1 || '—'}</dd></div>
              <div className="flex"><dt className="w-40 text-gray-500">Address Line 2</dt><dd>{pi?.address_line2 || '—'}</dd></div>
              <div className="flex"><dt className="w-40 text-gray-500">City</dt><dd>{pi?.city || '—'}</dd></div>
              <div className="flex"><dt className="w-40 text-gray-500">Country</dt><dd>{pi?.country || '—'}</dd></div>
            </>
          )}
        </dl>
      </div>

      {/* Emergency Contacts */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Emergency Contacts</h2>
          {!showContactForm && (
            <button onClick={() => { setContactForm(emptyContact); setEditingContactId(null); setShowContactForm(true); }}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Contact</button>
          )}
        </div>
        {showContactForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Name" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Relationship" value={contactForm.relationship} onChange={e => setContactForm({ ...contactForm, relationship: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Phone" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Email (optional)" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveContact} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                {editingContactId ? 'Update' : 'Save'}
              </button>
              <button onClick={() => { setShowContactForm(false); setEditingContactId(null); }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400">No emergency contacts added.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th><th className="pb-2">Relationship</th><th className="pb-2">Phone</th><th className="pb-2">Email</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.relationship}</td>
                  <td className="py-2">{c.phone}</td>
                  <td className="py-2">{c.email || '—'}</td>
                  <td className="py-2 text-right space-x-2">
                    <button onClick={() => editContact(c)} className="text-primary-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => deleteContact(c.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dependents */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Dependents</h2>          {!showDepForm && (
            <button onClick={() => { setDepForm(emptyDependent); setEditingDepId(null); setShowDepForm(true); }}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Dependent</button>
          )}
        </div>
        {showDepForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Name" value={depForm.name} onChange={e => setDepForm({ ...depForm, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Relationship" value={depForm.relationship} onChange={e => setDepForm({ ...depForm, relationship: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="date" placeholder="Date of Birth" value={depForm.date_of_birth} onChange={e => setDepForm({ ...depForm, date_of_birth: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Gender (optional)" value={depForm.gender} onChange={e => setDepForm({ ...depForm, gender: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveDep} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                {editingDepId ? 'Update' : 'Save'}
              </button>
              <button onClick={() => { setShowDepForm(false); setEditingDepId(null); }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
        {dependents.length === 0 ? (
          <p className="text-sm text-gray-400">No dependents added.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Name</th><th className="pb-2">Relationship</th><th className="pb-2">Date of Birth</th><th className="pb-2">Gender</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {dependents.map(d => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2">{d.relationship}</td>
                  <td className="py-2">{d.date_of_birth || '—'}</td>
                  <td className="py-2">{d.gender || '—'}</td>
                  <td className="py-2 text-right space-x-2">
                    <button onClick={() => editDep(d)} className="text-primary-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => deleteDep(d.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* My Compensation */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">My Compensation</h2>
        {compensation.length === 0 ? (
          <p className="text-sm text-gray-400">No compensation packages found.</p>
        ) : (
          <div className="space-y-4">
            {compensation.map((pkg) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">{pkg.name}</h3>
                  <span className="text-xs text-gray-400">Effective: {pkg.effective_date}</span>
                </div>
                {pkg.recurring_payments.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Recurring Payments</h4>
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-gray-500 border-b">
                        <th className="pb-1">Type</th><th className="pb-1">Amount</th><th className="pb-1">Currency</th><th className="pb-1">Frequency</th>
                      </tr></thead>
                      <tbody>
                        {pkg.recurring_payments.map((rp) => (
                          <tr key={rp.id} className="border-b last:border-0">
                            <td className="py-1">{rp.type}</td>
                            <td className="py-1">{rp.amount.toLocaleString()}</td>
                            <td className="py-1">{rp.currency}</td>
                            <td className="py-1">{rp.frequency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {pkg.one_time_payments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">One-Time Payments</h4>
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-gray-500 border-b">
                        <th className="pb-1">Type</th><th className="pb-1">Amount</th><th className="pb-1">Currency</th><th className="pb-1">Date</th>
                      </tr></thead>
                      <tbody>
                        {pkg.one_time_payments.map((otp) => (
                          <tr key={otp.id} className="border-b last:border-0">
                            <td className="py-1">{otp.type}</td>
                            <td className="py-1">{otp.amount.toLocaleString()}</td>
                            <td className="py-1">{otp.currency}</td>
                            <td className="py-1">{otp.payment_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
