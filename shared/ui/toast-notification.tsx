'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { motion } from 'motion/react';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  onDismiss: () => void;
}

const toastConfigs = {
  success: {
    icon: CheckCircle,
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    iconColor: 'text-emerald-500',
    badge: 'bg-emerald-500/10',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/20 dark:border-amber-500/30',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500/10',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500/20 dark:border-red-500/30',
    iconColor: 'text-red-500',
    badge: 'bg-red-500/10',
  },
  info: {
    icon: Info,
    border: 'border-indigo-500/20 dark:border-indigo-500/30',
    iconColor: 'text-indigo-500',
    badge: 'bg-indigo-500/10',
  },
};

export const ToastNotification: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onDismiss,
}) => {
  const config = toastConfigs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`
        flex items-start gap-3.5 p-4 w-full max-w-sm
        bg-white dark:bg-slate-900
        border ${config.border} rounded-2xl
        shadow-xl shadow-slate-200/40 dark:shadow-slate-950/60
      `}
    >
      <div className={`p-2 rounded-xl ${config.badge} ${config.iconColor} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 pt-0.5">
        <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
          {title}
        </h5>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
          {message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
        aria-label="Fechar notificacao"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
