import client from './client';
import type { Level } from '../types';

export const levelsApi = {
  list: () => client.get<Level[]>('/levels').then((r) => r.data),
};
