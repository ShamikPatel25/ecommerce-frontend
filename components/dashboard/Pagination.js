'use client';

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

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
  onPerPageChange,
  perPageOptions = [10, 50, 100],
}) {
  const showingText = totalItems === 0
    ? `No ${itemLabel}`
    : `Showing ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, totalItems)} of ${totalItems}`;

  const slots = getPageSlots(currentPage, totalPages);

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-700/50 flex flex-row items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {onPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
              <span className="hidden sm:inline">Rows per page:</span>
              <span className="sm:hidden">Rows:</span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-between gap-1 text-[11px] sm:text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded py-0.5 px-1.5 sm:py-1 sm:px-2 text-slate-700 dark:text-gray-300 focus:outline-none hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                <span>{perPage}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" sideOffset={4} className="min-w-[4.5rem] rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 z-[100]">
                {perPageOptions.map(size => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onPerPageChange(Number(size))}
                    className={`cursor-pointer text-[11px] sm:text-xs justify-center py-1.5 rounded-lg transition-colors ${
                      perPage === size 
                        ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 font-medium' 
                        : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <p className={`text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap ${onPerPageChange ? 'border-l border-slate-200 dark:border-gray-700 pl-2 sm:pl-4' : ''}`}>
          {showingText} <span className="hidden sm:inline">{itemLabel}</span>
        </p>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 sm:p-1.5 rounded border border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-400 dark:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        {slots.map((slot, idx) =>
          slot === '...' ? (
            <span key={`dots-${idx}`} className="w-6 sm:w-8 h-7 flex items-center justify-center text-slate-400 dark:text-gray-500 text-xs">...</span>
          ) : (
            <button
              key={slot}
              onClick={() => onPageChange(slot)}
              className={`w-7 sm:w-8 h-7 flex items-center justify-center rounded text-[11px] sm:text-xs font-medium transition-colors flex-shrink-0 ${
                slot === currentPage
                  ? 'bg-violet-500 text-white font-bold'
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
