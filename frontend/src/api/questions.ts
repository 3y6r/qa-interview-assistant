import client from './client';
import type { Question, PaginatedResponse, CreateQuestionRequest, UpdateQuestionRequest, GenerateQuestionsRequest } from '../types';

export interface QuestionFilters {
  categoryId?: number;
  level?: string;
  text?: string;
  tagIds?: number[];
  product?: string;
  page?: number;
  size?: number;
}

export const questionsApi = {
  list: (filters?: QuestionFilters) =>
    client.get<PaginatedResponse<Question>>('/questions', { params: filters }).then((r) => r.data),

  getById: (id: number) =>
    client.get<Question>(`/questions/${id}`).then((r) => r.data),

  create: (data: CreateQuestionRequest) =>
    client.post<Question>('/questions', data).then((r) => r.data),

  update: (id: number, data: UpdateQuestionRequest) =>
    client.put<Question>(`/questions/${id}`, data).then((r) => r.data),

  archive: (id: number) =>
    client.patch(`/questions/${id}/archive`).then((r) => r.data),

  restore: (id: number) =>
    client.patch(`/questions/${id}/restore`).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/questions/${id}`).then((r) => r.data),

  generate: (data: GenerateQuestionsRequest) =>
    client.post<Question[]>('/questions/generate', data).then((r) => r.data),

  saveGenerated: (questions: CreateQuestionRequest[]) =>
    client.post<Question[]>('/questions/generate/save', questions).then((r) => r.data),

  getExpectedAnswer: (id: number) =>
    client.get<{ expectedAnswer: string }>(`/questions/${id}/answer`).then((r) => r.data),
};
