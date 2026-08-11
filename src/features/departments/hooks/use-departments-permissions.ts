"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

// Centralized RBAC for Departments module
export function useDepartmentsPermissions() {
  const roles = getUserRoles();

  // Backend allows all authenticated roles (ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER)
  // to list and view departments.
  const canViewDepartments = roles.length > 0;

  // Backend mutations are ADMIN-only.
  const canMutateDepartments = hasAnyRole(roles, [ROLES.ADMIN]);

  return {
    canViewDepartments,
    canCreateDepartment: canMutateDepartments,
    canEditDepartment: canMutateDepartments,
    canToggleDepartmentStatus: canMutateDepartments,
    canDeleteDepartment: canMutateDepartments,
  };
}
