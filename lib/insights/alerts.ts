import type { InsightsOutput, InsightAlert, AlertType, SingleFactorResult, MultiFactorResult } from './types';
import { insightKey } from './types';

export function detectNewAlerts(
  current: InsightsOutput,
  previousInsightKeys: Set<string>,
): Omit<InsightAlert, 'id' | 'createdAt' | 'dismissedAt'>[] {
  const alerts: Omit<InsightAlert, 'id' | 'createdAt' | 'dismissedAt'>[] = [];

  const allResults = [...current.triggers, ...current.helpers];

  for (const result of allResults) {
    const factors = 'factors' in result ? (result as MultiFactorResult).factors : [(result as SingleFactorResult).factor];
    const key = insightKey(factors, result.outcome);

    if (previousInsightKeys.has(key)) continue;

    alerts.push({
      alertType: 'new_pattern' as AlertType,
      insightKey: key,
      title: `New pattern: ${factors.map(f => f.label.toLowerCase()).join(' + ')}`,
      body: result.description,
      detail: { factors: factors.map(f => f.key), outcome: result.outcome.key, frequency: result.frequency },
      dismissed: false,
    });
  }

  for (const obs of current.progress) {
    const key = `progress:${obs.metric}`;
    if (previousInsightKeys.has(key)) continue;

    if (obs.previousPeriod.count > 0 && obs.currentPeriod.count < obs.previousPeriod.count * 0.6) {
      alerts.push({
        alertType: 'progress_milestone' as AlertType,
        insightKey: key,
        title: obs.label,
        body: obs.observation,
        detail: { metric: obs.metric },
        dismissed: false,
      });
    }
  }

  return alerts;
}
