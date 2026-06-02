export const APPLICATION_CURRENT_STAGES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "DECISION",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "ON_HOLD",
] as const;

export type ApplicationCurrentStage =
  (typeof APPLICATION_CURRENT_STAGES)[number];

export const APPLICATION_STATUSES = [
  "ACTIVE",
  "CLOSED",
  "REJECTED",
  "HIRED",
  "WITHDRAWN",
  "ON_HOLD",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const SCREENING_RESULTS = ["SHORTLISTED", "REJECTED", "ON_HOLD"] as const;
export type ScreeningResult = (typeof SCREENING_RESULTS)[number];

export const APPLICATION_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "applied_at",
  "application_number",
  "last_stage_changed_at",
  "current_stage",
  "application_status",
  "is_priority",
] as const;

export type ApplicationsSortBy = (typeof APPLICATION_SORT_FIELDS)[number];

export interface ApplicationResponse {
  id: string;
  application_number: string;
  candidate_id: string;
  job_opening_id: string;
  applied_at: string;
  current_stage: ApplicationCurrentStage;
  application_status: ApplicationStatus;
  screening_score: string | null;
  fit_score: string | null;
  assigned_recruiter_user_id: string | null;
  assigned_hiring_manager_user_id: string | null;
  is_priority: boolean;
  rejection_reason: string | null;
  withdrawal_reason: string | null;
  last_stage_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStageHistoryResponse {
  id: string;
  application_id: string;
  from_stage: ApplicationCurrentStage | null;
  to_stage: ApplicationCurrentStage;
  changed_by_user_id: string;
  change_reason: string | null;
  changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface BulkOperationFailure {
  application_id: string;
  reason: string;
}

export interface BulkOperationResult {
  success_count: number;
  failed_count: number;
  successful_ids: string[];
  failures: BulkOperationFailure[];
}

export interface CreateApplicationPayload {
  candidate_id: string;
  job_opening_id: string;
  assigned_recruiter_user_id?: string;
  assigned_hiring_manager_user_id?: string;
  is_priority?: boolean;
}

export interface ListApplicationsParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination
  cursor?: string;

  // Filters
  application_number?: string;
  candidate_id?: string;
  job_opening_id?: string;
  current_stage?: ApplicationCurrentStage;
  application_status?: ApplicationStatus;
  assigned_recruiter_user_id?: string;
  assigned_hiring_manager_user_id?: string;
  is_priority?: boolean;
  applied_from?: string;
  applied_to?: string;

  // Sorting
  sort_by?: ApplicationsSortBy;
  sort_order?: "asc" | "desc";
}

export interface RejectApplicationPayload {
  rejection_reason: string;
}

export interface HoldApplicationPayload {
  change_reason?: string;
}

export interface WithdrawApplicationPayload {
  withdrawal_reason: string;
}

export interface CompleteApplicationScreeningPayload {
  screening_score: number;
  fit_score: number;
  screening_remarks?: string;
  screening_result: ScreeningResult;
}

export interface BulkMoveApplicationStagePayload {
  application_ids: string[];
  target_stage: ApplicationCurrentStage;
  change_reason: string;
}

export interface BulkRejectApplicationsPayload {
  application_ids: string[];
  rejection_reason: string;
}

export interface BulkAssignRecruiterPayload {
  application_ids: string[];
  recruiter_user_id: string;
}

export interface BulkAssignHiringManagerPayload {
  application_ids: string[];
  hiring_manager_user_id: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ACTIVE: "Active",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  HIRED: "Hired",
  WITHDRAWN: "Withdrawn",
  ON_HOLD: "On hold",
};

export const APPLICATION_STAGE_LABELS: Record<ApplicationCurrentStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  DECISION: "Decision",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ON_HOLD: "On hold",
};

export const SCREENING_RESULT_LABELS: Record<ScreeningResult, string> = {
  SHORTLISTED: "Shortlist",
  REJECTED: "Reject",
  ON_HOLD: "Put on hold",
};
