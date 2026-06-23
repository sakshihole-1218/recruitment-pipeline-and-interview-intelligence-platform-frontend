"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiInterviewQuestionService } from "@/features/ai-interview/services/ai-interview-question.service";
import type { GenerateFollowUpQuestionPayload } from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_QUESTIONS_QUERY_KEYS = {
  all: ["ai-interview-questions"] as const,
  session: (sessionId: string) =>
    ["ai-interview-questions", "session", sessionId] as const,
};

export function useInterviewQuestions(sessionId: string) {
  return useQuery({
    queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
    queryFn: () => aiInterviewQuestionService.listBySession(sessionId),
    enabled: !!sessionId,
    retry: false,
    select: (response) =>
      [...response.data].sort((a, b) => a.sequence_number - b.sequence_number),
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
    mutationFn: (payload: GenerateFollowUpQuestionPayload) =>
      aiInterviewQuestionService.generateFollowUp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}
