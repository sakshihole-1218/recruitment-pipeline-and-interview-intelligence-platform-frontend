import { ROUTES } from "@/constants/routes";

// ---------------------------------------------------------------------------
// System role codes — must match backend SystemRoleCode enum
// ---------------------------------------------------------------------------
export const ROLES = {
  ADMIN: "ADMIN",
  RECRUITER: "RECRUITER",
  HIRING_MANAGER: "HIRING_MANAGER",
  INTERVIEWER: "INTERVIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const INTERNAL_ROLE_VALUES = Object.values(ROLES) as Role[];

// ---------------------------------------------------------------------------
// Per-role allowed routes (leaf paths only — groups are shown when ≥1 child allowed)
// ---------------------------------------------------------------------------
export const ROLE_ALLOWED_ROUTES: Record<Role, string[]> = {
  [ROLES.ADMIN]: [
    ROUTES.DASHBOARD,
    ROUTES.USERS,
    ROUTES.ROLES,
    ROUTES.DEPARTMENTS,
    ROUTES.SKILLS,
    ROUTES.JOB_OPENINGS,
    ROUTES.CANDIDATES,
    ROUTES.APPLICATIONS,
    ROUTES.RESUMES,
    ROUTES.INTERVIEWS,
    ROUTES.INTERVIEW_ROUNDS,
    ROUTES.DECISIONS,
    ROUTES.OFFERS,
    ROUTES.FEEDBACK,
    ROUTES.FEEDBACK_SUMMARIES,
  ],
  [ROLES.RECRUITER]: [
    ROUTES.DASHBOARD,
    ROUTES.DEPARTMENTS,
    ROUTES.SKILLS,
    ROUTES.JOB_OPENINGS,
    ROUTES.CANDIDATES,
    ROUTES.APPLICATIONS,
    ROUTES.RESUMES,
    ROUTES.INTERVIEWS,
    ROUTES.INTERVIEW_ROUNDS,
    ROUTES.DECISIONS,
    ROUTES.OFFERS,
    ROUTES.FEEDBACK,
  ],
  [ROLES.HIRING_MANAGER]: [
    ROUTES.DASHBOARD,
    ROUTES.DEPARTMENTS,
    ROUTES.SKILLS,
    ROUTES.JOB_OPENINGS,
    ROUTES.CANDIDATES,
    ROUTES.APPLICATIONS,
    ROUTES.RESUMES,
    ROUTES.INTERVIEWS,
    ROUTES.INTERVIEW_ROUNDS,
    ROUTES.DECISIONS,
    ROUTES.OFFERS,
    ROUTES.FEEDBACK,
    ROUTES.FEEDBACK_SUMMARIES,
  ],
  [ROLES.INTERVIEWER]: [
    ROUTES.DASHBOARD,
    ROUTES.DEPARTMENTS,
    ROUTES.SKILLS,
    ROUTES.INTERVIEWS,
    ROUTES.FEEDBACK,
  ],
};

// Routes that are always accessible regardless of role (auth-level guards handle them separately)
export const PUBLIC_ROUTES: string[] = [ROUTES.LOGIN];
