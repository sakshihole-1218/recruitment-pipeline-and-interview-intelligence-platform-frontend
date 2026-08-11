"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sortInterviewQuestions } from "@/features/ai-interview/hooks/use-interview-questions";
import { sortInterviewTranscriptEntries } from "@/features/ai-interview/hooks/use-interview-transcripts";
import { candidateInterviewService } from "@/features/candidate-interview/services/candidate-interview.service";
import type {
  CandidateCreateTranscriptPayload,
  CandidateTranscribePayload,
  CreateCandidateInterviewInvitePayload,
} from "@/features/candidate-interview/types/candidate-interview.types";

export const CANDIDATE_INTERVIEW_QUERY_KEYS = {
  inviteByInterview: (interviewId: string) =>
    ["candidate-interview", "invite", "interview", interviewId] as const,
  access: (token: string) => ["candidate-interview", "access", token] as const,
  questions: (token: string) =>
    ["candidate-interview", "questions", token] as const,
  transcripts: (token: string) =>
    ["candidate-interview", "transcripts", token] as const,
};

export function useCandidateInterviewInvite(interviewId: string) {
  return useQuery({
    queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.inviteByInterview(interviewId),
    queryFn: () => candidateInterviewService.getInviteByInterview(interviewId),
    enabled: !!interviewId,
  });
}

export function useCreateCandidateInterviewInvite(interviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCandidateInterviewInvitePayload) =>
      candidateInterviewService.createInvite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.inviteByInterview(interviewId),
      });
    },
  });
}

export function useRegenerateCandidateInterviewInvite(interviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      candidateInterviewService.regenerateInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.inviteByInterview(interviewId),
      });
    },
  });
}

export function useRevokeCandidateInterviewInvite(interviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => candidateInterviewService.revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.inviteByInterview(interviewId),
      });
    },
  });
}

export function useCandidateInterviewAccess(token: string) {
  return useQuery({
    queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.access(token),
    queryFn: () => candidateInterviewService.validateAccess(token),
    enabled: !!token,
    retry: false,
  });
}

export function useStartCandidateInterview(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => candidateInterviewService.startInterview(token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.access(token),
      });
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
      });
    },
  });
}

export function useCompleteCandidateInterview(token: string) {
  return useMutation({
    mutationFn: () => candidateInterviewService.completeInterview(token),
  });
}

export function useCandidateInterviewQuestions(token: string) {
  return useQuery({
    queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
    queryFn: () => candidateInterviewService.getQuestions(token),
    enabled: !!token,
    retry: false,
    select: (response) => sortInterviewQuestions(response.data),
  });
}

export function useCandidateInterviewTranscripts(token: string) {
  return useQuery({
    queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.transcripts(token),
    queryFn: () => candidateInterviewService.getTranscripts(token),
    enabled: !!token,
    retry: false,
    select: (response) => sortInterviewTranscriptEntries(response.data),
  });
}

export function useCreateCandidateInterviewTranscript(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CandidateCreateTranscriptPayload) =>
      candidateInterviewService.createTranscript(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.transcripts(token),
      });
    },
  });
}

export function useTranscribeCandidateInterviewAnswer(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CandidateTranscribePayload) =>
      candidateInterviewService.transcribeAnswer(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.transcripts(token),
      });
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
      });
    },
  });
}

export function useMarkCandidateInterviewQuestionAsked(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      candidateInterviewService.markQuestionAsked(token, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
      });
    },
  });
}

export function useMarkCandidateInterviewQuestionAnswered(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      candidateInterviewService.markQuestionAnswered(token, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
      });
    },
  });
}

export function useGenerateCandidateInterviewFollowUp(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      candidateInterviewService.generateFollowUp(token, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATE_INTERVIEW_QUERY_KEYS.questions(token),
      });
    },
  });
}
