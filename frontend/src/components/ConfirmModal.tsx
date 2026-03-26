import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 mt-2 text-sm">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{t('common.delete')}</button>
        </div>
      </div>
    </div>
  );
}
