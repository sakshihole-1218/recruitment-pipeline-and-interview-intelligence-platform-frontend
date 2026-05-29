export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}