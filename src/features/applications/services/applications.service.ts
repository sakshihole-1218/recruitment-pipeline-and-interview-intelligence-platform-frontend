import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  ApplicationResponse,
  ApplicationStageHistoryResponse,
  BulkAssignHiringManagerPayload,
  BulkAssignRecruiterPayload,
  BulkMoveApplicationStagePayload,
  BulkOperationResult,
  BulkRejectApplicationsPayload,
  CompleteApplicationScreeningPayload,
  CreateApplicationPayload,
  HoldApplicationPayload,
  ListApplicationsParams,
  RejectApplicationPayload,
  WithdrawApplicationPayload,
} from "@/features/applications/types/applications.types";

const BASE = "/applications";

export type ListApplicationsResponse =
  | OffsetPaginatedApiResponse<ApplicationResponse>
  | CursorPaginatedApiResponse<ApplicationResponse>;

export const applicationsService = {
  // -------------------------------------------------------------------------
  // List applications (offset or cursor)
  // -------------------------------------------------------------------------
  list: async (params: ListApplicationsParams): Promise<ListApplicationsResponse> => {
    const response = await apiClient.get<ListApplicationsResponse>(BASE, { params });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get application by id
  // -------------------------------------------------------------------------
  getById: async (id: string): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create application (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateApplicationPayload,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Stage / status actions (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  startScreening: async (
    id: string,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}/start-screening`,
    );
    return response.data;
  },

  completeScreening: async (
    id: string,
    payload: CompleteApplicationScreeningPayload,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}/complete-screening`,
      payload,
    );
    return response.data;
  },

  reject: async (
    id: string,
    payload: RejectApplicationPayload,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}/reject`,
      payload,
    );
    return response.data;
  },

  hold: async (
    id: string,
    payload: HoldApplicationPayload,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}/hold`,
      payload,
    );
    return response.data;
  },

  withdraw: async (
    id: string,
    payload: WithdrawApplicationPayload,
  ): Promise<ApiSuccessResponse<ApplicationResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<ApplicationResponse>>(
      `${BASE}/${id}/withdraw`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Stage history
  // -------------------------------------------------------------------------
  listStageHistory: async (
    id: string,
  ): Promise<ApiSuccessResponse<ApplicationStageHistoryResponse[]>> => {
    const response = await apiClient.get<
      ApiSuccessResponse<ApplicationStageHistoryResponse[]>
    >(`${BASE}/${id}/stage-history`);
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Bulk actions (ADMIN/RECRUITER) — can be used for single-row actions too
  // -------------------------------------------------------------------------
  bulkMoveStage: async (
    payload: BulkMoveApplicationStagePayload,
  ): Promise<ApiSuccessResponse<BulkOperationResult>> => {
    const response = await apiClient.post<ApiSuccessResponse<BulkOperationResult>>(
      `${BASE}/bulk/move-stage`,
      payload,
    );
    return response.data;
  },

  bulkReject: async (
    payload: BulkRejectApplicationsPayload,
  ): Promise<ApiSuccessResponse<BulkOperationResult>> => {
    const response = await apiClient.post<ApiSuccessResponse<BulkOperationResult>>(
      `${BASE}/bulk/reject`,
      payload,
    );
    return response.data;
  },

  bulkAssignRecruiter: async (
    payload: BulkAssignRecruiterPayload,
  ): Promise<ApiSuccessResponse<BulkOperationResult>> => {
    const response = await apiClient.post<ApiSuccessResponse<BulkOperationResult>>(
      `${BASE}/bulk/assign-recruiter`,
      payload,
    );
    return response.data;
  },

  bulkAssignHiringManager: async (
    payload: BulkAssignHiringManagerPayload,
  ): Promise<ApiSuccessResponse<BulkOperationResult>> => {
    const response = await apiClient.post<ApiSuccessResponse<BulkOperationResult>>(
      `${BASE}/bulk/assign-hiring-manager`,
      payload,
    );
    return response.data;
  },
};
