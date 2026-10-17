import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'items',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * itemsPerPage);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 shadow-2xs select-none ${className}`}
    >
      {/* Items count summary and page size selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="font-medium text-slate-600">
          Showing <span className="font-bold text-slate-900">{startItem}</span> to{' '}
          <span className="font-bold text-slate-900">{endItem}</span> of{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> {itemName}
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-500 hidden md:inline">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onItemsPerPageChange(newSize);
                onPageChange(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C93B2B]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-slate-600"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-slate-700 font-semibold flex items-center gap-1"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline text-xs">Prev</span>
          </button>

          {/* Page numbers (tablet/desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">
                    …
                  </span>
                );
              }
              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-[#C93B2B] text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Mobile Current Page Indicator */}
          <span className="sm:hidden px-2 text-xs font-bold text-slate-700">
            {safeCurrentPage} / {totalPages}
          </span>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-slate-700 font-semibold flex items-center gap-1"
            title="Next page"
          >
            <span className="hidden xs:inline text-xs">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-slate-600"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
