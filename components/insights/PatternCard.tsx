'use client';

import { Badge, Card } from '@/components/ui';
import type { SingleFactorResult, MultiFactorResult } from '@/lib/insights/types';

type PatternResult = SingleFactorResult | MultiFactorResult;

interface PatternCardProps {
  result: PatternResult;
}

export function PatternCard({ result }: PatternCardProps) {
  const isMulti = 'factors' in result;
  const factorCount = isMulti ? (result as MultiFactorResult).factorCount : 1;

  return (
    <Card className="p-3">
      <p className="text-sm text-warm-900 leading-snug">{result.description}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge variant="default" className="text-[11px]">seen {result.frequency} times</Badge>
        <Badge variant="default" className="text-[11px]">{result.recencyDays === 0 ? 'today' : `${result.recencyDays}d ago`}</Badge>
        {factorCount > 1 && (
          <Badge variant="default" className="text-[11px]">{factorCount}-factor</Badge>
        )}
      </div>
    </Card>
  );
}
