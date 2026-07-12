import client from './client';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest, GenerateQuestionsRequest } from '../types';

export interface QuestionFilters {
  categoryId?: number;
  levelId?: number;
  text?: string;
  tagIds?: number[];
  isArchived?: boolean;
}

const toBackendParams = (filters?: QuestionFilters) => {
  if (!filters) return undefined;

  const params: Record<string, string | number | boolean> = {};

  if (filters.text) params.text = filters.text;
  if (filters.categoryId) params.category_id = filters.categoryId;
  if (filters.levelId) params.level_id = filters.levelId;
  if (typeof filters.isArchived === 'boolean') params.is_archived = filters.isArchived;
  if (filters.tagIds?.length) params.tag_ids = filters.tagIds.join(',');

  return params;
};

export const questionsApi = {
  list: (filters?: QuestionFilters) =>
    client.get<Question[]>('/questions', { params: toBackendParams(filters) }).then((r) => r.data),

  getById: (id: number) =>
    client.get<Question>(`/questions/${id}`).then((r) => r.data),

  create: (data: CreateQuestionRequest) =>
    client.post<Question>('/questions', data).then((r) => r.data),

  update: (id: number, data: UpdateQuestionRequest) =>
    client.put<Question>(`/questions/${id}`, data).then((r) => r.data),

  archive: (id: number) =>
    client.patch(`/questions/${id}/archive`).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/questions/${id}`).then((r) => r.data),

  generate: (data: GenerateQuestionsRequest) =>
    client.post<Question[]>('/ai/questions/generate', data).then((r) => r.data),
};
