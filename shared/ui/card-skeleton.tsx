import React from 'react';

interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
}) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse">
      {showAvatar && (
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 mb-4" />
      )}
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${
            i === lines - 1 ? 'w-1/2' : 'w-3/4'
          } ${i > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </div>
  );
};
