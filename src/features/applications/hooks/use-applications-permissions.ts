"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

// Centralized RBAC for Applications module
export function useApplicationsPermissions() {
  const roles = getUserRoles();

  // Backend allows ADMIN/RECRUITER/HIRING_MANAGER to list/view applications.
  const canViewApplications =
    hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER]);

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateApplications = hasAnyRole(roles, [ROLES.ADMIN, ROLES.RECRUITER]);

  return {
    canViewApplications,
    canCreateApplication: canMutateApplications,
    canManageApplicationStage: canMutateApplications,
    canManageApplicationStatus: canMutateApplications,
    canAssignOwners: canMutateApplications,
  };
}
