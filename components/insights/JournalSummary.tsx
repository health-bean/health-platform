'use client';

import type { JournalScores } from '@/lib/insights/types';

interface JournalSummaryProps {
  journal: JournalScores;
}

const LABELS: { key: keyof JournalScores; label: string }[] = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'energy', label: 'Energy' },
  { key: 'mood', label: 'Mood' },
  { key: 'stress', label: 'Stress' },
  { key: 'pain', label: 'Pain' },
];

export function JournalSummary({ journal }: JournalSummaryProps) {
  const hasAny = LABELS.some(l => journal[l.key] !== null);
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-5 gap-2">
      {LABELS.map(({ key, label }) => {
        const value = journal[key];
        if (value === null) return <div key={key} />;

        return (
          <div key={key} className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-warm-50">
            <span className="text-xs text-warm-500">{label}</span>
            <span className="text-lg font-display text-warm-900">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
