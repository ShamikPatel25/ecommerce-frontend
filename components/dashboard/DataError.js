'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DataError({ message = 'Failed to load data', onRetry, retrying = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{message}</p>
      <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 text-center max-w-xs">
        Check your connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
}
