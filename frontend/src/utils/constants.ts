export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const QUESTION_LEVELS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MIDDLE', label: 'Middle' },
  { value: 'SENIOR', label: 'Senior' },
] as const;
