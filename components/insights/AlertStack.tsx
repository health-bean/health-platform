'use client';

import { AlertCard } from './AlertCard';
import type { InsightAlert } from '@/lib/insights/types';

interface AlertStackProps {
  alerts: InsightAlert[];
  onDismiss: (id: string) => void;
}

export function AlertStack({ alerts, onDismiss }: AlertStackProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
