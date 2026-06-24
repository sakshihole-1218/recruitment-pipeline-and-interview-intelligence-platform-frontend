import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";

export const RESUME_ANALYSIS_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type ResumeAnalysisStatus = (typeof RESUME_ANALYSIS_STATUSES)[number];

export const RESUME_ANALYSIS_STATUS_LABELS: Record<ResumeAnalysisStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export interface ResumeAiAnalysisResponse {
  id: string;
  candidate_id: string;
  candidate_document_id: string;
  application_id: string | null;
  extracted_text: string | null;
  parsed_resume_json: unknown | null;
  skills_extracted: unknown;
  experience_summary: string | null;
  education_summary: string | null;
  project_summary: string | null;
  certification_summary: string | null;
  total_experience_years_detected: string | null;
  ai_fit_score: string | null;
  analysis_status: ResumeAnalysisStatus;
  failure_reason: string | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeAiAnalysisPayload {
  candidate_document_id: string;
  application_id?: string;
  extracted_text?: string;
}

export interface RegenerateResumeAiAnalysisPayload {
  extracted_text?: string;
}

export interface ListResumeAiAnalysesParams {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  candidate_id?: string;
  application_id?: string;
  candidate_document_id?: string;
  analysis_status?: ResumeAnalysisStatus;
  analyzed_from?: string;
  analyzed_to?: string;
  sort_by?: "created_at" | "updated_at" | "analyzed_at" | "analysis_status";
  sort_order?: "asc" | "desc";
}

export type ListResumeAiAnalysesResponse =
  | OffsetPaginatedApiResponse<ResumeAiAnalysisResponse>
  | CursorPaginatedApiResponse<ResumeAiAnalysisResponse>;

export interface ResumeListRow {
  id: string;
  analysis_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string | null;
  application_id: string | null;
  job_applied: string;
  candidate_document_id: string;
  resume_file_name: string;
  resume_file_url: string | null;
  mime_type: string | null;
  upload_date: string | null;
  analysis_status: ResumeAnalysisStatus;
  ai_fit_score: number | null;
}
