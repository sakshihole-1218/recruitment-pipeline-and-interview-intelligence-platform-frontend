export type DepartmentSortBy =
  | "created_at"
  | "updated_at"
  | "name"
  | "code"
  | "is_active";

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateDepartmentStatusPayload {
  is_active: boolean;
}

export interface ListDepartmentsParams {
  // Offset pagination
  page?: number;
  limit?: number;

  // Cursor pagination (when present, backend switches to cursor mode)
  cursor?: string;

  // Filters
  search?: string;
  code?: string;
  is_active?: boolean;

  // Sorting
  sort_by?: DepartmentSortBy;
  sort_order?: "ASC" | "DESC";
}

export interface SoftDeleteDepartmentData {
  id: string;
}
