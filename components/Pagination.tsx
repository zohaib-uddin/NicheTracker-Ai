
import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // How many numbers to show around current
        
        if (totalPages <= 7) {
            // Show all if few pages
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Complex logic for ellipses
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-12 mb-8 animate-in fade-in">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Prev
            </button>

            <div className="flex items-center gap-2">
                {getPageNumbers().map((page, idx) => (
                    <React.Fragment key={idx}>
                        {page === '...' ? (
                            <span className="text-muted text-sm px-2">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                    currentPage === page
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                                        : 'bg-surface border border-border text-muted hover:text-foreground hover:border-primary/50'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Next
            </button>
        </div>
    );
};
