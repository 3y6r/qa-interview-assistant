export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const LEVELS_QUERY_KEY = 'levels';

export const LEVEL_NAMES: Record<string, string> = {
  trainee: 'Trainee',
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
};
