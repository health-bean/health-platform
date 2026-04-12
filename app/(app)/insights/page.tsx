'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayView } from '@/components/insights/DayView';
import { AllPatterns } from '@/components/insights/AllPatterns';
import { Spinner } from '@/components/ui';
import type { DayComposite, InsightsOutput, InsightAlert } from '@/lib/insights/types';

type View = 'day' | 'patterns';

export default function InsightsPage() {
  const [view, setView] = useState<View>('day');
  const [loading, setLoading] = useState(true);
  const [composite, setComposite] = useState<DayComposite | null>(null);
  const [patterns, setPatterns] = useState<InsightsOutput | null>(null);
  const [alerts, setAlerts] = useState<InsightAlert[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [dayRes, alertsRes, patternsRes] = await Promise.all([
          fetch(`/api/insights/day?date=${today}`),
          fetch('/api/insights/alerts'),
          fetch('/api/insights/patterns?days=90'),
        ]);

        if (dayRes.ok) {
          const data = await dayRes.json();
          if (data) setComposite(data);
        }
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (patternsRes.ok) setPatterns(await patternsRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today]);

  const handleDismissAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/insights/alerts/${id}`, { method: 'PATCH' });
  }, []);

  const consistency = patterns?.dataStatus
    ? `${patterns.dataStatus.daysTracked} of last ${patterns.dataStatus.daysAnalyzed} days`
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="flex items-center justify-between py-4">
        <h1 className="font-display text-2xl text-warm-900">Insights</h1>
        {view === 'day' && patterns && (patterns.triggers.length > 0 || patterns.helpers.length > 0) && (
          <button onClick={() => setView('patterns')} className="text-sm text-teal-600 font-medium">
            View all patterns →
          </button>
        )}
      </div>

      {view === 'day' ? (
        <DayView
          initialDate={today}
          initialComposite={composite}
          alerts={alerts}
          loggingConsistency={consistency}
          onDismissAlert={handleDismissAlert}
        />
      ) : patterns ? (
        <AllPatterns output={patterns} onBack={() => setView('day')} />
      ) : null}
    </div>
  );
}
