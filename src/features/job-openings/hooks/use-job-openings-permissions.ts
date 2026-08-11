"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

// Centralized RBAC for Job Openings module
export function useJobOpeningsPermissions() {
  const roles = getUserRoles();

  // Backend allows ADMIN/RECRUITER/HIRING_MANAGER to list/view job openings.
  const canViewJobOpenings = hasAnyRole(roles, [
    ROLES.ADMIN,
    ROLES.RECRUITER,
    ROLES.HIRING_MANAGER,
  ]);

  // Backend mutations are ADMIN/RECRUITER.
  const canMutateJobOpenings = hasAnyRole(roles, [
    ROLES.ADMIN,
    ROLES.RECRUITER,
  ]);

  return {
    canViewJobOpenings,
    canCreateJobOpening: canMutateJobOpenings,
    canEditJobOpening: canMutateJobOpenings,
    canManageJobOpeningStatus: canMutateJobOpenings,
    canDeleteJobOpening: canMutateJobOpenings,
  };
}
