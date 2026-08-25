import React from 'react';
import { ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const getStatusConfig = (status: ApplicationStatus) => {
  switch (status) {
    case 'Wishlist':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'Applied':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/80 dark:shadow-[0_0_8px_rgba(6,182,212,0.15)]',
        dot: 'bg-cyan-500 shadow-[0_0_6px_#00f0ff]',
      };
    case 'Screening':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/80',
        dot: 'bg-indigo-500 shadow-[0_0_6px_#6366f1]',
      };
    case 'Interview':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/80 dark:shadow-[0_0_8px_rgba(245,158,11,0.2)]',
        dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse',
      };
    case 'Technical Test':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/80 dark:shadow-[0_0_8px_rgba(168,85,247,0.2)]',
        dot: 'bg-purple-400 shadow-[0_0_6px_#a855f7]',
      };
    case 'HR Interview':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/50',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800/80',
        dot: 'bg-orange-400 shadow-[0_0_6px_#fb923c]',
      };
    case 'Offer':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-300 dark:border-emerald-700 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse',
      };
    case 'Accepted':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/60',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-300 dark:border-teal-700 dark:shadow-[0_0_10px_rgba(20,184,166,0.3)]',
        dot: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]',
      };
    case 'Rejected':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-900',
        dot: 'bg-rose-500 shadow-[0_0_6px_#f43f5e]',
      };
    case 'Withdrawn':
      return {
        bg: 'bg-zinc-100 dark:bg-zinc-800/80',
        text: 'text-zinc-700 dark:text-zinc-300',
        border: 'border-zinc-300 dark:border-zinc-700',
        dot: 'bg-zinc-400',
      };
    case 'Expired':
      return {
        bg: 'bg-amber-100/60 dark:bg-amber-950/40',
        text: 'text-amber-800 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-800/80',
        dot: 'bg-amber-600',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-400',
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1.5',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-2',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      id={`status-badge-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${config.dot} ${dotSize[size]}`} />
      <span>{status}</span>
    </span>
  );
};
