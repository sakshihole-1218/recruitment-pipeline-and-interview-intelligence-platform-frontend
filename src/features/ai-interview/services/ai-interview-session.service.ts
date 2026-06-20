import { apiClient } from "@/lib/api-client";

import type {
  AiInterviewSessionDetailResponse,
  AiInterviewSessionsByInterviewResponse,
  CreateAiInterviewSessionPayload,
} from "@/features/ai-interview/types/ai-interview.types";

const BASE = "/ai-interview-sessions";
const AI_INTERVIEW_REQUEST_TIMEOUT_MS = 15000;

export const aiInterviewSessionService = {
  listByInterviewId: async (
    interviewId: string,
  ): Promise<AiInterviewSessionsByInterviewResponse> => {
    const response = await apiClient.get<AiInterviewSessionsByInterviewResponse>(
      `${BASE}/interview/${interviewId}`,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  create: async (
    payload: CreateAiInterviewSessionPayload,
  ): Promise<AiInterviewSessionDetailResponse> => {
    const response = await apiClient.post<AiInterviewSessionDetailResponse>(
      BASE,
      payload,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  start: async (id: string): Promise<AiInterviewSessionDetailResponse> => {
    const response = await apiClient.post<AiInterviewSessionDetailResponse>(
      `${BASE}/${id}/start`,
      undefined,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },

  end: async (id: string): Promise<AiInterviewSessionDetailResponse> => {
    const response = await apiClient.post<AiInterviewSessionDetailResponse>(
      `${BASE}/${id}/end`,
      undefined,
      { timeout: AI_INTERVIEW_REQUEST_TIMEOUT_MS },
    );
    return response.data;
  },
};
