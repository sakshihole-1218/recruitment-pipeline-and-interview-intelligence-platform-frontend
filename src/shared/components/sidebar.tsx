"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
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
  Gavel as GavelIcon,
  LocalOffer as OfferIcon,
  AutoAwesome as AIIcon,
  Description as ResumeIcon,
  RateReview as FeedbackIcon,
  ExpandLess,
  ExpandMore,
  AccountTree as PipelineIcon,
} from "@mui/icons-material";

import { getFilteredNavigation } from "@/shared/utils/rbac";

export const SIDEBAR_WIDTH = 260;

const NAV_ICONS: Record<string, React.ReactNode> = {
  Dashboard: <DashboardIcon fontSize="small" />,
  "Access Control": <AdminIcon fontSize="small" />,
  Users: <PeopleIcon fontSize="small" />,
  Roles: <AdminIcon fontSize="small" />,
  "Master Data": <BusinessIcon fontSize="small" />,
  Departments: <BusinessIcon fontSize="small" />,
  Skills: <PsychologyIcon fontSize="small" />,
  Recruitment: <PipelineIcon fontSize="small" />,
  "Job Openings": <WorkIcon fontSize="small" />,
  Candidates: <PersonIcon fontSize="small" />,
  Applications: <AssignmentIcon fontSize="small" />,
  Interviews: <EventIcon fontSize="small" />,
  Decisions: <GavelIcon fontSize="small" />,
  Offers: <OfferIcon fontSize="small" />,
  "AI Insights": <AIIcon fontSize="small" />,
  "Resume Analyses": <ResumeIcon fontSize="small" />,
  "Feedback Summaries": <FeedbackIcon fontSize="small" />,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // Filtered navigation for the logged-in user's role.
  // getFilteredNavigation reads localStorage; this component is "use client"
  // so it only runs in the browser.
  const filteredNav = getFilteredNavigation();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    filteredNav.forEach((item) => {
      if ("children" in item) {
        const isActive = item.children.some((child) => pathname === child.path);
        initial[item.title] = isActive;
      }
    });
    return initial;
  });

  const toggleGroup = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <Toolbar sx={{ bgcolor: "primary.main", minHeight: "64px !important", px: 2.5, gap: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            bgcolor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WorkIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ color: "white", lineHeight: 1.2, fontSize: 13, fontWeight: 700 }}
          >
            Recruitment Platform
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Intelligence Suite
          </Typography>
        </Box>
      </Toolbar>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5 }}>
        <List dense disablePadding>
          {filteredNav.map((item) => {
            if ("path" in item) {
              const isActive = pathname === item.path;
              return (
                <ListItemButton
                  key={item.title}
                  component={Link}
                  href={item.path}
                  onClick={onMobileClose}
                  selected={isActive}
                  sx={{
                    mx: 1.5,
                    borderRadius: 1.5,
                    mb: 0.5,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "& .MuiListItemIcon-root": { color: "white" },
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 34, color: isActive ? "white" : "text.secondary" }}
                  >
                    {NAV_ICONS[item.title]}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    slotProps={{
                      primary: { style: { fontSize: 14, fontWeight: isActive ? 600 : 400 } },
                    }}
                  />
                </ListItemButton>
              );
            }

            const isGroupExpanded = !!expanded[item.title];
            const hasActiveChild =
              "children" in item &&
              item.children.some((child) => pathname === child.path);

            return (
              <Box key={item.title}>
                <ListItemButton
                  onClick={() => toggleGroup(item.title)}
                  sx={{ mx: 1.5, borderRadius: 1.5, mb: 0.5 }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 34, color: hasActiveChild ? "primary.main" : "text.secondary" }}
                  >
                    {NAV_ICONS[item.title]}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    slotProps={{
                      primary: {
                        style: {
                          fontSize: 13,
                          fontWeight: 600,
                          color: hasActiveChild ? "#1976d2" : "#666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        },
                      },
                    }}
                  />
                  {isGroupExpanded ? (
                    <ExpandLess fontSize="small" sx={{ color: "text.secondary" }} />
                  ) : (
                    <ExpandMore fontSize="small" sx={{ color: "text.secondary" }} />
                  )}
                </ListItemButton>

                <Collapse in={isGroupExpanded} timeout="auto" unmountOnExit>
                  <List dense disablePadding>
                    {"children" in item &&
                      item.children.map((child) => {
                        const isActive = pathname === child.path;
                        return (
                          <ListItemButton
                            key={child.title}
                            component={Link}
                            href={child.path}
                            onClick={onMobileClose}
                            selected={isActive}
                            sx={{
                              pl: 5.5,
                              mx: 1.5,
                              borderRadius: 1.5,
                              mb: 0.25,
                              "&.Mui-selected": {
                                bgcolor: "primary.main",
                                color: "white",
                                "& .MuiListItemIcon-root": { color: "white" },
                                "&:hover": { bgcolor: "primary.dark" },
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{ minWidth: 28, color: isActive ? "white" : "text.secondary" }}
                            >
                              {NAV_ICONS[child.title]}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.title}
                              slotProps={{
                                primary: {
                                  style: { fontSize: 13.5, fontWeight: isActive ? 600 : 400 },
                                },
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          © {new Date().getFullYear()} Recruitment Platform
        </Typography>
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
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
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
