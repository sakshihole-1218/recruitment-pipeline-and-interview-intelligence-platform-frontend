import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  CreateDepartmentPayload,
  DepartmentResponse,
  ListDepartmentsParams,
  SoftDeleteDepartmentData,
  UpdateDepartmentPayload,
  UpdateDepartmentStatusPayload,
} from "@/features/departments/types/departments.types";

const BASE = "/departments";

export type ListDepartmentsResponse =
  | OffsetPaginatedApiResponse<DepartmentResponse>
  | CursorPaginatedApiResponse<DepartmentResponse>;

export const departmentsService = {
  // -------------------------------------------------------------------------
  // List departments (offset or cursor)
  // -------------------------------------------------------------------------
  list: async (params: ListDepartmentsParams): Promise<ListDepartmentsResponse> => {
    const response = await apiClient.get<ListDepartmentsResponse>(BASE, {
      params,
    });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get department by id
  // -------------------------------------------------------------------------
  getById: async (
    id: string,
  ): Promise<ApiSuccessResponse<DepartmentResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<DepartmentResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create department (ADMIN)
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateDepartmentPayload,
  ): Promise<ApiSuccessResponse<DepartmentResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<DepartmentResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Update department (ADMIN)
  // -------------------------------------------------------------------------
  update: async (
    id: string,
    payload: UpdateDepartmentPayload,
  ): Promise<ApiSuccessResponse<DepartmentResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<DepartmentResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Activate / Deactivate department (ADMIN)
  // -------------------------------------------------------------------------
  updateStatus: async (
    id: string,
    payload: UpdateDepartmentStatusPayload,
  ): Promise<ApiSuccessResponse<DepartmentResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<DepartmentResponse>>(
      `${BASE}/${id}/status`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Soft delete department (ADMIN)
  // -------------------------------------------------------------------------
  softDelete: async (id: string): Promise<ApiSuccessResponse<SoftDeleteDepartmentData>> => {
    const response = await apiClient.delete<
      ApiSuccessResponse<SoftDeleteDepartmentData>
    >(`${BASE}/${id}`);
    return response.data;
  },
};
