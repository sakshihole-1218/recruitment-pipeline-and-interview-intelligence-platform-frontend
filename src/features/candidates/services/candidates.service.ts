import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type {
  CandidateDocumentResponse,
  CandidateResponse,
  CandidateSkillResponse,
  CreateCandidatePayload,
  ListCandidatesParams,
  RemoveCandidateSkillData,
  SoftDeleteCandidateData,
  UpdateCandidatePayload,
  UploadCandidateDocumentPayload,
  UpsertCandidateSkillsPayload,
} from "@/features/candidates/types/candidates.types";

const BASE = "/candidates";

export type ListCandidatesResponse =
  | OffsetPaginatedApiResponse<CandidateResponse>
  | CursorPaginatedApiResponse<CandidateResponse>;

export const candidatesService = {
  // -------------------------------------------------------------------------
  // List candidates (offset or cursor)
  // -------------------------------------------------------------------------
  list: async (params: ListCandidatesParams): Promise<ListCandidatesResponse> => {
    const response = await apiClient.get<ListCandidatesResponse>(BASE, { params });
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Get candidate by id
  // -------------------------------------------------------------------------
  getById: async (id: string): Promise<ApiSuccessResponse<CandidateResponse>> => {
    const response = await apiClient.get<ApiSuccessResponse<CandidateResponse>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Create candidate (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  create: async (
    payload: CreateCandidatePayload,
  ): Promise<ApiSuccessResponse<CandidateResponse>> => {
    const response = await apiClient.post<ApiSuccessResponse<CandidateResponse>>(
      BASE,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Update candidate (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  update: async (
    id: string,
    payload: UpdateCandidatePayload,
  ): Promise<ApiSuccessResponse<CandidateResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<CandidateResponse>>(
      `${BASE}/${id}`,
      payload,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Soft delete candidate (ADMIN/RECRUITER)
  // -------------------------------------------------------------------------
  softDelete: async (id: string): Promise<ApiSuccessResponse<SoftDeleteCandidateData>> => {
    const response = await apiClient.delete<ApiSuccessResponse<SoftDeleteCandidateData>>(
      `${BASE}/${id}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Skills
  // -------------------------------------------------------------------------
  listSkills: async (id: string): Promise<ApiSuccessResponse<CandidateSkillResponse[]>> => {
    const response = await apiClient.get<ApiSuccessResponse<CandidateSkillResponse[]>>(
      `${BASE}/${id}/skills`,
    );
    return response.data;
  },

  upsertSkills: async (
    id: string,
    payload: UpsertCandidateSkillsPayload,
  ): Promise<ApiSuccessResponse<CandidateSkillResponse[]>> => {
    const response = await apiClient.put<ApiSuccessResponse<CandidateSkillResponse[]>>(
      `${BASE}/${id}/skills`,
      payload,
    );
    return response.data;
  },

  removeSkill: async (
    id: string,
    skillId: string,
  ): Promise<ApiSuccessResponse<RemoveCandidateSkillData>> => {
    const response = await apiClient.delete<ApiSuccessResponse<RemoveCandidateSkillData>>(
      `${BASE}/${id}/skills/${skillId}`,
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------
  listDocuments: async (
    id: string,
  ): Promise<ApiSuccessResponse<CandidateDocumentResponse[]>> => {
    const response = await apiClient.get<ApiSuccessResponse<CandidateDocumentResponse[]>>(
      `${BASE}/${id}/documents`,
    );
    return response.data;
  },

  uploadDocument: async (
    id: string,
    payload: UploadCandidateDocumentPayload,
  ): Promise<ApiSuccessResponse<CandidateDocumentResponse>> => {
    const form = new FormData();
    form.append("document_type", payload.document_type);
    if (payload.is_latest !== undefined) {
      form.append("is_latest", String(payload.is_latest));
    }
    form.append("file", payload.file);

    const response = await apiClient.post<ApiSuccessResponse<CandidateDocumentResponse>>(
      `${BASE}/${id}/documents/upload`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  markLatestResume: async (
    id: string,
    documentId: string,
  ): Promise<ApiSuccessResponse<CandidateDocumentResponse>> => {
    const response = await apiClient.patch<ApiSuccessResponse<CandidateDocumentResponse>>(
      `${BASE}/${id}/documents/${documentId}/latest`,
    );
    return response.data;
  },
};
