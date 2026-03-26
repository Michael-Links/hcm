import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.passwordLength'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(t('auth.passwordChanged'));
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{t('auth.changePassword')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmNewPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{t('common.cancel')}</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? t('auth.changingPassword') : t('auth.changePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
