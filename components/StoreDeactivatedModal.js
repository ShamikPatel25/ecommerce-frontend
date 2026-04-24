'use client';

import { AlertTriangle } from 'lucide-react';

export default function StoreDeactivatedModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Store Deactivated</h3>
          <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed">
            This store has been deactivated. Please activate it first to access its data.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-gray-700/50 px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
