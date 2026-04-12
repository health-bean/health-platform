import type { DayComposite, ProgressObservation } from './types';

export function computeProgress(days: DayComposite[], today: string): ProgressObservation[] {
  if (days.length < 14) return [];

  const observations: ProgressObservation[] = [];
  const todayDate = new Date(today);

  const currentStart = new Date(todayDate);
  currentStart.setDate(currentStart.getDate() - 29);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 30);

  const currentDays = days.filter(d => d.date >= fmt(currentStart) && d.date <= today);
  const previousDays = days.filter(d => d.date >= fmt(previousStart) && d.date < fmt(currentStart));

  if (previousDays.length < 7) return observations;

  const currentSymptoms = countSymptoms(currentDays);
  const previousSymptoms = countSymptoms(previousDays);

  const allSymptomNames = new Set([...currentSymptoms.keys(), ...previousSymptoms.keys()]);
  for (const name of allSymptomNames) {
    const current = currentSymptoms.get(name) ?? 0;
    const previous = previousSymptoms.get(name) ?? 0;

    if (previous === 0 && current === 0) continue;
    if (previous < 3 && current < 3) continue;

    const currentLabel = monthLabel(todayDate);
    const previousLabel = monthLabel(new Date(currentStart.getTime() - 86400000));

    observations.push({
      metric: `symptom_frequency:${name.toLowerCase()}`,
      label: `${name} frequency`,
      currentPeriod: { count: current, days: currentDays.length, label: currentLabel },
      previousPeriod: { count: previous, days: previousDays.length, label: previousLabel },
      observation: `${name} frequency: ${previous} in ${previousLabel}, ${current} in ${currentLabel} (${currentDays.length} days in)`,
    });
  }

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].isFlareDay) break;
    streak++;
  }

  if (streak >= 3) {
    observations.push({
      metric: 'flare_free_streak',
      label: 'Flare-free days',
      currentPeriod: { count: streak, days: streak, label: 'current' },
      previousPeriod: { count: 0, days: 0, label: '' },
      observation: `Flare-free streak: ${streak} days`,
    });
  }

  return observations;
}

function countSymptoms(days: DayComposite[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const day of days) {
    const seen = new Set<string>();
    for (const s of day.symptoms) {
      if (!seen.has(s.name)) {
        counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
        seen.add(s.name);
      }
    }
  }
  return counts;
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function monthLabel(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()];
}
