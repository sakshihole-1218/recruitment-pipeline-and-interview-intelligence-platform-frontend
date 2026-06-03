import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CreateInterviewRoundPayload,
  InterviewRoundResponse,
  ListInterviewRoundsByJobOpeningParams,
  ListInterviewRoundsByJobOpeningResponse,
  UpdateInterviewRoundPayload,
} from "@/features/interview-rounds/types/interview-rounds.types";

const BASE = "/interviews/rounds";

export const interviewRoundsService = {
  listByJobOpening: async (
    params: ListInterviewRoundsByJobOpeningParams,
  ): Promise<ListInterviewRoundsByJobOpeningResponse> => {
    const response = await apiClient.get<ListInterviewRoundsByJobOpeningResponse>(BASE, {
      params,
    });
    return response.data;
  },

  create: async (
    payload: CreateInterviewRoundPayload,
  ): Promise<ApiSuccessResponse<InterviewRoundResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<InterviewRoundResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateInterviewRoundPayload,
  ): Promise<ApiSuccessResponse<InterviewRoundResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<InterviewRoundResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },
};
