'use client';

import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  /** Icon from lucide-react (default: Inbox) */
  icon?: LucideIcon;
  /** Main title (required) */
  title: string;
  /** Descriptive subtitle (required) */
  description: string;
  /** Optional action button (pass a React node) */
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-sm mx-auto text-center py-12 px-4"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
        <Icon className="w-8 h-8" />
      </div>

      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
        {title}
      </h4>

      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
};
