"use client";

import { ROLES } from "@/constants/roles";
import { getUserRole } from "@/utils/rbac";

// Centralized RBAC for Roles module (pages/components should not hardcode role checks)
export function useRolesPermissions() {
  const role = getUserRole();

  // Backend Access Control Roles endpoints are ADMIN-only.
  const canViewRoles = role === ROLES.ADMIN;

  // Backend does NOT expose create/update/delete role endpoints currently.
  const mutationsSupported = false;

  return {
    canViewRoles,
    canCreateRole: canViewRoles && mutationsSupported,
    canEditRole: canViewRoles && mutationsSupported,
    canDeleteRole: canViewRoles && mutationsSupported,
    // Useful for showing disabled buttons with “not supported” hint
    roleMutationsSupported: mutationsSupported,
  };
}
