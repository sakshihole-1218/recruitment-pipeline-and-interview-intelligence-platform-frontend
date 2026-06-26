"use client";

import type { ApiSuccessResponse } from "@/types/api.types";
import type {
  CursorPaginatedApiResponse,
  OffsetPaginatedApiResponse,
} from "@/types/pagination.types";
import type { ApplicationCurrentStage } from "@/features/applications/types/applications.types";
import type {
  AiInterviewRecommendation,
  InterviewerRecommendation,
  InterviewerReviewResponse,
} from "@/features/feedback/types/feedback.types";
import type { ResumeAiAnalysisResponse } from "@/features/resumes/types/resume.types";

export const DECISION_STATUSES = [
  "SELECTED",
  "REJECTED",
  "HOLD",
  "OFFER_IN_PROGRESS",
  "OFFERED",
  "HIRED",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_SOURCES = [
  "MANUAL",
  "HUMAN_INTERVIEW",
  "AI_INTERVIEW",
  "HYBRID",
] as const;

export type DecisionSource = (typeof DECISION_SOURCES)[number];

export const DECISION_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "decision_at",
  "decision_status",
] as const;

export type DecisionSortBy = (typeof DECISION_SORT_FIELDS)[number];

export interface DecisionResponse {
  id: string;
  application_id: string;
  decision_status: DecisionStatus;
  decision_reason: string | null;
  decision_notes: string | null;
  decided_by_user_id: string;
  ai_interview_session_id: string | null;
  ai_interview_feedback_id: string | null;
  decision_source: DecisionSource | null;
  final_score: string | null;
  ai_recommendation_snapshot: Record<string, unknown> | null;
  interviewer_recommendation_snapshot: Record<string, unknown> | null;
  proctoring_risk_snapshot: Record<string, unknown> | null;
  decision_at: string;
  created_at: string;
  updated_at: string;
}

export interface EligibleDecisionApplication {
  id: string;
  application_number: string;
  candidate_id: string;
  job_opening_id: string;
  current_stage: string;
  application_status: string;
  assigned_hiring_manager_user_id: string | null;
  updated_at: string;
}

export interface CreateDecisionPayload {
  application_id: string;
  decision_status: DecisionStatus;
  decision_reason?: string;
  decision_notes?: string;
  decided_by_user_id?: string;
  ai_interview_session_id?: string;
  ai_interview_feedback_id?: string;
  decision_source?: DecisionSource;
}

export interface UpdateDecisionPayload {
  decision_status?: DecisionStatus;
  decision_reason?: string;
  decision_notes?: string;
  decision_source?: DecisionSource;
}

export interface ListDecisionsParams {
  page?: number;
  limit?: number;
  cursor?: string;
  application_id?: string;
  decision_status?: DecisionStatus;
  decided_by_user_id?: string;
  decision_source?: DecisionSource;
  decision_from?: string;
  decision_to?: string;
  sort_by?: DecisionSortBy;
  sort_order?: "asc" | "desc";
}

export type ListDecisionsResponse =
  | OffsetPaginatedApiResponse<DecisionResponse>
  | CursorPaginatedApiResponse<DecisionResponse>;

export type DecisionDetailResponse = ApiSuccessResponse<DecisionResponse>;
export type EligibleDecisionApplicationsResponse =
  ApiSuccessResponse<EligibleDecisionApplication[]>;

export interface DeleteDecisionResponse {
  id: string;
}

export const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
  SELECTED: "Selected",
  REJECTED: "Rejected",
  HOLD: "Hold",
  OFFER_IN_PROGRESS: "Offer in progress",
  OFFERED: "Offered",
  HIRED: "Hired",
};

export const DECISION_SOURCE_LABELS: Record<DecisionSource, string> = {
  MANUAL: "Manual",
  HUMAN_INTERVIEW: "Human interview",
  AI_INTERVIEW: "AI interview",
  HYBRID: "Hybrid",
};

export interface DecisionReadiness {
  canCreateOrUpdate: boolean;
  missingItems: string[];
}

export interface DecisionFormValues {
  application_id: string;
  decision_status: DecisionStatus;
  decision_reason: string;
  decision_notes: string;
}

export interface DecisionSummaryMetrics {
  candidateName: string;
  resumeScore: string;
  interviewScore: string;
  humanRecommendation: string;
  currentStage: ApplicationCurrentStage | string;
}

export interface DecisionWorkspaceBundle {
  resumeAnalysis: ResumeAiAnalysisResponse | null;
  interviewerReviews: InterviewerReviewResponse[];
  aiRecommendation: AiInterviewRecommendation | null;
  humanRecommendation: InterviewerRecommendation | null;
}
