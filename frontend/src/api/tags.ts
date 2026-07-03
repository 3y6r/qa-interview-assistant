import client from './client';
import type { Tag, CreateTagRequest } from '../types';

export const tagsApi = {
  list: () => client.get<Tag[]>('/tags').then((r) => r.data),

  create: (data: CreateTagRequest) =>
    client.post<Tag>('/tags', data).then((r) => r.data),

  update: (id: number, data: { name?: string; color?: string; isArchived?: boolean }) =>
    client.put<Tag>(`/tags/${id}`, data).then((r) => r.data),

  archive: (id: number) =>
    client.patch<Tag>(`/tags/${id}/archive`).then((r) => r.data),
};
