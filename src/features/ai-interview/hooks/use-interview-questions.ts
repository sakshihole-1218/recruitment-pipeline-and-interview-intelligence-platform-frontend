"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiInterviewQuestionService } from "@/features/ai-interview/services/ai-interview-question.service";
import type {
  AiInterviewQuestionResponse,
  AiInterviewQuestionsBySessionResponse,
} from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_QUESTIONS_QUERY_KEYS = {
  all: ["ai-interview-questions"] as const,
  session: (sessionId: string) =>
    ["ai-interview-questions", "session", sessionId] as const,
};

export function sortInterviewQuestions(
  questions: AiInterviewQuestionResponse[],
) {
  return [...questions].sort((a, b) => a.sequence_number - b.sequence_number);
}

export function useInterviewQuestions(sessionId: string) {
  return useQuery({
    queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
    queryFn: () => aiInterviewQuestionService.listBySession(sessionId),
    enabled: !!sessionId,
    retry: false,
    select: (response) => sortInterviewQuestions(response.data),
  });
}

export function useGenerateInterviewPlan(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => aiInterviewQuestionService.generatePlan(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}

export function useMarkInterviewQuestionAsked(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => aiInterviewQuestionService.markAsked(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}

export function useMarkInterviewQuestionAnswered(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) =>
      aiInterviewQuestionService.markAnswered(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}

export function useGenerateFollowUpQuestion(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) =>
      aiInterviewQuestionService.generateFollowUp(questionId),
    onSuccess: (response) => {
      queryClient.setQueryData<AiInterviewQuestionsBySessionResponse | undefined>(
        AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
        (existing) => {
          if (!existing) {
            return existing;
          }

          const alreadyExists = existing.data.some(
            (question) => question.id === response.data.id,
          );

          if (alreadyExists) {
            return existing;
          }

          return {
            ...existing,
            data: sortInterviewQuestions([...existing.data, response.data]),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}
