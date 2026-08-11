import { authStorage } from "@/utils/auth-storage";
import { INTERNAL_ROLE_VALUES, ROLE_ALLOWED_ROUTES, ROLES, Role } from "@/constants/roles";
import { SIDEBAR_NAVIGATION } from "@/constants/sidebar-navigation";


export function getUserRole(): Role | null {
  return getUserRoles()[0] ?? null;
}

export function getUserRoles(): Role[] {
  const user = authStorage.getUser();
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return [];

  return user.roles.filter((role): role is Role =>
    INTERNAL_ROLE_VALUES.includes(role as Role),
  );
}

export function hasRole(userRoles: Role[], role: Role): boolean {
  return userRoles.includes(role);
}

export function hasAnyRole(userRoles: Role[], allowedRoles: readonly Role[]): boolean {
  return allowedRoles.some((role) => userRoles.includes(role));
}


export function canAccessRoute(path: string, userRoles = getUserRoles()): boolean {
  if (userRoles.length === 0) return false;
  const allowed = new Set(userRoles.flatMap((role) => ROLE_ALLOWED_ROUTES[role]));

  // The old protected AI interview room routes are deprecated. Candidate-facing
  // AI interviews must run through the public invitation flow instead.
  if (/^\/interviews\/[^/]+\/ai-room(?:\/.*)?$/.test(path)) {
    return false;
  }

  // Some modules allow list/view to multiple roles but keep certain subroutes
  // admin-only (e.g. create/edit screens). RouteGuard relies on this check.
  if (
    path === "/departments/new" ||
    /^(?:\/departments\/[^/]+\/edit)$/.test(path) ||
    path === "/skills/new" ||
    /^(?:\/skills\/[^/]+\/edit)$/.test(path)
  ) {
    return hasRole(userRoles, ROLES.ADMIN);
  }

  // Job Openings: mutations are ADMIN/RECRUITER (create/edit screens)
  if (
    path === "/job-openings/new" ||
    /^(?:\/job-openings\/[^/]+\/edit)$/.test(path)
  ) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Candidates: mutations are ADMIN/RECRUITER (create/edit screens)
  if (path === "/candidates/new" || /^(?:\/candidates\/[^/]+\/edit)$/.test(path)) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Applications: mutations are ADMIN/RECRUITER (create screen)
  if (path === "/applications/new" || /^(?:\/applications\/[^/]+\/edit)$/.test(path)) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Interview Rounds: mutations are ADMIN/RECRUITER
  if (
    path === "/interview-rounds/create" ||
    /^(?:\/interview-rounds\/[^/]+\/edit)$/.test(path)
  ) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Interviews: scheduling & rescheduling are ADMIN/RECRUITER
  if (
    path === "/interviews/schedule" ||
    /^(?:\/interviews\/[^/]+\/edit)$/.test(path)
  ) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Decisions: create/edit are ADMIN/HIRING_MANAGER only
  if (path === "/decisions/create" || /^(?:\/decisions\/[^/]+\/edit)$/.test(path)) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.HIRING_MANAGER]);
  }

  // Offers: mutations are ADMIN/RECRUITER only
  if (path === "/offers/create" || /^(?:\/offers\/[^/]+\/edit)$/.test(path)) {
    return hasAnyRole(userRoles, [ROLES.ADMIN, ROLES.RECRUITER]);
  }

  // Allow exact match OR any sub-route (e.g. /users/new, /users/:id/edit)
  return Array.from(allowed).some(
    (route) => path === route || path.startsWith(route + "/"),
  );
}



type LeafNavItem = { title: string; path: string };
type GroupNavItem = { title: string; children: LeafNavItem[] };
type NavItem = LeafNavItem | GroupNavItem;

export function getFilteredNavigation(): NavItem[] {
  const roles = getUserRoles();
  if (roles.length === 0) return [];

  const allowed = new Set(roles.flatMap((role) => ROLE_ALLOWED_ROUTES[role]));

  return (SIDEBAR_NAVIGATION as unknown as NavItem[]).reduce<NavItem[]>((acc, item) => {
    if ("path" in item) {
      if (allowed.has(item.path)) acc.push(item);
    } else {

      const visibleChildren = item.children.filter((child) => allowed.has(child.path));
      if (visibleChildren.length > 0) {
        acc.push({ title: item.title, children: visibleChildren });
      }
    }
    return acc;
  }, []);
}
