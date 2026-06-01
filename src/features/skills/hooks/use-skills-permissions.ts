"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Skills module
export function useSkillsPermissions() {
  const role = getUserRole();

  // Backend allows all authenticated roles (ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER)
  // to list and view skills.
  const canViewSkills = !!role;

  // Backend mutations are ADMIN-only.
  const canMutateSkills = role === ROLES.ADMIN;

  return {
    canViewSkills,
    canCreateSkill: canMutateSkills,
    canEditSkill: canMutateSkills,
    canToggleSkillStatus: canMutateSkills,
    canDeleteSkill: canMutateSkills,
  };
}
