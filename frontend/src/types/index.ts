export interface Tag {
  id: number;
  name: string;
  color: string;
  isArchived: boolean;
}

export interface Category {
  id: number;
  name: string;
  isArchived: boolean;
}

export interface Question {
  id: number;
  text: string;
  expectedAnswer: string;
  categoryId: number;
  levelId: number | null;
  isArchived: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  candidateName: string;
  position: string;
  level: string;
}

export interface InterviewResult {
  id: number;
  candidateFullName: string;
  position: string;
  interviewDate: string;
  averageScore: number;
  comment: string;
  createdAt: string;
}

export interface CreateQuestionRequest {
  text: string;
  expectedAnswer: string;
  categoryId: number;
  levelId?: number;
  tagIds?: number[];
}

export interface UpdateQuestionRequest {
  text?: string;
  expectedAnswer?: string;
  categoryId?: number;
  levelId?: number;
  isArchived?: boolean;
  tagIds?: number[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface Level {
  id: number;
  name: string;
}
