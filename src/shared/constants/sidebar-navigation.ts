import { ROUTES } from "@/shared/constants/routes";

export const SIDEBAR_NAVIGATION = [
  {
    title: "Dashboard",
    path: ROUTES.DASHBOARD,
  },
  {
    title: "Access Control",
    children: [
      {
        title: "Users",
        path: ROUTES.USERS,
      },
      {
        title: "Roles",
        path: ROUTES.ROLES,
      },
    ],
  },
  {
    title: "Master Data",
    children: [
      {
        title: "Departments",
        path: ROUTES.DEPARTMENTS,
      },
      {
        title: "Skills",
        path: ROUTES.SKILLS,
      },
    ],
  },
  {
    title: "Recruitment",
    children: [
      {
        title: "Job Openings",
        path: ROUTES.JOB_OPENINGS,
      },
      {
        title: "Candidates",
        path: ROUTES.CANDIDATES,
      },
      {
        title: "Applications",
        path: ROUTES.APPLICATIONS,
      },
      {
        title: "Interviews",
        path: ROUTES.INTERVIEWS,
      },
      {
        title: "Decisions",
        path: ROUTES.DECISIONS,
      },
      {
        title: "Offers",
        path: ROUTES.OFFERS,
      },
    ],
  },
  {
    title: "AI Insights",
    children: [
      {
        title: "Resume Analyses",
        path: ROUTES.RESUME_ANALYSES,
      },
      {
        title: "Feedback Summaries",
        path: ROUTES.FEEDBACK_SUMMARIES,
      },
    ],
  },
] as const;