export const SKILL_CATEGORIES = [
  "LANGUAGE",
  "FRAMEWORK",
  "DATABASE",
  "DEVOPS",
  "CLOUD",
  "TECHNICAL",
  "TOOL",
  "OTHER",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type SkillSortBy =
  | "created_at"
  | "updated_at"
  | "name"
  | "code"
  | "category"
  | "is_active";

export interface SkillResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: SkillCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillPayload {
  name: string;
  code: string;
  description?: string | null;
  category: SkillCategory;
  is_active?: boolean;
}

export interface UpdateSkillPayload {
  name?: string;
  code?: string;
  description?: string | null;
  category?: SkillCategory;
  is_active?: boolean;
}

export interface UpdateSkillStatusPayload {
  is_active: boolean;
}

export interface ListSkillsParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination (when present, backend switches to cursor mode)
  cursor?: string;

  // Filters
  name?: string;
  code?: string;
  category?: SkillCategory;
  is_active?: boolean;

  // Sorting
  sort_by?: SkillSortBy;
  sort_order?: "ASC" | "DESC";
}

export interface SoftDeleteSkillData {
  id: string;
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  LANGUAGE: "Language",
  FRAMEWORK: "Framework",
  DATABASE: "Database",
  DEVOPS: "DevOps",
  CLOUD: "Cloud",
  TECHNICAL: "Technical",
  TOOL: "Tool",
  OTHER: "Other",
};
