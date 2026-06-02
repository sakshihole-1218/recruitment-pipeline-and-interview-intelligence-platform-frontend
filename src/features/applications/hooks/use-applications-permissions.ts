"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Applications module
export function useApplicationsPermissions() {
  const role = getUserRole();

  // Backend allows ADMIN/RECRUITER/HIRING_MANAGER to list/view applications.
  const canViewApplications =
    role === ROLES.ADMIN || role === ROLES.RECRUITER || role === ROLES.HIRING_MANAGER;

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateApplications = role === ROLES.ADMIN || role === ROLES.RECRUITER;

  return {
    canViewApplications,
    canCreateApplication: canMutateApplications,
    canManageApplicationStage: canMutateApplications,
    canManageApplicationStatus: canMutateApplications,
    canAssignOwners: canMutateApplications,
  };
}
