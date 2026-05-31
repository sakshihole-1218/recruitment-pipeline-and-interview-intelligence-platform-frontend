import { authStorage } from "@/shared/utils/auth-storage";
import { ROLE_ALLOWED_ROUTES, ROLES, Role } from "@/shared/constants/roles";
import { SIDEBAR_NAVIGATION } from "@/shared/constants/sidebar-navigation";


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
  return ROLE_ALLOWED_ROUTES[role].includes(path);
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
