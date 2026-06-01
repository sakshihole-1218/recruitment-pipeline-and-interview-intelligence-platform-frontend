"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Departments module
export function useDepartmentsPermissions() {
  const role = getUserRole();

  // Backend allows all authenticated roles (ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER)
  // to list and view departments.
  const canViewDepartments = !!role;

  // Backend mutations are ADMIN-only.
  const canMutateDepartments = role === ROLES.ADMIN;

  return {
    canViewDepartments,
    canCreateDepartment: canMutateDepartments,
    canEditDepartment: canMutateDepartments,
    canToggleDepartmentStatus: canMutateDepartments,
    canDeleteDepartment: canMutateDepartments,
  };
}
