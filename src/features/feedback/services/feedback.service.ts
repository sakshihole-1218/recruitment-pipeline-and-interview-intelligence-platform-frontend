import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  AiInterviewQuestionResponse,
  AiInterviewSessionResponse,
  AiInterviewTranscriptEntryResponse,
} from "@/features/ai-interview/types/ai-interview.types";
import type {
  FeedbackDetailResponse,
  ListFeedbackParams,
  ListFeedbackResponse,
  ProctoringRiskSummaryResponse,
} from "@/features/feedback/types/feedback.types";

const BASE = "/ai-interview-feedback";

export const feedbackService = {
  list: async (params: ListFeedbackParams): Promise<ListFeedbackResponse> => {
    const response = await apiClient.get<ListFeedbackResponse>(BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<FeedbackDetailResponse> => {
    const response = await apiClient.get<FeedbackDetailResponse>(`${BASE}/${id}`);
    return response.data;
  },

  getSessionById: async (
    id: string,
  ): Promise<ApiSuccessResponse<AiInterviewSessionResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<AiInterviewSessionResponse>>(
      `/ai-interview-sessions/${id}`,
    );
    return response.data;
  },

  getQuestionsBySession: async (
    sessionId: string,
  ): Promise<ApiSuccessResponse<AiInterviewQuestionResponse[]>> => {
    const response = await apiClient.get<ApiSuccessResponse<AiInterviewQuestionResponse[]>>(
      `/ai-interview-questions/session/${sessionId}`,
    );
    return response.data;
  },

  getTranscriptsBySession: async (
    sessionId: string,
  ): Promise<ApiSuccessResponse<AiInterviewTranscriptEntryResponse[]>> => {
    const response = await apiClient.get<
      ApiSuccessResponse<AiInterviewTranscriptEntryResponse[]>
    >(`/ai-interview-transcripts/session/${sessionId}`);
    return response.data;
  },

  getProctoringRiskSummary: async (
    sessionId: string,
  ): Promise<ProctoringRiskSummaryResponse> => {
    const response = await apiClient.get<ProctoringRiskSummaryResponse>(
      `/interview-proctoring-events/session/${sessionId}/risk-summary`,
    );
    return response.data;
  },
};
