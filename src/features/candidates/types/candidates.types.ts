export const CANDIDATE_GENDERS = [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type CandidateGender = (typeof CANDIDATE_GENDERS)[number];

export const CANDIDATE_SOURCE_TYPES = [
  "REFERRAL",
  "LINKEDIN",
  "COMPANY_PORTAL",
  "JOB_BOARD",
  "AGENCY",
  "WALK_IN",
  "OTHER",
] as const;

export type CandidateSourceType = (typeof CANDIDATE_SOURCE_TYPES)[number];

export const CANDIDATE_DOCUMENT_TYPES = [
  "RESUME",
  "COVER_LETTER",
  "PORTFOLIO",
  "CERTIFICATION",
  "ID_PROOF",
  "OTHER",
] as const;

export type CandidateDocumentType = (typeof CANDIDATE_DOCUMENT_TYPES)[number];

export const CANDIDATE_SKILL_PROFICIENCY_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;

export type CandidateSkillProficiencyLevel =
  (typeof CANDIDATE_SKILL_PROFICIENCY_LEVELS)[number];

export const CANDIDATE_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "first_name",
  "last_name",
  "email",
  "current_location",
  "total_experience_years",
  "is_active",
] as const;

export type CandidateSortBy = (typeof CANDIDATE_SORT_FIELDS)[number];

export interface CandidateResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: CandidateGender | null;
  total_experience_years: string | null;
  current_company: string | null;
  current_job_title: string | null;
  current_location: string | null;
  notice_period_days: number | null;
  current_salary: string | null;
  expected_salary: string | null;
  currency_code: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_headline: string | null;
  source_type: CandidateSourceType | null;
  source_details: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string;
  gender?: CandidateGender;
  total_experience_years?: number;
  current_company?: string;
  current_job_title?: string;
  current_location?: string;
  notice_period_days?: number;
  current_salary?: number;
  expected_salary?: number;
  currency_code?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_headline?: string;
  source_type?: CandidateSourceType;
  source_details?: string;
  is_active?: boolean;
}

export type UpdateCandidatePayload = Partial<CreateCandidatePayload>;

export interface ListCandidatesParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination (when present, backend switches to cursor mode)
  cursor?: string;

  // Filters
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source_type?: CandidateSourceType;
  current_location?: string;
  total_experience_years?: number;
  is_active?: boolean;
  skill_id?: string;

  // Sorting
  sort_by?: CandidateSortBy;
  sort_order?: "ASC" | "DESC";
}

export interface SoftDeleteCandidateData {
  id: string;
}

export interface CandidateSkillInput {
  skill_id: string;
  years_of_experience?: number | null;
  proficiency_level?: CandidateSkillProficiencyLevel | null;
  is_primary?: boolean;
}

export interface UpsertCandidateSkillsPayload {
  skills: CandidateSkillInput[];
}

export interface CandidateSkillResponse {
  id: string;
  candidate_id: string;
  skill_id: string;
  years_of_experience: string | null;
  proficiency_level: CandidateSkillProficiencyLevel | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  skill_name?: string | null;
  skill_code?: string | null;
}

export interface RemoveCandidateSkillData {
  candidate_id: string;
  skill_id: string;
}

export interface CandidateDocumentResponse {
  id: string;
  candidate_id: string;
  document_type: CandidateDocumentType;
  file_name: string;
  file_url: string;
  file_size: string | null;
  mime_type: string | null;
  uploaded_at: string | null;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadCandidateDocumentPayload {
  document_type: CandidateDocumentType;
  is_latest?: boolean;
  file: File;
}

export const CANDIDATE_GENDER_LABELS: Record<CandidateGender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export const CANDIDATE_SOURCE_TYPE_LABELS: Record<CandidateSourceType, string> = {
  REFERRAL: "Referral",
  LINKEDIN: "LinkedIn",
  COMPANY_PORTAL: "Company Portal",
  JOB_BOARD: "Job Board",
  AGENCY: "Agency",
  WALK_IN: "Walk-in",
  OTHER: "Other",
};

export const CANDIDATE_DOCUMENT_TYPE_LABELS: Record<CandidateDocumentType, string> = {
  RESUME: "Resume",
  COVER_LETTER: "Cover Letter",
  PORTFOLIO: "Portfolio",
  CERTIFICATION: "Certification",
  ID_PROOF: "ID Proof",
  OTHER: "Other",
};

export const CANDIDATE_SKILL_PROFICIENCY_LABELS: Record<
  CandidateSkillProficiencyLevel,
  string
> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};
