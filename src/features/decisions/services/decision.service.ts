import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CreateDecisionPayload,
  DecisionDetailResponse,
  DecisionResponse,
  DeleteDecisionResponse,
  EligibleDecisionApplicationsResponse,
  ListDecisionsParams,
  ListDecisionsResponse,
  UpdateDecisionPayload,
} from "@/features/decisions/types/decision.types";

const BASE = "/decisions";

export const decisionService = {
  list: async (params: ListDecisionsParams): Promise<ListDecisionsResponse> => {
    const response = await apiClient.get<ListDecisionsResponse>(BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<DecisionDetailResponse> => {
    const response = await apiClient.get<DecisionDetailResponse>(`${BASE}/${id}`);
    return response.data;
  },

  getByApplicationId: async (
    applicationId: string,
  ): Promise<DecisionDetailResponse> => {
    const response = await apiClient.get<DecisionDetailResponse>(
      `${BASE}/application/${applicationId}`,
    );
    return response.data;
  },

  getEligibleApplications: async (): Promise<EligibleDecisionApplicationsResponse> => {
    const response = await apiClient.get<EligibleDecisionApplicationsResponse>(
      `${BASE}/eligible-applications`,
    );
    return response.data;
  },

  create: async (
    payload: CreateDecisionPayload,
  ): Promise<ApiSuccessResponse<DecisionResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<DecisionResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateDecisionPayload,
  ): Promise<ApiSuccessResponse<DecisionResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<DecisionResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  softDelete: async (
    id: string,
  ): Promise<ApiSuccessResponse<DeleteDecisionResponse>> => {
    const response = await apiClient.delete<ApiSuccessResponse<DeleteDecisionResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },
};
