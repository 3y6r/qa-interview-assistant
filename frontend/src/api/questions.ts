import client from './client';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest } from '../types';

export interface QuestionFilters {
  text?: string;
  categoryId?: number;
  levelId?: number;
  isArchived?: boolean;
  tagIds?: number[];
  limit?: number;
  offset?: number;
  sortOrder?: 'newest' | 'oldest';
}

export const questionsApi = {
  list: (filters?: QuestionFilters) => {
    const params = filters ? { ...filters } : undefined;
    if (params?.tagIds) {
      params.tagIds = params.tagIds.join(',') as any;
    }
    return client.get<Question[]>('/questions', { params }).then((r) => r.data);
  },

  getById: (id: number) =>
    client.get<Question>(`/questions/${id}`).then((r) => r.data),

  create: (data: CreateQuestionRequest) =>
    client.post<Question>('/questions', data).then((r) => r.data),

  update: (id: number, data: UpdateQuestionRequest) =>
    client.put<Question>(`/questions/${id}`, data).then((r) => r.data),

  archive: (id: number) =>
    client.patch<{ id: number; isArchived: boolean }>(`/questions/${id}/archive`).then((r) => r.data),

  unarchive: (id: number) =>
    client.patch<{ id: number; isArchived: boolean }>(`/questions/${id}/unarchive`).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/questions/${id}`).then((r) => r.data),

  generate: (data: {
    categoryId: number;
    levelId: number;
    tagIds?: number[];
    numQuestions: number;
    additionalText?: string;
  }) => client.post<{ questions: any[] }>('/questions/generate', data).then((r) => r.data),
};
