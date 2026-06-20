import { apiClient } from "@/lib/api-client";

import type {
  AiInterviewTranscriptDetailResponse,
  AiInterviewTranscriptsBySessionResponse,
  CreateAiInterviewTranscriptPayload,
} from "@/features/ai-interview/types/ai-interview.types";

const BASE = "/ai-interview-transcripts";
const AI_INTERVIEW_REQUEST_TIMEOUT_MS = 15000;

export const aiInterviewTranscriptService = {
  listBySession: async (
    sessionId: string,
  ): Promise<AiInterviewTranscriptsBySessionResponse> => {
    const response = await apiClient.get<AiInterviewTranscriptsBySessionResponse>(
      `${BASE}/session/${sessionId}`,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  create: async (
    payload: CreateAiInterviewTranscriptPayload,
  ): Promise<AiInterviewTranscriptDetailResponse> => {
    const response = await apiClient.post<AiInterviewTranscriptDetailResponse>(
      BASE,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },
};
