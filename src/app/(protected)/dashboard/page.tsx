"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  Work as WorkIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  LocalOffer as OfferIcon,
} from "@mui/icons-material";
import { authStorage } from "@/utils/auth-storage";
import { getUserRole } from "@/utils/rbac";
import { ROLES, type Role } from "@/constants/roles";


import { alpha } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";
import { useDashboardStats, usePipelineActivity, useRecentActivity } from "@/features/dashboard/hooks/use-dashboard";

const getStatValue = (stats: any, label: string) => {
  if (!stats) return "—";
  switch (label) {
    case "Job Openings": return stats.jobOpenings ?? "0";
    case "Candidates": return stats.candidates ?? "0";
    case "Applications": return stats.applications ?? "0";
    case "Interviews": return stats.interviews ?? "0";
    case "Offers": return stats.offers ?? "0";
    default: return "—";
  }
};

const SUMMARY_CARDS: {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: (t: any) => string;
  value: string;
  description: string;
  roles: Role[];
}[] = [
    {
      label: "Job Openings",
      icon: <WorkIcon sx={{ fontSize: 32 }} />,
      color: "primary.main",
      bgColor: (t) => alpha(t.palette.primary.main, 0.12),
      value: "—",
      description: "Active openings",
      roles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    },
    {
      label: "Candidates",
      icon: <PersonIcon sx={{ fontSize: 32 }} />,
      color: "success.main",
      bgColor: (t) => alpha(t.palette.success.main, 0.12),
      value: "—",
      description: "Registered candidates",
      roles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    },
    {
      label: "Applications",
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      color: "warning.main",
      bgColor: (t) => alpha(t.palette.warning.main, 0.12),
      value: "—",
      description: "Submitted applications",
      roles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    },
    {
      label: "Interviews",
      icon: <EventIcon sx={{ fontSize: 32 }} />,
      color: "secondary.main",
      bgColor: (t) => alpha(t.palette.secondary.main, 0.12),
      value: "—",
      description: "Scheduled interviews",
      roles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.HIRING_MANAGER, ROLES.INTERVIEWER],
    },
    {
      label: "Offers",
      icon: <OfferIcon sx={{ fontSize: 32 }} />,
      color: "error.main",
      bgColor: (t) => alpha(t.palette.error.main, 0.12),
      value: "—",
      description: "Offers extended",
      roles: [ROLES.ADMIN, ROLES.RECRUITER],
    },
  ];

export default function DashboardPage() {
  const user = authStorage.getUser();
  const firstName = user?.first_name ?? "there";
  const role = getUserRole();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pipeline, isLoading: pipelineLoading } = usePipelineActivity();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  const visibleCards = SUMMARY_CARDS.filter(
    (card) => role !== null && card.roles.includes(role),
  );

  return (
    <Box>
      {/* Welcome section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Welcome back, {firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s a high-level overview of your recruitment pipeline.
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3}>
        {visibleCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      bgcolor: card.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {statsLoading ? <CircularProgress size={24} /> : getStatValue(stats, card.label)}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {card.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pipeline Activity & Recent Activity feed - Hidden for Interviewers */}
      {role !== "INTERVIEWER" && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: role === "ADMIN" ? 8 : 12 }}>
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Pipeline Activity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Application distribution by stage
                </Typography>

                {pipelineLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : pipeline && pipeline.length > 0 ? (
                  <Stack spacing={2}>
                    {pipeline.map((item, index) => (
                      <Box key={index}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.stage.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.count}
                          </Typography>
                        </Stack>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min((item.count / 100) * 100, 100)}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 4 }} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      height: 180,
                      bgcolor: "action.hover",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.disabled">
                      No pipeline data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {role === "ADMIN" && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Latest events in the system
                </Typography>

                {activityLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : activity && activity.length > 0 ? (
                  <Stack spacing={2} divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                    {activity.map((log) => {
                      const userName = log.action_by_user
                        ? `${log.action_by_user.first_name} ${log.action_by_user.last_name}`.trim()
                        : "System";

                      const actionName = log.action_type.replace(/_/g, ' ').toLowerCase();
                      const entityName = log.entity_type.replace(/_/g, ' ').toLowerCase();

                      return (
                        <Box key={log.id} sx={{ py: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            <Box component="span" sx={{ fontWeight: 700 }}>{userName}</Box> {actionName} {entityName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
                    No recent activity found.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
