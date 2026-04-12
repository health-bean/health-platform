'use client';

import { X, Sparkles } from 'lucide-react';
import type { InsightAlert } from '@/lib/insights/types';

interface AlertCardProps {
  alert: InsightAlert;
  onDismiss: (id: string) => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50 ring-1 ring-inset ring-teal-200/60">
      <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-teal-900">{alert.title}</p>
        <p className="text-xs text-teal-700 mt-0.5">{alert.body}</p>
      </div>
      <button onClick={() => onDismiss(alert.id)} className="p-1 rounded hover:bg-teal-100" aria-label="Dismiss">
        <X className="w-3.5 h-3.5 text-teal-400" />
      </button>
    </div>
  );
}
