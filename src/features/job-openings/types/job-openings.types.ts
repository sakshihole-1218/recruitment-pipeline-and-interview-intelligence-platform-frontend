export const JOB_OPENING_STATUSES = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export type JobOpeningStatus = (typeof JOB_OPENING_STATUSES)[number];

export const JOB_OPENING_STATUS_LABELS: Record<JobOpeningStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERN: "Intern",
};

export const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: "Onsite",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const SKILL_PROFICIENCY_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;

export type SkillProficiencyLevel = (typeof SKILL_PROFICIENCY_LEVELS)[number];

export const SKILL_PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export type JobOpeningSortBy =
  | "created_at"
  | "updated_at"
  | "title"
  | "code"
  | "status"
  | "published_at"
  | "closed_at"
  | "is_active";

export interface JobOpeningSkillResponse {
  id: string;
  skill_id: string;
  proficiency_level: SkillProficiencyLevel;
  is_mandatory: boolean;
  years_of_experience_required: number | null;
  created_at: string;
  updated_at: string;
  skill_name?: string;
  skill_code?: string;
  skill_category?: string;
}

export interface JobOpeningResponse {
  id: string;
  title: string;
  code: string;
  department_id: string;
  department_name?: string | null;
  hiring_manager_user_id: string;
  recruiter_user_id: string;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  experience_min_years: number | null;
  experience_max_years: number | null;
  min_salary: string | null;
  max_salary: string | null;
  currency_code: string | null;
  openings_count: number;
  job_description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  location: string | null;
  status: JobOpeningStatus;
  published_at: string | null;
  closed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  skills?: JobOpeningSkillResponse[];
}

export interface JobOpeningSkillInput {
  skill_id: string;
  proficiency_level: SkillProficiencyLevel;
  is_mandatory?: boolean;
  years_of_experience_required?: number | null;
}

export interface CreateJobOpeningPayload {
  title: string;
  code: string;
  department_id: string;
  hiring_manager_user_id: string;
  recruiter_user_id: string;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  experience_min_years?: number;
  experience_max_years?: number;
  min_salary?: number;
  max_salary?: number;
  currency_code?: string;
  openings_count: number;
  job_description?: string;
  responsibilities?: string;
  requirements?: string;
  location?: string;
  status?: JobOpeningStatus;
  is_active?: boolean;
  skills?: JobOpeningSkillInput[];
}

export interface UpdateJobOpeningPayload {
  title?: string;
  code?: string;
  department_id?: string;
  hiring_manager_user_id?: string;
  recruiter_user_id?: string;
  employment_type?: EmploymentType;
  work_mode?: WorkMode;
  experience_min_years?: number;
  experience_max_years?: number;
  min_salary?: number;
  max_salary?: number;
  currency_code?: string | null;
  openings_count?: number;
  job_description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  location?: string | null;
  status?: JobOpeningStatus;
  is_active?: boolean;
}

export interface ReplaceJobOpeningSkillsPayload {
  skills: JobOpeningSkillInput[];
}

export interface ListJobOpeningsParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination (when present, backend switches to cursor mode)
  cursor?: string;

  // Filters
  title?: string;
  code?: string;
  department_id?: string;
  recruiter_user_id?: string;
  hiring_manager_user_id?: string;
  employment_type?: EmploymentType;
  work_mode?: WorkMode;
  status?: JobOpeningStatus;
  is_active?: boolean;

  // Sorting
  sort_by?: JobOpeningSortBy;
  sort_order?: "ASC" | "DESC";
}

export interface SoftDeleteJobOpeningData {
  id: string;
}
