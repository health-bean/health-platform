export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENTRY_TYPES = {
  FOOD: 'food',
  SYMPTOM: 'symptom',
  SUPPLEMENT: 'supplement',
  MEDICATION: 'medication',
  EXPOSURE: 'exposure',
  DETOX: 'detox'
};

export const SEVERITY_LEVELS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5
};

export const ACTIVITY_LEVELS = {
  LIGHT: 'light',
  MODERATE: 'moderate',
  INTENSE: 'intense'
};

export const SLEEP_QUALITY_OPTIONS = ['good', 'okay', 'poor'];

export const CYCLE_DAY_OPTIONS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', '≥6'];