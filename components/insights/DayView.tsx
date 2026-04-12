'use client';

import { useState, useCallback } from 'react';
import { DayHeader } from './DayHeader';
import { JournalSummary } from './JournalSummary';
import { LogSummary } from './LogSummary';
import { AlertStack } from './AlertStack';
import { Card } from '@/components/ui';
import type { DayComposite, InsightAlert } from '@/lib/insights/types';

interface DayViewProps {
  initialDate: string;
  initialComposite: DayComposite | null;
  alerts: InsightAlert[];
  loggingConsistency: string;
  onDismissAlert: (id: string) => void;
}

export function DayView({ initialDate, initialComposite, alerts, loggingConsistency, onDismissAlert }: DayViewProps) {
  const [date, setDate] = useState(initialDate);
  const [composite, setComposite] = useState(initialComposite);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const navigate = useCallback(async (newDate: string) => {
    setDate(newDate);
    setLoading(true);
    try {
      const res = await fetch(`/api/insights/day?date=${newDate}`);
      if (res.ok) setComposite(await res.json());
      else setComposite(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const prevDay = () => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    navigate(d.toISOString().split('T')[0]);
  };

  const nextDay = () => {
    if (date >= today) return;
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    navigate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-3">
      {alerts.length > 0 && (
        <AlertStack alerts={alerts} onDismiss={onDismissAlert} />
      )}

      <DayHeader date={date} onPrevious={prevDay} onNext={nextDay} isToday={date === today} />

      {loading ? (
        <div className="py-12 text-center text-warm-400 animate-pulse">Loading...</div>
      ) : composite ? (
        <div className="space-y-3">
          {composite.hasJournal && (
            <Card className="p-3">
              <JournalSummary journal={composite.journal} />
            </Card>
          )}

          <Card className="p-3">
            <LogSummary composite={composite} />
          </Card>

          <div className="flex items-center justify-between px-1 text-xs text-warm-400">
            <span>{composite.entryCount} entries</span>
            {loggingConsistency && <span>{loggingConsistency}</span>}
          </div>
        </div>
      ) : (
        <Card className="p-6 text-center text-warm-400">
          <p>No data for this day.</p>
        </Card>
      )}
    </div>
  );
}
