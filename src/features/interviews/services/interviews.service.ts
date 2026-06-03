import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CancelInterviewPayload,
  InterviewDetailResponse,
  InterviewResponse,
  ListInterviewsParams,
  ListInterviewsResponse,
  ReplaceInterviewPanelMembersPayload,
  RescheduleInterviewPayload,
  ScheduleInterviewPayload,
} from "@/features/interviews/types/interviews.types";

const BASE = "/interviews";

export const interviewsService = {
  list: async (params: ListInterviewsParams): Promise<ListInterviewsResponse> => {
    const response = await apiClient.get<ListInterviewsResponse>(BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<InterviewDetailResponse> => {
    const response = await apiClient.get<InterviewDetailResponse>(`${BASE}/${id}`);
    return response.data;
  },

  schedule: async (
    payload: ScheduleInterviewPayload,
  ): Promise<ApiSuccessResponse<InterviewResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<InterviewResponse>>(BASE, payload);
    return response.data;
  },

  reschedule: async (
    id: string,
    payload: RescheduleInterviewPayload,
  ): Promise<ApiSuccessResponse<InterviewResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<InterviewResponse>>(
      `${BASE}/${id}/reschedule`,
      payload,
    );
    return response.data;
  },

  cancel: async (
    id: string,
    payload: CancelInterviewPayload,
  ): Promise<ApiSuccessResponse<InterviewResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<InterviewResponse>>(
      `${BASE}/${id}/cancel`,
      payload,
    );
    return response.data;
  },

  complete: async (id: string): Promise<ApiSuccessResponse<InterviewResponse>> => {
    // Backend expects CompleteInterviewDto body; not needed for foundation yet.
    // TODO: Implement payload once UI for completion is required.
    const response = await apiClient.post<ApiSuccessResponse<InterviewResponse>>(
      `${BASE}/${id}/complete`,
      {},
    );
    return response.data;
  },

  replacePanelMembers: async (
    id: string,
    payload: ReplaceInterviewPanelMembersPayload,
  ): Promise<ApiSuccessResponse<InterviewResponse>> => {
    const response = await apiClient.put<ApiSuccessResponse<InterviewResponse>>(
      `${BASE}/${id}/panel-members`,
      payload,
    );
    return response.data;
  },
};
