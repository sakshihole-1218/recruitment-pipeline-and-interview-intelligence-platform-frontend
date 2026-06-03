import type { ApiSuccessResponse } from "@/types/api.types";

// ---------------------------------------------------------------------------
// Enums (must match backend)
// ---------------------------------------------------------------------------
export const INTERVIEW_ROUND_TYPES = [
  "SCREENING",
  "TECHNICAL",
  "MANAGERIAL",
  "HR",
  "ASSIGNMENT",
  "FINAL",
] as const;

export type InterviewRoundType = (typeof INTERVIEW_ROUND_TYPES)[number];

export const INTERVIEW_ROUND_TYPE_LABELS: Record<InterviewRoundType, string> = {
  SCREENING: "Screening",
  TECHNICAL: "Technical",
  MANAGERIAL: "Managerial",
  HR: "HR",
  ASSIGNMENT: "Assignment",
  FINAL: "Final",
};

// ---------------------------------------------------------------------------
// DTO-aligned Types
// ---------------------------------------------------------------------------
export interface InterviewRoundResponse {
  id: string;
  job_opening_id: string;
  round_name: string;
  round_type: InterviewRoundType;
  sequence_number: number;
  is_mandatory: boolean;
  max_score: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewRoundPayload {
  job_opening_id: string;
  round_name: string;
  round_type: InterviewRoundType;
  sequence_number: number;
  is_mandatory?: boolean;
  max_score?: number;
  description?: string;
}

export interface UpdateInterviewRoundPayload {
  round_name?: string;
  round_type?: InterviewRoundType;
  sequence_number?: number;
  is_mandatory?: boolean;
  max_score?: number;
  description?: string;
}

export interface ListInterviewRoundsByJobOpeningParams {
  job_opening_id: string;
}

export type ListInterviewRoundsByJobOpeningResponse = ApiSuccessResponse<
  InterviewRoundResponse[]
>;
