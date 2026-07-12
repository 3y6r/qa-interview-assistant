import client from './client';
import type { InterviewResult } from '../types';

export interface InterviewResultFilters {
  candidateFullName?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface CreateInterviewResultRequest {
  candidateFullName: string;
  position: string;
  interviewDate: string;
  averageScore: number;
  comment: string;
}

export const interviewsApi = {
  create: (data: CreateInterviewResultRequest) =>
    client.post<InterviewResult>('/interview-results', data).then((r) => r.data),

  getById: (id: number) =>
    client.get<InterviewResult>(`/interview-results/${id}`).then((r) => r.data),

  list: (filters?: InterviewResultFilters) =>
    client.get<InterviewResult[]>('/interview-results', { params: filters }).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/interview-results/${id}`).then((r) => r.data),
};
