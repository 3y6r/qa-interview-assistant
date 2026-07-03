import client from './client';
import type { Category } from '../types';

export const categoriesApi = {
  list: () => client.get<Category[]>('/categories').then((r) => r.data),

  create: (data: { name: string }) =>
    client.post<Category>('/categories', data).then((r) => r.data),

  update: (id: number, data: { name?: string; isArchived?: boolean }) =>
    client.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  archive: (id: number) =>
    client.put<Category>(`/categories/${id}`, { is_archived: true }).then((r) => r.data),
};
