import { apiClient } from "@/lib/api-client";
import type {
  CreateInterviewerReviewPayload,
  InterviewerReviewDetailResponse,
  InterviewerReviewsResponse,
  SubmitInterviewerReviewPayload,
  UpdateInterviewerReviewPayload,
} from "@/features/feedback/types/feedback.types";

const BASE = "/interviewer-reviews";

export const interviewerReviewService = {
  create: async (
    payload: CreateInterviewerReviewPayload,
  ): Promise<InterviewerReviewDetailResponse> => {
    const response = await apiClient.post<InterviewerReviewDetailResponse>(
      BASE,
      payload,
    );
    return response.data;
  },

  getById: async (id: string): Promise<InterviewerReviewDetailResponse> => {
    const response = await apiClient.get<InterviewerReviewDetailResponse>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  getBySession: async (sessionId: string): Promise<InterviewerReviewsResponse> => {
    const response = await apiClient.get<InterviewerReviewsResponse>(
      `${BASE}/session/${sessionId}`,
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateInterviewerReviewPayload,
  ): Promise<InterviewerReviewDetailResponse> => {
    const response = await apiClient.patch<InterviewerReviewDetailResponse>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  submit: async (
    id: string,
    payload: SubmitInterviewerReviewPayload,
  ): Promise<InterviewerReviewDetailResponse> => {
    const response = await apiClient.patch<InterviewerReviewDetailResponse>(
      `${BASE}/${id}/submit`,
      payload,
    );
    return response.data;
  },
};
