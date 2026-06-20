"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiInterviewTranscriptService } from "@/features/ai-interview/services/ai-interview-transcript.service";
import type { CreateAiInterviewTranscriptPayload } from "@/features/ai-interview/types/ai-interview.types";

export const AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS = {
  all: ["ai-interview-transcripts"] as const,
  session: (sessionId: string) =>
    ["ai-interview-transcripts", "session", sessionId] as const,
};

export function useInterviewTranscripts(sessionId: string) {
  return useQuery({
    queryKey: AI_INTERVIEW_TRANSCRIPTS_QUERY_KEYS.session(sessionId),
    queryFn: () => aiInterviewTranscriptService.listBySession(sessionId),
    enabled: !!sessionId,
    retry: false,
    select: (response) =>
      [...response.data].sort((a, b) => {
        if (a.sequence_number !== b.sequence_number) {
          return a.sequence_number - b.sequence_number;
        }

        return a.created_at.localeCompare(b.created_at);
      }),
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
