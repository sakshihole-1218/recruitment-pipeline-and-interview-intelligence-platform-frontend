"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  alpha,
  Box,
  Drawer,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  PlaylistAddCheck as InterviewRoundsIcon,
  Gavel as GavelIcon,
  LocalOffer as OfferIcon,
  AutoAwesome as AIIcon,
  Description as ResumeIcon,
  RateReview as FeedbackIcon,
  AccountTree as PipelineIcon,
} from "@mui/icons-material";

import { getFilteredNavigation } from "@/utils/rbac";

export const SIDEBAR_WIDTH = 80;

const NAV_ICONS: Record<string, React.ReactNode> = {
  Dashboard: <DashboardIcon sx={{ fontSize: 26 }} />,
  "Access Control": <AdminIcon sx={{ fontSize: 26 }} />,
  Users: <PeopleIcon sx={{ fontSize: 26 }} />,
  Roles: <AdminIcon sx={{ fontSize: 26 }} />,
  "Master Data": <BusinessIcon sx={{ fontSize: 26 }} />,
  Departments: <BusinessIcon sx={{ fontSize: 26 }} />,
  Skills: <PsychologyIcon sx={{ fontSize: 26 }} />,
  Recruitment: <PipelineIcon sx={{ fontSize: 26 }} />,
  "Job Openings": <WorkIcon sx={{ fontSize: 26 }} />,
  Candidates: <PersonIcon sx={{ fontSize: 26 }} />,
  Applications: <AssignmentIcon sx={{ fontSize: 26 }} />,
  "Interview Rounds": <InterviewRoundsIcon sx={{ fontSize: 26 }} />,
  Interviews: <EventIcon sx={{ fontSize: 26 }} />,
  Decisions: <GavelIcon sx={{ fontSize: 26 }} />,
  Offers: <OfferIcon sx={{ fontSize: 26 }} />,
  "AI Insights": <AIIcon sx={{ fontSize: 26 }} />,
  Resumes: <ResumeIcon sx={{ fontSize: 26 }} />,
  Feedback: <FeedbackIcon sx={{ fontSize: 26 }} />,
  "Resume Analyses": <ResumeIcon sx={{ fontSize: 26 }} />,
  "Feedback Summaries": <FeedbackIcon sx={{ fontSize: 26 }} />,
};

function shortLabel(title: string): string {
  const MAP: Record<string, string> = {
    "Access Control": "Access",
    "Master Data": "Master",
    "Job Openings": "Jobs",
    Resumes: "Resumes",
    "Resume Analyses": "Resumes",
    "Feedback Summaries": "Feedback",
    "AI Insights": "AI",
  };
  return MAP[title] ?? title;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItem({ title, path, isActive, onClick }: {
  title: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip title={title} placement="right" arrow>
      <Box
        component={Link}
        href={path}
        onClick={onClick}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          py: 1.5,
          px: 0.5,
          mx: 0.75,
          borderRadius: 2.5,
          textDecoration: "none",
          cursor: "pointer",
          color: isActive ? "primary.main" : "text.secondary",
          bgcolor: isActive ? (t) => alpha(t.palette.primary.main, 0.1) : "transparent",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: isActive
              ? (t) => alpha(t.palette.primary.main, 0.15)
              : "action.hover",
            color: isActive ? "primary.main" : "text.primary",
          },
          "&::before": isActive ? {
            content: '""',
            position: "absolute",
            left: -6,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: "60%",
            borderRadius: 99,
            bgcolor: "primary.main",
          } : {},
        }}
      >
        {NAV_ICONS[title]}
        <Typography
          sx={{
            fontSize: "0.67rem",
            fontWeight: isActive ? 700 : 500,
            lineHeight: 1.1,
            textAlign: "center",
            letterSpacing: 0.3,
            color: "inherit",
            maxWidth: 68,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortLabel(title)}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const filteredNav = getFilteredNavigation();

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 64,
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: (t) => `0 4px 14px ${alpha(t.palette.primary.main, 0.4)}`,
          }}
        >
          <WorkIcon sx={{ color: "white", fontSize: 22 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5 }}>
        {filteredNav.map((item) => {
          if ("path" in item) {
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <NavItem
                key={item.title}
                title={item.title}
                path={item.path}
                isActive={isActive}
                onClick={onMobileClose}
              />
            );
          }

          const hasActiveChild =
            "children" in item &&
            item.children.some(
              (child) =>
                pathname === child.path ||
                pathname.startsWith(child.path + "/"),
            );

          return (
            <Box key={item.title} sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  pt: 1.5,
                  pb: 0.5,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: hasActiveChild ? "primary.main" : "divider",
                    opacity: hasActiveChild ? 0.3 : 1,
                  }}
                />
              </Box>

              {"children" in item &&
                item.children.map((child) => {
                  const isActive =
                    pathname === child.path ||
                    pathname.startsWith(child.path + "/");
                  return (
                    <NavItem
                      key={child.title}
                      title={child.title}
                      path={child.path}
                      isActive={isActive}
                      onClick={onMobileClose}
                    />
                  );
                })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            bgcolor: (t) => alpha(t.palette.background.paper, 0.8),
            backdropFilter: "blur(12px)",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            bgcolor: (t) => alpha(t.palette.background.paper, 0.8),
            backdropFilter: "blur(12px)",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

