'use client';

import { Card } from '@/components/ui';
import type { ProgressObservation } from '@/lib/insights/types';

interface ProgressCardProps {
  observation: ProgressObservation;
}

export function ProgressCard({ observation }: ProgressCardProps) {
  return (
    <Card className="p-3">
      <p className="text-sm text-warm-900">{observation.observation}</p>
    </Card>
  );
}
