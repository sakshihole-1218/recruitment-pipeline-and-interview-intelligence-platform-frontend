import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type { OffsetPaginatedApiResponse } from "@/types/pagination.types";

import type { ListRolesParams, RoleResponse } from "@/features/roles/types/roles.types";

const BASE = "/access-control/roles";

// NOTE:
// The backend Access Control Roles controller currently only supports:
// - GET /access-control/roles
// - GET /access-control/roles/:id
// No create/update/delete endpoints are present.

export const rolesService = {
  list: async (
    params: ListRolesParams,
  ): Promise<OffsetPaginatedApiResponse<RoleResponse>> => {
    const response = await apiClient.get<OffsetPaginatedApiResponse<RoleResponse>>(
      BASE,
      { params },
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiSuccessResponse<RoleResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<RoleResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },
};
