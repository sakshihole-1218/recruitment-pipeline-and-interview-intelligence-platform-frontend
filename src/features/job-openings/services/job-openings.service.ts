import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  CreateJobOpeningPayload,
  JobOpeningResponse,
  ListJobOpeningsParams,
  ReplaceJobOpeningSkillsPayload,
  SoftDeleteJobOpeningData,
  UpdateJobOpeningPayload,
} from "@/features/job-openings/types/job-openings.types";

const BASE = "/job-openings";

export type ListJobOpeningsResponse =
  | OffsetPaginatedApiResponse<JobOpeningResponse>
  | CursorPaginatedApiResponse<JobOpeningResponse>;

export const jobOpeningsService = {
  // -------------------------------------------------------------------------
  // List job openings (offset or cursor)
  // -------------------------------------------------------------------------
  list: async (params: ListJobOpeningsParams): Promise<ListJobOpeningsResponse> => {
    const response = await apiClient.get<ListJobOpeningsResponse>(BASE, {
      params,
    });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get job opening by id
  // -------------------------------------------------------------------------
  getById: async (id: string): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create job opening (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateJobOpeningPayload,
  ): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<JobOpeningResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Update job opening fields (skills via /:id/skills)
  // -------------------------------------------------------------------------
  update: async (
    id: string,
    payload: UpdateJobOpeningPayload,
  ): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Replace job opening skills (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  replaceSkills: async (
    id: string,
    payload: ReplaceJobOpeningSkillsPayload,
  ): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.put<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}/skills`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Status actions (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  publish: async (id: string): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}/publish`,
    );
    return response.data;
  },

  unpublish: async (
    id: string,
  ): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}/unpublish`,
    );
    return response.data;
  },

  open: async (id: string): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}/open`,
    );
    return response.data;
  },

  close: async (id: string): Promise<ApiSuccessResponse<JobOpeningResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<JobOpeningResponse>>(
      `${BASE}/${id}/close`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Soft delete job opening (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  softDelete: async (id: string): Promise<ApiSuccessResponse<SoftDeleteJobOpeningData>> => {
    const response = await apiClient.delete<
      ApiSuccessResponse<SoftDeleteJobOpeningData>
    >(`${BASE}/${id}`);

    return response.data;
  },
};
