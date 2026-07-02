export type Role = 'ADMIN' | 'EDITOR' | 'OBSERVER';

export type QuestionLevel = 'JUNIOR' | 'MIDDLE' | 'SENIOR';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  is_archived?: boolean;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  is_archived?: boolean;
  created_at?: string;
}

export interface Level {
  id: number;
  name: string;
}

export interface Question {
  id: number;
  text: string;
  expected_answer: string;
  category_id: number;
  level_id: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Candidate {
  candidateName: string;
  position: string;
  level: QuestionLevel;
  interviewDate: string;
}

export interface QuestionResult {
  questionId: number;
  score: number | null;
  comment: string | null;
}

export interface InterviewResult {
  id: number;
  candidate_full_name: string;
  interview_date: string;
  average_score: number;
  comment: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CreateQuestionRequest {
  text: string;
  expected_answer: string;
  category_id: number;
  level_id: number;
  tag_ids?: number[];
}

export interface UpdateQuestionRequest {
  text?: string;
  expected_answer?: string;
  category_id?: number;
  level_id?: number;
  is_archived?: boolean;
  tag_ids?: number[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  is_archived?: boolean;
}

export interface GenerateQuestionsRequest {
  category_id: number;
  level_id: number;
  count?: number;
}

export interface CreateInterviewResultRequest {
  candidate_full_name: string;
  interview_date: string;
  average_score: number;
  comment: string;
}
