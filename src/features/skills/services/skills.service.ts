import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  CreateSkillPayload,
  ListSkillsParams,
  SkillResponse,
  SoftDeleteSkillData,
  UpdateSkillPayload,
  UpdateSkillStatusPayload,
} from "@/features/skills/types/skills.types";

const BASE = "/skills";

export type ListSkillsResponse =
  | OffsetPaginatedApiResponse<SkillResponse>
  | CursorPaginatedApiResponse<SkillResponse>;

export const skillsService = {
  // -------------------------------------------------------------------------
  // List skills (offset or cursor)
  // -------------------------------------------------------------------------
  list: async (params: ListSkillsParams): Promise<ListSkillsResponse> => {
    const response = await apiClient.get<ListSkillsResponse>(BASE, { params });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get skill by id
  // -------------------------------------------------------------------------
  getById: async (id: string): Promise<ApiSuccessResponse<SkillResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<SkillResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create skill (ADMIN)
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateSkillPayload,
  ): Promise<ApiSuccessResponse<SkillResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<SkillResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Update skill (ADMIN)
  // -------------------------------------------------------------------------
  update: async (
    id: string,
    payload: UpdateSkillPayload,
  ): Promise<ApiSuccessResponse<SkillResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<SkillResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Activate / Deactivate skill (ADMIN)
  // -------------------------------------------------------------------------
  updateStatus: async (
    id: string,
    payload: UpdateSkillStatusPayload,
  ): Promise<ApiSuccessResponse<SkillResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<SkillResponse>>(
      `${BASE}/${id}/status`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Soft delete skill (ADMIN)
  // -------------------------------------------------------------------------
  softDelete: async (id: string): Promise<ApiSuccessResponse<SoftDeleteSkillData>> => {
    const response = await apiClient.delete<ApiSuccessResponse<SoftDeleteSkillData>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },
};
