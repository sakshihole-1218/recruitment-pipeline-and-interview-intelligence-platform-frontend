// ---------------------------------------------------------------------------
// Role types (from backend Access Control - Roles)
// ---------------------------------------------------------------------------

export interface RoleResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// List roles query params
// Backend: ListRolesQueryDto extends PaginationQueryDto
// ---------------------------------------------------------------------------

export type RoleSortBy = "created_at" | "updated_at" | "code" | "name";

export interface ListRolesParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: RoleSortBy;
  sort_order?: "ASC" | "DESC" | "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Form payloads (UI-ready; backend does not currently expose create/update APIs)
// ---------------------------------------------------------------------------

export interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
}
