import { apiClient } from "@/lib/api-client";

import type {
  AiInterviewQuestionDetailResponse,
  AiInterviewQuestionsBySessionResponse,
  GenerateFollowUpQuestionDetailResponse,
  GenerateFollowUpQuestionPayload,
} from "@/features/ai-interview/types/ai-interview.types";

const BASE = "/ai-interview-questions";
const AI_INTERVIEW_REQUEST_TIMEOUT_MS = 15000;

export const aiInterviewQuestionService = {
  listBySession: async (
    sessionId: string,
  ): Promise<AiInterviewQuestionsBySessionResponse> => {
    const response = await apiClient.get<AiInterviewQuestionsBySessionResponse>(
      `${BASE}/session/${sessionId}`,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  markAsked: async (id: string): Promise<AiInterviewQuestionDetailResponse> => {
    const response = await apiClient.patch<AiInterviewQuestionDetailResponse>(
      `${BASE}/${id}/mark-asked`,
      undefined,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  markAnswered: async (id: string): Promise<AiInterviewQuestionDetailResponse> => {
    const response = await apiClient.patch<AiInterviewQuestionDetailResponse>(
      `${BASE}/${id}/mark-answered`,
      undefined,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  generateFollowUp: async (
    payload: GenerateFollowUpQuestionPayload,
  ): Promise<GenerateFollowUpQuestionDetailResponse> => {
    const response = await apiClient.post<GenerateFollowUpQuestionDetailResponse>(
      `${BASE}/generate-follow-up`,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },
};
