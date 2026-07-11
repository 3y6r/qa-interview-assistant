import { create } from 'zustand';
import type { Question, Candidate } from '../types';

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface QuestionScore {
  questionId: number;
  score: number;
}

interface EditorState {
  sessionToken: string;
  candidate: Candidate | null;
  selectedQuestions: Question[];
  scores: Record<number, QuestionScore>;

  setCandidate: (candidate: Candidate) => void;
  addQuestion: (q: Question) => void;
  removeQuestion: (id: number) => void;
  reorderQuestions: (from: number, to: number) => void;
  setScore: (questionId: number, score: number) => void;
  reset: () => void;
  saveSession: () => void;
  restoreSession: (token: string) => void;
}

const STORAGE_PREFIX = 'interview_session_';
export const ACTIVE_TOKEN_KEY = 'interview_active_token';

export const useEditorStore = create<EditorState>((set, get) => ({
  sessionToken: generateId(),
  candidate: null,
  selectedQuestions: [],
  scores: {},

  setCandidate: (candidate) => {
    set({ candidate });
    get().saveSession();
  },

  addQuestion: (q) =>
    set((s) => {
      const next = s.selectedQuestions.some((x) => x.id === q.id)
        ? s.selectedQuestions
        : [...s.selectedQuestions, q];
      setTimeout(() => get().saveSession(), 0);
      return { selectedQuestions: next };
    }),

  removeQuestion: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.scores;
      setTimeout(() => get().saveSession(), 0);
      return {
        selectedQuestions: s.selectedQuestions.filter((x) => x.id !== id),
        scores: rest,
      };
    }),

  reorderQuestions: (from, to) =>
    set((s) => {
      const items = [...s.selectedQuestions];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      setTimeout(() => get().saveSession(), 0);
      return { selectedQuestions: items };
    }),

  setScore: (questionId, score) =>
    set((s) => ({
      scores: {
        ...s.scores,
        [questionId]: { questionId, score },
      },
    })),

  reset: () => {
    set({ candidate: null, selectedQuestions: [], scores: {} });
    get().saveSession();
  },

  saveSession: () => {
    const { sessionToken, candidate, selectedQuestions, scores } = get();
    try {
      sessionStorage.setItem(ACTIVE_TOKEN_KEY, sessionToken);
      localStorage.setItem(
        STORAGE_PREFIX + sessionToken,
        JSON.stringify({ candidate, selectedQuestions, scores }),
      );
    } catch {}
  },

  restoreSession: (token: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + token);
      if (raw) {
        const data = JSON.parse(raw);
        set({ sessionToken: token, ...data });
      } else {
        set({ sessionToken: token, candidate: null, selectedQuestions: [], scores: {} });
      }
      sessionStorage.setItem(ACTIVE_TOKEN_KEY, token);
    } catch {
      set({ sessionToken: token, candidate: null, selectedQuestions: [], scores: {} });
      sessionStorage.setItem(ACTIVE_TOKEN_KEY, token);
    }
  },
}));
