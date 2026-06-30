import client from './client';
import type { Tag, CreateTagRequest } from '../types';

export const tagsApi = {
  list: () => client.get<Tag[]>('/tags').then((r) => r.data),

  create: (data: CreateTagRequest) =>
    client.post<Tag>('/tags', data).then((r) => r.data),

  update: (id: number, data: CreateTagRequest) =>
    client.put<Tag>(`/tags/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/tags/${id}`).then((r) => r.data),
};
