'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageSlots(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage, '...', totalPages];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  perPage = 10,
  itemLabel = 'items',
}) {
  const showingText = totalItems === 0
    ? `No ${itemLabel}`
    : `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, totalItems)} of ${totalItems} ${itemLabel}`;

  const slots = getPageSlots(currentPage, totalPages);

  return (
    <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-700/50 flex items-center justify-between">
      <p className="text-xs text-slate-500 dark:text-gray-400">
        {showingText}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded border border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-400 dark:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        {slots.map((slot, idx) =>
          slot === '...' ? (
            <span key={`dots-${idx}`} className="w-8 h-7 flex items-center justify-center text-slate-400 dark:text-gray-500 text-xs">...</span>
          ) : (
            <button
              key={slot}
              onClick={() => onPageChange(slot)}
              className={`w-8 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                slot === currentPage
                  ? 'bg-orange-500 text-white font-bold'
                  : 'hover:bg-white dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300'
              }`}
            >
              {slot}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded border border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-400 dark:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
