import { apiClient } from "@/lib/api-client";
import { ApiSuccessResponse } from "@/types/api.types";
import { OffsetPaginatedApiResponse } from "@/types/pagination.types";
import type {
  CreateUserPayload,
  ListUsersParams,
  RoleResponse,
  UpdateUserPayload,
  UserResponse,
} from "@/features/users/types/users.types";

const BASE = "/access-control/users";

export const usersService = {
  // -------------------------------------------------------------------------
  // List users (offset pagination)
  // -------------------------------------------------------------------------
  list: async (
    params: ListUsersParams,
  ): Promise<OffsetPaginatedApiResponse<UserResponse>> => {
    const response = await apiClient.get<
      OffsetPaginatedApiResponse<UserResponse>
    >(BASE, { params });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get user by id
  // -------------------------------------------------------------------------
  getById: async (id: string): Promise<ApiSuccessResponse<UserResponse>> => {
    const response =
      await apiClient.get<ApiSuccessResponse<UserResponse>>(`${BASE}/${id}`);
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create user
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateUserPayload,
  ): Promise<ApiSuccessResponse<UserResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<UserResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Update user (incl. activate / deactivate via is_active)
  // -------------------------------------------------------------------------
  update: async (
    id: string,
    payload: UpdateUserPayload,
  ): Promise<ApiSuccessResponse<UserResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<UserResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Assign role to user
  // -------------------------------------------------------------------------
  assignRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiSuccessResponse<UserResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<UserResponse>>(
      `${BASE}/${userId}/roles/${roleId}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Remove role from user
  // -------------------------------------------------------------------------
  removeRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiSuccessResponse<UserResponse>> => {
    const response = await apiClient.delete<ApiSuccessResponse<UserResponse>>(
      `${BASE}/${userId}/roles/${roleId}`,
    );
    return response.data;
  },
};

// -------------------------------------------------------------------------
// Roles service (for role selector in forms)
// -------------------------------------------------------------------------
export const rolesService = {
  list: async (): Promise<OffsetPaginatedApiResponse<RoleResponse>> => {
    const response = await apiClient.get<
      OffsetPaginatedApiResponse<RoleResponse>
    >("/access-control/roles", { params: { limit: 100 } });
    return response.data;
  },
};
