"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AI_INTERVIEW_QUESTIONS_QUERY_KEYS } from "@/features/ai-interview/hooks/use-interview-questions";
import { aiInterviewTranscriptService } from "@/features/ai-interview/services/ai-interview-transcript.service";
import type {
  AiInterviewTranscriptEntryResponse,
  CreateAiInterviewTranscriptPayload,
  TranscribeAiInterviewAnswerPayload,
} from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS = {
  all: ["ai-interview-transcripts"] as const,
  session: (sessionId: string) =>
    ["ai-interview-transcripts", "session", sessionId] as const,
};

export function sortInterviewTranscriptEntries(
  entries: AiInterviewTranscriptEntryResponse[],
) {
  return [...entries].sort((a, b) => {
    if (a.sequence_number !== b.sequence_number) {
      return a.sequence_number - b.sequence_number;
    }

    return a.created_at.localeCompare(b.created_at);
  });
}

export function useInterviewTranscripts(sessionId: string) {
  return useQuery({
    queryKey: AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS.session(sessionId),
    queryFn: () => aiInterviewTranscriptService.listBySession(sessionId),
    enabled: !!sessionId,
    retry: false,
    select: (response) => sortInterviewTranscriptEntries(response.data),
  });
}

export function useCreateInterviewTranscript(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAiInterviewTranscriptPayload) =>
      aiInterviewTranscriptService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}

export function useTranscribeInterviewAnswer(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TranscribeAiInterviewAnswerPayload) =>
      aiInterviewTranscriptService.transcribeAnswer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS.session(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: AI_INTERVIEW_QUESTIONS_QUERY_KEYS.session(sessionId),
      });
    },
  });
}
