'use client';

import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  open,
  title = 'Delete Value?',
  itemName = '',
  description = 'This action cannot be undone and will remove it from your storefront.',
  onCancel,
  onConfirm,
  confirmLabel = 'Mark for Deletion',
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body */}
        <div className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-700 dark:text-gray-300">&ldquo;{itemName}&rdquo;</span>?{' '}
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-gray-700/50 px-8 py-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
