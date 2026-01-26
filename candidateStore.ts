import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Answer {
  id: string;
  questionId: string;
  answerText?: string;
  answerImageUrl?: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  testId: string;
  title: string;
  descriptionText?: string;
  mediaUrl?: string;
  type: "SINGLE_CHOICE_TEXT" | "MULTIPLE_CHOICE_TEXT" | "SINGLE_CHOICE_IMAGE" | "MULTIPLE_CHOICE_IMAGE" | "OPEN_TEXT";
  maxScore: number;
  orderIndex: number;
  answers: Answer[];
}

export interface Test {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  passThresholdPercent: number;
  showResultsToCandidate: boolean;
  questions: Question[];
}

export interface CandidateAnswer {
  questionId: string;
  selectedAnswerIds?: string[];
  openTextAnswer?: string;
}

export interface CandidateState {
  // User info
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  
  // Test session
  submissionId?: string;
  testId?: string;
  testData?: Test;
  
  // Test progress
  currentQuestionIndex: number;
  answers: Record<string, CandidateAnswer>;
  markedForReview: Set<string>;
  
  // Timer
  timeRemaining: number; // in seconds
  isTimerActive: boolean;
  
  // UI state
  hasAgreedToTerms: boolean;
  isWaitingForApproval: boolean;
  
  // Actions
  setUserInfo: (info: { firstName: string; lastName: string; email: string; phoneNumber: string }) => void;
  setSubmissionId: (id: string) => void;
  setTestData: (test: Test) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, answer: CandidateAnswer) => void;
  toggleMarkForReview: (questionId: string) => void;
  setTimeRemaining: (seconds: number) => void;
  setTimerActive: (active: boolean) => void;
  setHasAgreedToTerms: (agreed: boolean) => void;
  setIsWaitingForApproval: (waiting: boolean) => void;
  reset: () => void;
  clearData: () => void;
}

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  submissionId: undefined,
  testId: undefined,
  testData: undefined,
  currentQuestionIndex: 0,
  answers: {},
  markedForReview: new Set<string>(),
  timeRemaining: 0,
  isTimerActive: false,
  hasAgreedToTerms: false,
  isWaitingForApproval: false,
};

export const useCandidateStore = create<CandidateState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserInfo: (info) => set({ ...info }),
      
      setSubmissionId: (submissionId) => set({ submissionId }),
      
      setTestData: (testData) => set({ 
        testData, 
        testId: testData.id,
        timeRemaining: testData.durationMinutes * 60,
        currentQuestionIndex: 0,
      }),
      
      setCurrentQuestion: (currentQuestionIndex) => set({ currentQuestionIndex }),
      
      setAnswer: (questionId, answer) => set((state) => ({
        answers: { ...state.answers, [questionId]: answer }
      })),
      
      toggleMarkForReview: (questionId) => set((state) => {
        const newMarkedForReview = new Set(state.markedForReview);
        if (newMarkedForReview.has(questionId)) {
          newMarkedForReview.delete(questionId);
        } else {
          newMarkedForReview.add(questionId);
        }
        return { markedForReview: newMarkedForReview };
      }),
      
      setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
      
      setTimerActive: (isTimerActive) => set({ isTimerActive }),
      
      setHasAgreedToTerms: (hasAgreedToTerms) => set({ hasAgreedToTerms }),
      
      setIsWaitingForApproval: (isWaitingForApproval) => set({ isWaitingForApproval }),
      
      reset: () => set(initialState),
      
      clearData: () => set(initialState),
    }),
    {
      name: "candidate-storage",
      partialize: (state) => ({
        submissionId: state.submissionId,
        testId: state.testId,
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        phoneNumber: state.phoneNumber,
        hasAgreedToTerms: state.hasAgreedToTerms,
      }),
    }
  )
);
