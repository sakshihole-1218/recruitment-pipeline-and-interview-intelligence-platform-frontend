import { authStorage } from "@/utils/auth-storage";
import { ROLE_ALLOWED_ROUTES, ROLES, Role } from "@/constants/roles";
import { SIDEBAR_NAVIGATION } from "@/constants/sidebar-navigation";


export function getUserRole(): Role | null {
  const user = authStorage.getUser();
  if (!user || !user.roles || user.roles.length === 0) return null;

  const role = user.roles[0] as Role;
  const knownRoles = Object.values(ROLES) as string[];
  return knownRoles.includes(role) ? role : null;
}


export function canAccessRoute(path: string): boolean {
  const role = getUserRole();
  if (!role) return false;
  const allowed = ROLE_ALLOWED_ROUTES[role];

  // Some modules allow list/view to multiple roles but keep certain subroutes
  // admin-only (e.g. create/edit screens). RouteGuard relies on this check.
  if (
    path === "/departments/new" ||
    /^(?:\/departments\/[^/]+\/edit)$/.test(path) ||
    path === "/skills/new" ||
    /^(?:\/skills\/[^/]+\/edit)$/.test(path)
  ) {
    return role === ROLES.ADMIN;
  }

  // Job Openings: mutations are ADMIN/RECRUITER (create/edit screens)
  if (
    path === "/job-openings/new" ||
    /^(?:\/job-openings\/[^/]+\/edit)$/.test(path)
  ) {
    return role === ROLES.ADMIN || role === ROLES.RECRUITER;
  }

  // Candidates: mutations are ADMIN/RECRUITER (create/edit screens)
  if (path === "/candidates/new" || /^(?:\/candidates\/[^/]+\/edit)$/.test(path)) {
    return role === ROLES.ADMIN || role === ROLES.RECRUITER;
  }

  // Applications: mutations are ADMIN/RECRUITER (create screen)
  if (path === "/applications/new" || /^(?:\/applications\/[^/]+\/edit)$/.test(path)) {
    return role === ROLES.ADMIN || role === ROLES.RECRUITER;
  }

  // Interview Rounds: mutations are ADMIN/RECRUITER
  if (
    path === "/interview-rounds/create" ||
    /^(?:\/interview-rounds\/[^/]+\/edit)$/.test(path)
  ) {
    return role === ROLES.ADMIN || role === ROLES.RECRUITER;
  }

  // Interviews: scheduling & rescheduling are ADMIN/RECRUITER
  if (
    path === "/interviews/schedule" ||
    /^(?:\/interviews\/[^/]+\/edit)$/.test(path)
  ) {
    return role === ROLES.ADMIN || role === ROLES.RECRUITER;
  }

  // Decisions: create/edit are ADMIN/HIRING_MANAGER only
  if (path === "/decisions/create" || /^(?:\/decisions\/[^/]+\/edit)$/.test(path)) {
    return role === ROLES.ADMIN || role === ROLES.HIRING_MANAGER;
  }

  // Allow exact match OR any sub-route (e.g. /users/new, /users/:id/edit)
  return allowed.some((route) => path === route || path.startsWith(route + "/"));
}



type LeafNavItem = { title: string; path: string };
type GroupNavItem = { title: string; children: LeafNavItem[] };
type NavItem = LeafNavItem | GroupNavItem;

export function getFilteredNavigation(): NavItem[] {
  const role = getUserRole();
  if (!role) return [];

  const allowed = new Set(ROLE_ALLOWED_ROUTES[role]);

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
