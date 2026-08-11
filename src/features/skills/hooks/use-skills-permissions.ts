"use client";

import { ROLES } from "@/constants/roles";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";

// Centralized RBAC for Skills module
export function useSkillsPermissions() {
  const roles = getUserRoles();

  // Backend allows all authenticated roles (ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER)
  // to list and view skills.
  const canViewSkills = roles.length > 0;

  // Backend mutations are ADMIN-only.
  const canMutateSkills = hasAnyRole(roles, [ROLES.ADMIN]);

  return {
    canViewSkills,
    canCreateSkill: canMutateSkills,
    canEditSkill: canMutateSkills,
    canToggleSkillStatus: canMutateSkills,
    canDeleteSkill: canMutateSkills,
  };
}
