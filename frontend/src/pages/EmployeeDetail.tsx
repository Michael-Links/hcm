import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

interface Position {
  id: number;
  title: string;
  code: string;
}

interface HistoryEvent {
  id: number;
  event_type: string;
  effective_date: string;
  description: string | null;
  old_status: string | null;
  new_status: string | null;
  reason: string | null;
}

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
  currency?: string;
  notes?: string;
  recurring_payments: RecurringPayment[];
  one_time_payments: OneTimePayment[];
}

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

interface DocumentItem {
  id: number;
  employee_id: number;
  name: string;
  doc_type: string;
  file_path: string;
  uploaded_by: number | null;
  uploaded_at: string | null;
}

const emptyContact = { name: '', relationship: '', phone: '', email: '' };
const emptyDependent = { name: '', relationship: '', date_of_birth: '', gender: '' };
const emptyRecurring = { type: 'SALARY', amount: 0, currency: 'USD', frequency: 'MONTHLY' };
const emptyOnetime = { type: 'BONUS', amount: 0, currency: 'USD', payment_date: '' };

export default function EmployeeDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { role } = useAuth();
  const [emp, setEmp] = useState<any>(null);
  const [comp, setComp] = useState<CompensationPackage[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [empContacts, setEmpContacts] = useState<EmergencyContact[]>([]);
  const [empDependents, setEmpDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state (personal info)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ first_name: string; last_name: string; email: string; phone: string; gender: string; city: string; country: string }>({ first_name: '', last_name: '', email: '', phone: '', gender: '', city: '', country: '' });
  const [editPositionId, setEditPositionId] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  // Modal state (terminate/transfer/promote)
  const [modal, setModal] = useState<'terminate' | 'transfer' | 'promote' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Confirm delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Compensation CRUD state
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [pkgForm, setPkgForm] = useState({ effective_date: '', currency: '', notes: '' });
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(null);
  const [editingRecurringPkgId, setEditingRecurringPkgId] = useState<number | null>(null);
  const [recurringForm, setRecurringForm] = useState(emptyRecurring);
  const [addRecurringPkgId, setAddRecurringPkgId] = useState<number | null>(null);
  const [editingOnetimeId, setEditingOnetimeId] = useState<number | null>(null);
  const [editingOnetimePkgId, setEditingOnetimePkgId] = useState<number | null>(null);
  const [onetimeForm, setOnetimeForm] = useState(emptyOnetime);
  const [addOnetimePkgId, setAddOnetimePkgId] = useState<number | null>(null);

  // Leave balances state
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [adjustingLeaveId, setAdjustingLeaveId] = useState<number | null>(null);
  const [adjustForm, setAdjustForm] = useState({ adjustment: 0, reason: '' });

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', doc_type: 'OTHER' as string });

  // HR contacts/dependents CRUD state
  const [contactForm, setContactForm] = useState(emptyContact);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [depForm, setDepForm] = useState(emptyDependent);
  const [editingDepId, setEditingDepId] = useState<number | null>(null);
  const [showDepForm, setShowDepForm] = useState(false);

  const isHR = role === 'HR';

  // --- Confirm helpers ---
  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  // --- Personal info edit ---
  const startEditing = () => {
    const pi = emp?.personal_info;
    setEditForm({
      first_name: pi?.first_name || '',
      last_name: pi?.last_name || '',
      email: pi?.email || '',
      phone: pi?.phone || '',
      gender: pi?.gender || '',
      city: pi?.city || '',
      country: pi?.country || '',
    });
    setEditPositionId(emp?.position_id || null);
    setIsEditing(true);
    setSaveMsg('');
  };

  const handleSaveEdit = async () => {
    setSaveMsg('');
    try {
      const body: any = { personal_info: editForm };
      if (editPositionId !== null && editPositionId !== emp?.position_id) {
        body.position_id = editPositionId;
      }
      await api.put(`/api/employees/${id}`, body);
      setIsEditing(false);
      setSaveMsg(t('employeeDetail.savedSuccessfully'));
      setLoading(true);
      loadEmployee();
    } catch (err: any) {
      setSaveMsg(err.response?.data?.detail || t('employeeDetail.errorSaving'));
    }
  };

  // --- Data loading ---
  const loadEmployee = () => {
    if (!id) return;
    Promise.all([
      api.get(`/api/employees/${id}`),
      api.get(`/api/employees/${id}/compensation`),
      api.get(`/api/employees/${id}/history`),
      api.get(`/api/employees/${id}/emergency-contacts`).catch(() => ({ data: [] })),
      api.get(`/api/employees/${id}/dependents`).catch(() => ({ data: [] })),
    ])
      .then(([eRes, cRes, hRes, ecRes, dRes]) => {
        setEmp(eRes.data);
        setComp(cRes.data);
        setHistory(hRes.data);
        setEmpContacts(ecRes.data);
        setEmpDependents(dRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadLeaveBalances = useCallback(() => {
    if (!id) return;
    api.get(`/api/employees/${id}/leave-balances`).then(r => setLeaveBalances(r.data)).catch(() => {});
  }, [id]);

  const loadDocuments = useCallback(() => {
    if (!id) return;
    api.get(`/api/employees/${id}/documents`).then(r => setDocuments(r.data)).catch(() => {});
  }, [id]);

  const loadCompensation = useCallback(() => {
    if (!id) return;
    api.get(`/api/employees/${id}/compensation`).then(r => setComp(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    loadEmployee();
    loadLeaveBalances();
    loadDocuments();
  }, [id, loadLeaveBalances, loadDocuments]);

  // --- Compensation handlers ---
  const startEditPkg = (pkg: CompensationPackage) => {
    setPkgForm({ effective_date: pkg.effective_date, currency: pkg.currency || '', notes: pkg.notes || '' });
    setEditingPkgId(pkg.id);
  };

  const savePkg = async (pkgId: number) => {
    try {
      await api.put(`/api/employees/${id}/compensation/${pkgId}`, pkgForm);
      setEditingPkgId(null);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const startEditRecurring = (pkgId: number, rp: RecurringPayment) => {
    setRecurringForm({ type: rp.type, amount: rp.amount, currency: rp.currency, frequency: rp.frequency });
    setEditingRecurringId(rp.id);
    setEditingRecurringPkgId(pkgId);
  };

  const saveRecurring = async (pkgId: number, paymentId: number) => {
    try {
      await api.put(`/api/employees/${id}/compensation/${pkgId}/recurring/${paymentId}`, recurringForm);
      setEditingRecurringId(null);
      setEditingRecurringPkgId(null);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const deleteRecurring = async (pkgId: number, paymentId: number) => {
    try {
      await api.delete(`/api/employees/${id}/compensation/${pkgId}/recurring/${paymentId}`);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const addRecurring = async (pkgId: number) => {
    try {
      await api.post(`/api/employees/${id}/compensation/${pkgId}/recurring`, recurringForm);
      setAddRecurringPkgId(null);
      setRecurringForm(emptyRecurring);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const startEditOnetime = (pkgId: number, otp: OneTimePayment) => {
    setOnetimeForm({ type: otp.type, amount: otp.amount, currency: otp.currency, payment_date: otp.payment_date });
    setEditingOnetimeId(otp.id);
    setEditingOnetimePkgId(pkgId);
  };

  const saveOnetime = async (pkgId: number, paymentId: number) => {
    try {
      await api.put(`/api/employees/${id}/compensation/${pkgId}/onetime/${paymentId}`, onetimeForm);
      setEditingOnetimeId(null);
      setEditingOnetimePkgId(null);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const deleteOnetime = async (pkgId: number, paymentId: number) => {
    try {
      await api.delete(`/api/employees/${id}/compensation/${pkgId}/onetime/${paymentId}`);
      loadCompensation();
    } catch { /* ignore */ }
  };

  const addOnetime = async (pkgId: number) => {
    try {
      await api.post(`/api/employees/${id}/compensation/${pkgId}/onetime`, onetimeForm);
      setAddOnetimePkgId(null);
      setOnetimeForm(emptyOnetime);
      loadCompensation();
    } catch { /* ignore */ }
  };

  // --- Leave balance adjust ---
  const submitAdjust = async (leaveTypeId: number) => {
    if (!adjustForm.reason.trim()) return;
    try {
      await api.post(`/api/employees/${id}/leave-balances/adjust`, {
        leave_type_id: leaveTypeId,
        adjustment: adjustForm.adjustment,
        reason: adjustForm.reason,
      });
      setAdjustingLeaveId(null);
      setAdjustForm({ adjustment: 0, reason: '' });
      loadLeaveBalances();
    } catch { /* ignore */ }
  };

  // --- Document handlers ---
  const uploadDocument = async () => {
    if (!uploadForm.name.trim()) return;
    try {
      await api.post(`/api/employees/${id}/documents`, {
        name: uploadForm.name,
        doc_type: uploadForm.doc_type,
      });
      setShowUploadForm(false);
      setUploadForm({ name: '', doc_type: 'OTHER' });
      loadDocuments();
    } catch { /* ignore */ }
  };

  const deleteDocument = async (docId: number) => {
    try {
      await api.delete(`/api/documents/${docId}`);
      loadDocuments();
    } catch { /* ignore */ }
  };

  // --- Emergency Contact handlers (HR) ---
  const saveContact = async () => {
    try {
      if (editingContactId) {
        await api.put(`/api/employees/${id}/emergency-contacts/${editingContactId}`, contactForm);
      } else {
        await api.post(`/api/employees/${id}/emergency-contacts`, contactForm);
      }
      setShowContactForm(false);
      setEditingContactId(null);
      setContactForm(emptyContact);
      loadEmployee();
    } catch { /* ignore */ }
  };

  const editContact = (c: EmergencyContact) => {
    setContactForm({ name: c.name, relationship: c.relationship, phone: c.phone, email: c.email || '' });
    setEditingContactId(c.id);
    setShowContactForm(true);
  };

  const deleteContact = async (contactId: number) => {
    try {
      await api.delete(`/api/employees/${id}/emergency-contacts/${contactId}`);
      loadEmployee();
    } catch { /* ignore */ }
  };

  // --- Dependent handlers (HR) ---
  const saveDep = async () => {
    try {
      const payload = { ...depForm, date_of_birth: depForm.date_of_birth || null, gender: depForm.gender || null };
      if (editingDepId) {
        await api.put(`/api/employees/${id}/dependents/${editingDepId}`, payload);
      } else {
        await api.post(`/api/employees/${id}/dependents`, payload);
      }
      setShowDepForm(false);
      setEditingDepId(null);
      setDepForm(emptyDependent);
      loadEmployee();
    } catch { /* ignore */ }
  };

  const editDep = (d: Dependent) => {
    setDepForm({ name: d.name, relationship: d.relationship, date_of_birth: d.date_of_birth || '', gender: d.gender || '' });
    setEditingDepId(d.id);
    setShowDepForm(true);
  };

  const deleteDep = async (depId: number) => {
    try {
      await api.delete(`/api/employees/${id}/dependents/${depId}`);
      loadEmployee();
    } catch { /* ignore */ }
  };

  // --- Action modal (terminate/transfer/promote) ---
  const openModal = (type: 'terminate' | 'transfer' | 'promote') => {
    setModal(type);
    setFormData({ effective_date: new Date().toISOString().split('T')[0], reason: '' });
    setError('');
    if (type === 'transfer' || type === 'promote') {
      api.get('/api/org/positions').then(res => setPositions(res.data)).catch(() => {});
    }
  };

  const closeModal = () => { setModal(null); setFormData({}); setError(''); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (modal === 'terminate') {
        await api.post(`/api/employees/${id}/status-change`, {
          new_status: 'TERMINATED',
          reason: formData.reason,
          effective_date: formData.effective_date,
        });
      } else if (modal === 'transfer') {
        await api.post(`/api/employees/${id}/transfer`, {
          new_position_id: Number(formData.new_position_id),
          reason: formData.reason,
          effective_date: formData.effective_date,
        });
      } else if (modal === 'promote') {
        await api.post(`/api/employees/${id}/promote`, {
          new_position_id: Number(formData.new_position_id),
          new_salary: formData.new_salary ? Number(formData.new_salary) : null,
          reason: formData.reason,
          effective_date: formData.effective_date,
        });
      }
      closeModal();
      loadEmployee();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('employeeDetail.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">{t('common.loading')}</div>;
  if (!emp) return <div className="text-gray-500">{t('employeeDetail.employeeNotFound')}</div>;

  const pi = emp.personal_info;
  const paymentTypeLabel = (type: string) => t(`employeeDetail.paymentType.${type}`, { defaultValue: type });
  const frequencyLabel = (frequency: string) => t(`employeeDetail.frequencyLabel.${frequency}`, { defaultValue: frequency });
  const eventTypeLabel = (type: string) => t(`employeeDetail.eventType.${type}`, { defaultValue: type });
  const documentTypeLabel = (type: string) => t(`employeeDetail.documentType.${type}`, { defaultValue: type });

  const eventBadge = (type: string) => {
    const colors: Record<string, string> = {
      HIRE: 'bg-green-100 text-green-800',
      TRANSFER: 'bg-blue-100 text-blue-800',
      PROMOTE: 'bg-purple-100 text-purple-800',
      STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
      TERMINATE: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <Link to="/employees" className="text-primary-600 hover:underline text-sm mb-4 inline-block">← {t('employeeDetail.backToEmployees')}</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{pi?.first_name} {pi?.last_name}</h1>
        <div className="flex gap-2">
          {isHR && !isEditing && (
            <button onClick={startEditing} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('employeeDetail.editEmployee')}</button>
          )}
          {isHR && emp.status !== 'TERMINATED' && (
            <>
              <button onClick={() => openModal('transfer')} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('employeeDetail.transfer')}</button>
              <button onClick={() => openModal('promote')} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">{t('employeeDetail.promote')}</button>
              <button onClick={() => openModal('terminate')} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{t('employeeDetail.terminate')}</button>
            </>
          )}
        </div>
      </div>
      {saveMsg && <p className={`mb-4 text-sm ${saveMsg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</p>}

      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">{t('employeeDetail.editEmployee')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('onboard.firstName')}</label>
              <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('onboard.lastName')}</label>
              <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.email')}</label>
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.phone')}</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.gender')}</label>
              <input value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.city')}</label>
              <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.country')}</label>
              <input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('common.position')} ID</label>
              <input type="number" value={editPositionId || ''} onChange={(e) => setEditPositionId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.save')}</button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">{t('employeeDetail.employeeInfo')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.employeeNumber')}</dt><dd>{emp.employee_number}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.status')}</dt><dd>{t(`common.statusLabel.${emp.status}`, { defaultValue: emp.status })}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.hireDate')}</dt><dd>{emp.hire_date}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">{t('employeeDetail.personalInfo')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.email')}</dt><dd>{pi?.email || t('common.notAvailable')}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.phone')}</dt><dd>{pi?.phone || t('common.notAvailable')}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.gender')}</dt><dd>{pi?.gender || t('common.notAvailable')}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.city')}</dt><dd>{pi?.city || t('common.notAvailable')}</dd></div>
            <div className="flex"><dt className="w-40 text-gray-500">{t('common.country')}</dt><dd>{pi?.country || t('common.notAvailable')}</dd></div>
          </dl>
        </div>
      </div>
      )}

      {/* Compensation */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">{t('profile.compensation')}</h2>
        {comp.length === 0 ? (
          <p className="text-sm text-gray-400">{t('profile.noCompensation')}</p>
        ) : (
          comp.map((pkg) => (
            <div key={pkg.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
              {/* Package header */}
              {editingPkgId === pkg.id ? (
                <div className="mb-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('common.effectiveDate')}</label>
                      <input type="date" value={pkgForm.effective_date} onChange={e => setPkgForm({ ...pkgForm, effective_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('common.currency')}</label>
                      <input value={pkgForm.currency} onChange={e => setPkgForm({ ...pkgForm, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('common.notes')}</label>
                      <input value={pkgForm.notes} onChange={e => setPkgForm({ ...pkgForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => savePkg(pkg.id)} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.save')}</button>
                    <button onClick={() => setEditingPkgId(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">{pkg.name} <span className="text-xs text-gray-400">{t('profile.effective', { date: pkg.effective_date })}</span></h3>
                  {isHR && <button onClick={() => startEditPkg(pkg)} className="text-primary-600 hover:underline text-xs">{t('common.edit')}</button>}
                </div>
              )}

              {/* Recurring Payments */}
              {(pkg.recurring_payments?.length > 0 || isHR) && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">{t('profile.recurringPayments')}</h4>
                  {pkg.recurring_payments?.length > 0 && (
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-gray-500 border-b">
                        <th className="pb-1">{t('common.type')}</th><th className="pb-1">{t('common.amount')}</th><th className="pb-1">{t('common.currency')}</th><th className="pb-1">{t('common.frequency')}</th>
                        {isHR && <th className="pb-1"></th>}
                      </tr></thead>
                      <tbody>
                        {pkg.recurring_payments.map((rp) => (
                          editingRecurringId === rp.id && editingRecurringPkgId === pkg.id ? (
                            <tr key={rp.id} className="border-b last:border-0">
                              <td className="py-1">
                                <select value={recurringForm.type} onChange={e => setRecurringForm({ ...recurringForm, type: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                  <option value="SALARY">{paymentTypeLabel('SALARY')}</option><option value="ALLOWANCE">{paymentTypeLabel('ALLOWANCE')}</option><option value="DEDUCTION">{paymentTypeLabel('DEDUCTION')}</option>
                                </select>
                              </td>
                              <td className="py-1">
                                <input type="number" value={recurringForm.amount} onChange={e => setRecurringForm({ ...recurringForm, amount: Number(e.target.value) })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                              </td>
                              <td className="py-1">
                                <input value={recurringForm.currency} onChange={e => setRecurringForm({ ...recurringForm, currency: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                              </td>
                              <td className="py-1">
                                <select value={recurringForm.frequency} onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                  <option value="MONTHLY">{frequencyLabel('MONTHLY')}</option><option value="BIWEEKLY">{frequencyLabel('BIWEEKLY')}</option><option value="WEEKLY">{frequencyLabel('WEEKLY')}</option><option value="ANNUAL">{frequencyLabel('ANNUAL')}</option>
                                </select>
                              </td>
                              <td className="py-1 text-right space-x-1">
                                <button onClick={() => saveRecurring(pkg.id, rp.id)} className="text-primary-600 hover:underline text-xs">{t('common.save')}</button>
                                <button onClick={() => { setEditingRecurringId(null); setEditingRecurringPkgId(null); }} className="text-gray-500 hover:underline text-xs">{t('common.cancel')}</button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={rp.id} className="border-b last:border-0">
                               <td className="py-1">{paymentTypeLabel(rp.type)}</td>
                              <td className="py-1">{rp.amount.toLocaleString()}</td>
                              <td className="py-1">{rp.currency}</td>
                               <td className="py-1">{frequencyLabel(rp.frequency)}</td>
                              {isHR && (
                                <td className="py-1 text-right space-x-2">
                                  <button onClick={() => startEditRecurring(pkg.id, rp)} className="text-primary-600 hover:underline text-xs">{t('common.edit')}</button>
                                  <button onClick={() => openConfirm(t('common.delete'), t('employeeDetail.recurringPaymentDeleteMessage', { type: paymentTypeLabel(rp.type), currency: rp.currency, amount: rp.amount.toLocaleString() }), () => deleteRecurring(pkg.id, rp.id))} className="text-red-600 hover:underline text-xs">{t('common.delete')}</button>
                                </td>
                              )}
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  )}
                  {/* Add Recurring form */}
                  {isHR && addRecurringPkgId === pkg.id && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <select value={recurringForm.type} onChange={e => setRecurringForm({ ...recurringForm, type: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
                          <option value="SALARY">{paymentTypeLabel('SALARY')}</option><option value="ALLOWANCE">{paymentTypeLabel('ALLOWANCE')}</option><option value="DEDUCTION">{paymentTypeLabel('DEDUCTION')}</option>
                        </select>
                        <input type="number" placeholder={t('common.amount')} value={recurringForm.amount || ''} onChange={e => setRecurringForm({ ...recurringForm, amount: Number(e.target.value) })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder={t('common.currency')} value={recurringForm.currency} onChange={e => setRecurringForm({ ...recurringForm, currency: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                        <select value={recurringForm.frequency} onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
                          <option value="MONTHLY">{frequencyLabel('MONTHLY')}</option><option value="BIWEEKLY">{frequencyLabel('BIWEEKLY')}</option><option value="WEEKLY">{frequencyLabel('WEEKLY')}</option><option value="ANNUAL">{frequencyLabel('ANNUAL')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addRecurring(pkg.id)} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.save')}</button>
                        <button onClick={() => { setAddRecurringPkgId(null); setRecurringForm(emptyRecurring); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                      </div>
                    </div>
                  )}
                  {isHR && addRecurringPkgId !== pkg.id && (
                      <button onClick={() => { setRecurringForm(emptyRecurring); setAddRecurringPkgId(pkg.id); }}
                        className="mt-2 text-xs text-primary-600 hover:underline">+ {t('employeeDetail.addRecurringPayment')}</button>
                  )}
                </div>
              )}

              {/* One-Time Payments */}
              {(pkg.one_time_payments?.length > 0 || isHR) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">{t('profile.oneTimePayments')}</h4>
                  {pkg.one_time_payments?.length > 0 && (
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-gray-500 border-b">
                        <th className="pb-1">{t('common.type')}</th><th className="pb-1">{t('common.amount')}</th><th className="pb-1">{t('common.currency')}</th><th className="pb-1">{t('common.date')}</th>
                        {isHR && <th className="pb-1"></th>}
                      </tr></thead>
                      <tbody>
                        {pkg.one_time_payments.map((otp) => (
                          editingOnetimeId === otp.id && editingOnetimePkgId === pkg.id ? (
                            <tr key={otp.id} className="border-b last:border-0">
                              <td className="py-1">
                                <select value={onetimeForm.type} onChange={e => setOnetimeForm({ ...onetimeForm, type: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                  <option value="BONUS">{paymentTypeLabel('BONUS')}</option><option value="REIMBURSEMENT">{paymentTypeLabel('REIMBURSEMENT')}</option>
                                </select>
                              </td>
                              <td className="py-1">
                                <input type="number" value={onetimeForm.amount} onChange={e => setOnetimeForm({ ...onetimeForm, amount: Number(e.target.value) })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                              </td>
                              <td className="py-1">
                                <input value={onetimeForm.currency} onChange={e => setOnetimeForm({ ...onetimeForm, currency: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                              </td>
                              <td className="py-1">
                                <input type="date" value={onetimeForm.payment_date} onChange={e => setOnetimeForm({ ...onetimeForm, payment_date: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                              </td>
                              <td className="py-1 text-right space-x-1">
                                <button onClick={() => saveOnetime(pkg.id, otp.id)} className="text-primary-600 hover:underline text-xs">{t('common.save')}</button>
                                <button onClick={() => { setEditingOnetimeId(null); setEditingOnetimePkgId(null); }} className="text-gray-500 hover:underline text-xs">{t('common.cancel')}</button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={otp.id} className="border-b last:border-0">
                               <td className="py-1">{paymentTypeLabel(otp.type)}</td>
                              <td className="py-1">{otp.amount.toLocaleString()}</td>
                              <td className="py-1">{otp.currency}</td>
                              <td className="py-1">{otp.payment_date}</td>
                              {isHR && (
                                <td className="py-1 text-right space-x-2">
                                  <button onClick={() => startEditOnetime(pkg.id, otp)} className="text-primary-600 hover:underline text-xs">{t('common.edit')}</button>
                                  <button onClick={() => openConfirm(t('common.delete'), t('employeeDetail.oneTimePaymentDeleteMessage', { type: paymentTypeLabel(otp.type), currency: otp.currency, amount: otp.amount.toLocaleString() }), () => deleteOnetime(pkg.id, otp.id))} className="text-red-600 hover:underline text-xs">{t('common.delete')}</button>
                                </td>
                              )}
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  )}
                  {/* Add One-Time form */}
                  {isHR && addOnetimePkgId === pkg.id && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <select value={onetimeForm.type} onChange={e => setOnetimeForm({ ...onetimeForm, type: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
                          <option value="BONUS">{paymentTypeLabel('BONUS')}</option><option value="REIMBURSEMENT">{paymentTypeLabel('REIMBURSEMENT')}</option>
                        </select>
                        <input type="number" placeholder={t('common.amount')} value={onetimeForm.amount || ''} onChange={e => setOnetimeForm({ ...onetimeForm, amount: Number(e.target.value) })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder={t('common.currency')} value={onetimeForm.currency} onChange={e => setOnetimeForm({ ...onetimeForm, currency: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                        <input type="date" value={onetimeForm.payment_date} onChange={e => setOnetimeForm({ ...onetimeForm, payment_date: e.target.value })}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addOnetime(pkg.id)} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('common.save')}</button>
                        <button onClick={() => { setAddOnetimePkgId(null); setOnetimeForm(emptyOnetime); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                      </div>
                    </div>
                  )}
                  {isHR && addOnetimePkgId !== pkg.id && (
                      <button onClick={() => { setOnetimeForm(emptyOnetime); setAddOnetimePkgId(pkg.id); }}
                        className="mt-2 text-xs text-primary-600 hover:underline">+ {t('employeeDetail.addOneTimePayment')}</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Leave Balances */}
      {isHR && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">{t('employeeDetail.leaveBalances')}</h2>
          {leaveBalances.length === 0 ? (
            <p className="text-sm text-gray-400">{t('employeeDetail.noLeaveBalances')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="pb-2">{t('leaveAdmin.leaveTypes')}</th><th className="pb-2">{t('leave.entitled')}</th><th className="pb-2">{t('leave.used')}</th><th className="pb-2">{t('leave.pending')}</th><th className="pb-2">{t('common.balance')}</th><th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {leaveBalances.map((lb) => (
                  <tr key={lb.id} className="border-b last:border-0">
                    <td className="py-2">{lb.leave_type_name}</td>
                    <td className="py-2">{lb.entitled}</td>
                    <td className="py-2">{lb.used}</td>
                    <td className="py-2">{lb.pending}</td>
                    <td className="py-2 font-medium">{lb.balance}</td>
                    <td className="py-2 text-right">
                      {adjustingLeaveId === lb.leave_type_id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input type="number" placeholder="±days" value={adjustForm.adjustment || ''} onChange={e => setAdjustForm({ ...adjustForm, adjustment: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <input placeholder={t('employeeDetail.reasonRequired')} value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                            className="w-40 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <button onClick={() => submitAdjust(lb.leave_type_id)} className="text-primary-600 hover:underline text-xs">{t('common.save')}</button>
                          <button onClick={() => { setAdjustingLeaveId(null); setAdjustForm({ adjustment: 0, reason: '' }); }} className="text-gray-500 hover:underline text-xs">{t('common.cancel')}</button>
                        </div>
                      ) : (
                        <button onClick={() => { setAdjustingLeaveId(lb.leave_type_id); setAdjustForm({ adjustment: 0, reason: '' }); }}
                          className="text-primary-600 hover:underline text-xs">{t('employeeDetail.adjust')}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Documents */}
      {isHR && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">{t('employeeDetail.documents')}</h2>
            {!showUploadForm && (
              <button onClick={() => { setUploadForm({ name: '', doc_type: 'OTHER' }); setShowUploadForm(true); }}
                className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('employeeDetail.upload')}</button>
            )}
          </div>
          {showUploadForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder={t('employeeDetail.documentName')} value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={uploadForm.doc_type} onChange={e => setUploadForm({ ...uploadForm, doc_type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="CONTRACT">{t('employeeDetail.contract')}</option>
                  <option value="ID">{t('employeeDetail.idDocument')}</option>
                  <option value="CERTIFICATE">{t('employeeDetail.certificate')}</option>
                  <option value="OTHER">{t('employeeDetail.other')}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={uploadDocument} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">{t('employeeDetail.upload')}</button>
                <button onClick={() => setShowUploadForm(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
              </div>
            </div>
          )}
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">{t('employeeDetail.noDocuments')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="pb-2">{t('common.name')}</th><th className="pb-2">{t('employeeDetail.category')}</th><th className="pb-2">{t('employeeDetail.uploaded')}</th><th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0">
                    <td className="py-2">{doc.name}</td>
                    <td className="py-2">{documentTypeLabel(doc.doc_type)}</td>
                    <td className="py-2">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString(i18n.language) : t('common.notAvailable')}</td>
                    <td className="py-2 text-right space-x-2">
                      {doc.file_path && (
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">{t('employeeDetail.download')}</a>
                      )}
                      <button onClick={() => openConfirm(t('common.delete'), `${t('common.delete')} "${doc.name}"?`, () => deleteDocument(doc.id))} className="text-red-600 hover:underline text-xs">{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">{t('profile.emergencyContacts')}</h2>
          {isHR && !showContactForm && (
            <button onClick={() => { setContactForm(emptyContact); setEditingContactId(null); setShowContactForm(true); }}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('profile.addContact')}</button>
          )}
        </div>
        {isHR && showContactForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <input placeholder={t('common.name')} value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
               <input placeholder={t('common.relationship')} value={contactForm.relationship} onChange={e => setContactForm({ ...contactForm, relationship: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
               <input placeholder={t('common.phone')} value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
               <input placeholder={t('profile.optionalEmail')} value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveContact} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                {editingContactId ? t('common.update') : t('common.save')}
              </button>
              <button onClick={() => { setShowContactForm(false); setEditingContactId(null); }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        )}
        {empContacts.length === 0 ? (
          <p className="text-sm text-gray-400">{t('employeeDetail.noEmergencyContacts')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">{t('common.name')}</th><th className="pb-2">{t('common.relationship')}</th><th className="pb-2">{t('common.phone')}</th><th className="pb-2">{t('common.email')}</th>
              {isHR && <th className="pb-2"></th>}
            </tr></thead>
            <tbody>
              {empContacts.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.relationship}</td>
                  <td className="py-2">{c.phone}</td>
                  <td className="py-2">{c.email || t('common.notAvailable')}</td>
                  {isHR && (
                    <td className="py-2 text-right space-x-2">
                      <button onClick={() => editContact(c)} className="text-primary-600 hover:underline text-xs">{t('common.edit')}</button>
                      <button onClick={() => openConfirm(t('common.delete'), `${t('common.delete')} "${c.name}"?`, () => deleteContact(c.id))} className="text-red-600 hover:underline text-xs">{t('common.delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dependents */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">{t('profile.dependents')}</h2>
          {isHR && !showDepForm && (
            <button onClick={() => { setDepForm(emptyDependent); setEditingDepId(null); setShowDepForm(true); }}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('profile.addDependent')}</button>
          )}
        </div>
        {isHR && showDepForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder={t('common.name')} value={depForm.name} onChange={e => setDepForm({ ...depForm, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder={t('common.relationship')} value={depForm.relationship} onChange={e => setDepForm({ ...depForm, relationship: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input type="date" placeholder={t('common.dateOfBirth')} value={depForm.date_of_birth} onChange={e => setDepForm({ ...depForm, date_of_birth: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder={t('profile.optionalGender')} value={depForm.gender} onChange={e => setDepForm({ ...depForm, gender: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveDep} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                {editingDepId ? t('common.update') : t('common.save')}
              </button>
              <button onClick={() => { setShowDepForm(false); setEditingDepId(null); }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        )}
        {empDependents.length === 0 ? (
          <p className="text-sm text-gray-400">{t('employeeDetail.noDependents')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">{t('common.name')}</th><th className="pb-2">{t('common.relationship')}</th><th className="pb-2">{t('common.dateOfBirth')}</th><th className="pb-2">{t('common.gender')}</th>
              {isHR && <th className="pb-2"></th>}
            </tr></thead>
            <tbody>
              {empDependents.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2">{d.relationship}</td>
                  <td className="py-2">{d.date_of_birth || t('common.notAvailable')}</td>
                  <td className="py-2">{d.gender || t('common.notAvailable')}</td>
                  {isHR && (
                    <td className="py-2 text-right space-x-2">
                      <button onClick={() => editDep(d)} className="text-primary-600 hover:underline text-xs">{t('common.edit')}</button>
                      <button onClick={() => openConfirm(t('common.delete'), `${t('common.delete')} "${d.name}"?`, () => deleteDep(d.id))} className="text-red-600 hover:underline text-xs">{t('common.delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Employment History */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">{t('employeeDetail.employmentHistory')}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">{t('employeeDetail.noHistory')}</p>
        ) : (
          <div className="space-y-3">
            {history.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${eventBadge(evt.event_type)}`}>{eventTypeLabel(evt.event_type)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{evt.description}</p>
                  {evt.reason && <p className="text-xs text-gray-500 mt-0.5">{t('common.reason')}: {evt.reason}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{evt.effective_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => { confirmAction(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Action Modal (terminate/transfer/promote) */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {modal === 'terminate' ? t('employeeDetail.terminateEmployee') : modal === 'transfer' ? t('employeeDetail.transferEmployee') : t('employeeDetail.promoteEmployee')}
            </h2>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            {(modal === 'transfer' || modal === 'promote') && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('employeeDetail.newPosition')}</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.new_position_id || ''} onChange={e => setFormData({ ...formData, new_position_id: e.target.value })}>
                  <option value="">{t('employeeDetail.selectPosition')}</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title} ({p.code})</option>)}
                </select>
              </div>
            )}

            {modal === 'promote' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('employeeDetail.newSalaryOptional')}</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.new_salary || ''} onChange={e => setFormData({ ...formData, new_salary: e.target.value })} placeholder="e.g. 120000" />
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.reason')}</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.effectiveDate')}</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.effective_date || ''} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{t('common.cancel')}</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {submitting ? t('employeeDetail.processing') : t('employeeDetail.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
