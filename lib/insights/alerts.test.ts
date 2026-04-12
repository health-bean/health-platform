import { describe, it, expect } from 'vitest';
import { detectNewAlerts } from './alerts';
import type { InsightsOutput } from './types';

const makeOutput = (overrides: Partial<InsightsOutput> = {}): InsightsOutput => ({
  triggers: [], helpers: [], propertyPatterns: [], progress: [],
  dataStatus: { daysTracked: 30, daysAnalyzed: 90, loggingConsistency: 0.8, singleFactors: 5, twoFactorPatterns: 0, threeFactorPatterns: 0 },
  ...overrides,
});

describe('detectNewAlerts', () => {
  it('creates alert for new pattern not in previous snapshot', () => {
    const current = makeOutput({
      triggers: [{
        factor: { category: 'food', key: 'food:eggs', label: 'Eggs' },
        outcome: { type: 'symptom_occurrence', key: 'symptom:headache', label: 'Headache' },
        frequency: 5, totalOpportunities: 8, baseRate: 0.1, conditionalRate: 0.6,
        rateMultiplier: 6, recencyDays: 1, impactScore: 0.8,
        description: 'On days with eggs, headache was 6x more frequent (seen 5 times)',
      }],
    });

    const alerts = detectNewAlerts(current, new Set());
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('new_pattern');
    expect(alerts[0].title).toContain('eggs');
  });

  it('skips patterns already seen', () => {
    const current = makeOutput({
      triggers: [{
        factor: { category: 'food', key: 'food:eggs', label: 'Eggs' },
        outcome: { type: 'symptom_occurrence', key: 'symptom:headache', label: 'Headache' },
        frequency: 5, totalOpportunities: 8, baseRate: 0.1, conditionalRate: 0.6,
        rateMultiplier: 6, recencyDays: 1, impactScore: 0.8,
        description: 'test',
      }],
    });

    const alerts = detectNewAlerts(current, new Set(['food:eggs→symptom:headache']));
    expect(alerts).toHaveLength(0);
  });

  it('creates progress milestone alert for significant improvement', () => {
    const current = makeOutput({
      progress: [{
        metric: 'symptom_frequency:headache',
        label: 'Headache frequency',
        currentPeriod: { count: 2, days: 30, label: 'Apr' },
        previousPeriod: { count: 8, days: 30, label: 'Mar' },
        observation: 'Headache frequency: 8 in Mar, 2 in Apr',
      }],
    });

    const alerts = detectNewAlerts(current, new Set());
    const milestone = alerts.find(a => a.alertType === 'progress_milestone');
    expect(milestone).toBeDefined();
  });

  it('does not create progress alert for marginal change', () => {
    const current = makeOutput({
      progress: [{
        metric: 'symptom_frequency:headache',
        label: 'Headache frequency',
        currentPeriod: { count: 7, days: 30, label: 'Apr' },
        previousPeriod: { count: 8, days: 30, label: 'Mar' },
        observation: 'Headache frequency: 8 in Mar, 7 in Apr',
      }],
    });

    const alerts = detectNewAlerts(current, new Set());
    expect(alerts).toHaveLength(0);
  });
});
