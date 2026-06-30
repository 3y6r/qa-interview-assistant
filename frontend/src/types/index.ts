export type Role = 'ADMIN' | 'EDITOR' | 'OBSERVER';

export type QuestionLevel = 'JUNIOR' | 'MIDDLE' | 'SENIOR';

export type InterviewStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

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
}

export interface Category {
  id: number;
  name: string;
}

export interface Question {
  id: number;
  text: string;
  expectedAnswer: string;
  category: Category;
  level: QuestionLevel | null;
  tags: Tag[];
  product: string | null;
  createdBy: User;
  createdAt: string;
  archived: boolean;
}

export interface Candidate {
  candidateName: string;
  position: string;
  level: QuestionLevel;
  topicIds: number[];
}

export interface Interview {
  id: number;
  candidateName: string;
  position: string;
  level: QuestionLevel;
  status: InterviewStatus;
  interviewer: User;
  topics: Category[];
  createdAt: string;
  completedAt: string | null;
}

export interface QuestionResult {
  id: number;
  interviewId: number;
  questionId: number;
  question: Question;
  score: number | null;
  comment: string | null;
  askedAt: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CreateQuestionRequest {
  text: string;
  expectedAnswer: string;
  categoryId: number;
  level?: QuestionLevel;
  tagIds?: number[];
  product?: string;
}

export interface UpdateQuestionRequest {
  text: string;
  expectedAnswer: string;
  categoryId: number;
  level?: QuestionLevel;
  tagIds?: number[];
  product?: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface GenerateQuestionsRequest {
  categoryId: number;
  level: QuestionLevel;
  count?: number;
}
