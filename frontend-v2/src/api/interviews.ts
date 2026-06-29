import client from './client';
import type { Interview, PaginatedResponse, QuestionResult } from '../types';

export interface CreateInterviewRequest {
  candidateName: string;
  position: string;
  level: string;
  topicIds: number[];
  questionIds: number[];
}

export interface InterviewFilters {
  candidateName?: string;
  level?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const interviewsApi = {
  create: (data: CreateInterviewRequest) =>
    client.post<Interview>('/interviews', data).then((r) => r.data),

  getById: (id: number) =>
    client.get<Interview>(`/interviews/${id}`).then((r) => r.data),

  list: (filters?: InterviewFilters) =>
    client.get<PaginatedResponse<Interview>>('/interviews', { params: filters }).then((r) => r.data),

  getQuestions: (id: number) =>
    client.get<QuestionResult[]>(`/interviews/${id}/questions`).then((r) => r.data),

  rateQuestion: (interviewId: number, questionId: number, data: { score: number; comment?: string }) =>
    client.post(`/interviews/${interviewId}/questions/${questionId}/rate`, data).then((r) => r.data),

  getResult: (id: number) =>
    client.get<{ totalScore: number; averageScore: number; finalGrade: string }>(
      `/interviews/${id}/result`,
    ).then((r) => r.data),

  complete: (id: number) =>
    client.post(`/interviews/${id}/complete`).then((r) => r.data),
};
