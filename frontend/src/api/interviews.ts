import client from './client';
import type { CreateInterviewResultRequest, InterviewResult } from '../types';

export interface InterviewResultFilters {
  candidateName?: string;
  fromDate?: string;
  toDate?: string;
}

const toBackendParams = (filters?: InterviewResultFilters) => {
  if (!filters) return undefined;

  const params: Record<string, string> = {};
  if (filters.candidateName) params.candidate_full_name = filters.candidateName;
  if (filters.fromDate) params.date_from = filters.fromDate;
  if (filters.toDate) params.date_to = filters.toDate;

  return params;
};

export const interviewsApi = {
  list: (filters?: InterviewResultFilters) =>
    client.get<InterviewResult[]>('/interview-results', { params: toBackendParams(filters) }).then((r) => r.data),

  create: (data: CreateInterviewResultRequest) =>
    client.post<InterviewResult>('/interview-results', data).then((r) => r.data),

  getById: (id: number) =>
    client.get<InterviewResult>(`/interview-results/${id}`).then((r) => r.data),
};
