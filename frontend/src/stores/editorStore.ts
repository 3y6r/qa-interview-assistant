import { create } from 'zustand';
import type { Question, Candidate } from '../types';

interface QuestionScore {
  questionId: number;
  score: number;
}

interface EditorState {
  candidate: Candidate | null;
  selectedQuestions: Question[];
  scores: Record<number, QuestionScore>;

  setCandidate: (candidate: Candidate) => void;
  addQuestion: (q: Question) => void;
  removeQuestion: (id: number) => void;
  reorderQuestions: (from: number, to: number) => void;
  setScore: (questionId: number, score: number) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  candidate: null,
  selectedQuestions: [],
  scores: {},

  setCandidate: (candidate) => set({ candidate }),

  addQuestion: (q) =>
    set((s) => ({
      selectedQuestions: s.selectedQuestions.some((x) => x.id === q.id)
        ? s.selectedQuestions
        : [...s.selectedQuestions, q],
    })),

  removeQuestion: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.scores;
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
      return { selectedQuestions: items };
    }),

  setScore: (questionId, score) =>
    set((s) => ({
      scores: {
        ...s.scores,
        [questionId]: { questionId, score },
      },
    })),

  reset: () =>
    set({ candidate: null, selectedQuestions: [], scores: {} }),
}));
