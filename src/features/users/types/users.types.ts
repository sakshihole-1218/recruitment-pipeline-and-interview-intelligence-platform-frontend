// ---------------------------------------------------------------------------
// Role types
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
// User response
// ---------------------------------------------------------------------------
export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: RoleResponse[];
}

// ---------------------------------------------------------------------------
// Create / Update request payloads
// ---------------------------------------------------------------------------
export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role_codes?: string[];
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// List users query params
// ---------------------------------------------------------------------------
export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  role_code?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}
