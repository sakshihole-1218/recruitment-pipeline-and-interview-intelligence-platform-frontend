import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api.types";
import type { CandidateDocumentResponse } from "@/features/candidates/types/candidates.types";
import { resumeAnalysisService } from "@/features/resumes/services/resumeAnalysis.service";
import type {
  CreateResumeAiAnalysisPayload,
  ListResumeAiAnalysesParams,
  ListResumeAiAnalysesResponse,
  RegenerateResumeAiAnalysisPayload,
  ResumeAiAnalysisResponse,
} from "@/features/resumes/types/resume.types";

export const resumeService = {
  listAnalyses: async (
    params: ListResumeAiAnalysesParams,
  ): Promise<ListResumeAiAnalysesResponse> => {
    return resumeAnalysisService.listAnalyses(params);
  },

  getAnalysisById: async (
    id: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.getAnalysisById(id);
  },

  getAnalysisByDocumentId: async (
    candidateDocumentId: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.getAnalysisByDocumentId(candidateDocumentId);
  },

  getLatestAnalysisByCandidate: async (
    candidateId: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.getLatestAnalysisByCandidate(candidateId);
  },

  createAnalysis: async (
    payload: CreateResumeAiAnalysisPayload,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.createAnalysis(payload);
  },

  startAnalysis: async (
    id: string,
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.startAnalysis(id);
  },

  regenerateByDocumentId: async (
    candidateDocumentId: string,
    payload: RegenerateResumeAiAnalysisPayload = {},
  ): Promise<ApiSuccessResponse<ResumeAiAnalysisResponse>> => {
    return resumeAnalysisService.regenerateByDocumentId(candidateDocumentId, payload);
  },

  uploadResume: async (
    candidateId: string,
    file: File,
  ): Promise<ApiSuccessResponse<CandidateDocumentResponse>> => {
    const form = new FormData();
    form.append("document_type", "RESUME");
    form.append("is_latest", "true");
    form.append("file", file);

    const response = await apiClient.post<ApiSuccessResponse<CandidateDocumentResponse>>(
      `/candidates/${candidateId}/documents/upload`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },
};
