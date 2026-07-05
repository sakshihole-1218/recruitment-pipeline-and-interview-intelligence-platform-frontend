"use client";

import NextLink from "next/link";
import {
  alpha,
  Box,
  Chip,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  PriorityHigh as PriorityIcon,
} from "@mui/icons-material";

import type { CandidateResponse } from "@/features/candidates/types/candidates.types";
import type { JobOpeningResponse } from "@/features/job-openings/types/job-openings.types";
import type { UserResponse } from "@/features/users/types/users.types";
import {
  APPLICATION_STAGE_LABELS,
  type ApplicationResponse,
  type ApplicationStageHistoryResponse,
} from "@/features/applications/types/applications.types";
import { ApplicationStatusChip } from "@/features/applications/components/application-status-chip";
import { ApplicationStageChip } from "@/features/applications/components/application-stage-chip";
import { ROUTES } from "@/constants/routes";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toLocaleString();
}

function EmptyValue() {
  return (
    <Typography variant="body2" color="text.disabled">
      —
    </Typography>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{value}</Box>
    </Grid>
  );
}

export interface ApplicationDetailsViewProps {
  application: ApplicationResponse;
  candidate?: CandidateResponse | null;
  jobOpening?: JobOpeningResponse | null;
  recruiter?: UserResponse | null;
  hiringManager?: UserResponse | null;
  stageHistory?: ApplicationStageHistoryResponse[];
}

export function ApplicationDetailsView({
  application,
  candidate,
  jobOpening,
  recruiter,
  hiringManager,
  stageHistory,
}: ApplicationDetailsViewProps) {
  const createdAt = formatDateTime(application.created_at);
  const updatedAt = formatDateTime(application.updated_at);
  const appliedAt = formatDateTime(application.applied_at);
  const lastStageChangedAt = formatDateTime(application.last_stage_changed_at);

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 3, sm: 4 },
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                {application.application_number}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.25 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Applied: <b>{appliedAt || "—"}</b>
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
              {application.is_priority ? (
                <Chip
                  icon={<PriorityIcon />}
                  label="Priority"
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 900 }}
                />
              ) : null}
              <ApplicationStageChip stage={application.current_stage} />
              <ApplicationStatusChip status={application.application_status} />
            </Stack>
          </Stack>

          <Divider />

          <Grid container spacing={2.5}>
            <DetailRow
              label="Candidate"
              value={
                candidate ? (
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Link
                      component={NextLink}
                      href={`${ROUTES.CANDIDATES}/${candidate.id}`}
                      underline="hover"
                      sx={{ fontWeight: 900 }}
                      noWrap
                    >
                      {candidate.first_name} {candidate.last_name}
                    </Link>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {candidate.email}
                    </Typography>
                  </Stack>
                ) : (
                  <EmptyValue />
                )
              }
            />

            <DetailRow
              label="Job opening"
              value={
                jobOpening ? (
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Link
                      component={NextLink}
                      href={`${ROUTES.JOB_OPENINGS}/${jobOpening.id}`}
                      underline="hover"
                      sx={{ fontWeight: 900 }}
                      noWrap
                    >
                      {jobOpening.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {jobOpening.code}
                      {jobOpening.location ? ` • ${jobOpening.location}` : ""}
                    </Typography>
                  </Stack>
                ) : (
                  <EmptyValue />
                )
              }
            />

            <DetailRow
              label="Recruiter"
              value={
                recruiter ? (
                  <Typography sx={{ fontWeight: 800 }}>{recruiter.first_name} {recruiter.last_name}</Typography>
                ) : (
                  <EmptyValue />
                )
              }
            />

            <DetailRow
              label="Hiring manager"
              value={
                hiringManager ? (
                  <Typography sx={{ fontWeight: 800 }}>{hiringManager.first_name} {hiringManager.last_name}</Typography>
                ) : (
                  <EmptyValue />
                )
              }
            />

            <DetailRow
              label="Stage"
              value={<ApplicationStageChip stage={application.current_stage} />}
            />

            <DetailRow
              label="Status"
              value={<ApplicationStatusChip status={application.application_status} />}
            />

            {/*<DetailRow
              label="Screening score"
              value={application.screening_score ? <Typography>{application.screening_score}</Typography> : <EmptyValue />}
            />

            <DetailRow
              label="Fit score"
              value={application.fit_score ? <Typography>{application.fit_score}</Typography> : <EmptyValue />}
            />*/}

            <DetailRow
              label="Last stage change"
              value={lastStageChangedAt ? <Typography>{lastStageChangedAt}</Typography> : <EmptyValue />}
            />

            <DetailRow
              label="Created at"
              value={createdAt ? <Typography>{createdAt}</Typography> : <EmptyValue />}
            />

            <DetailRow
              label="Updated at"
              value={updatedAt ? <Typography>{updatedAt}</Typography> : <EmptyValue />}
            />

            {application.rejection_reason ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
                  Rejection reason
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {application.rejection_reason}
                </Typography>
              </Grid>
            ) : null}

            {application.withdrawal_reason ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
                  Withdrawal reason
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {application.withdrawal_reason}
                </Typography>
              </Grid>
            ) : null}
          </Grid>
        </Stack>
      </Box>

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 3, sm: 4 },
          bgcolor: "background.paper",
        }}
      >
        <SectionTitle title="Timeline" subtitle="Stage history tracked by the system" />

        <Divider sx={{ my: 2.5 }} />

        {stageHistory && stageHistory.length > 0 ? (
          <Stack spacing={2}>
            {stageHistory
              .slice()
              .sort((a, b) => (a.changed_at > b.changed_at ? -1 : 1))
              .map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 2,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    sx={{ justifyContent: "space-between", gap: 1 }}
                  >
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 900 }}>
                        {row.from_stage
                          ? `${APPLICATION_STAGE_LABELS[row.from_stage]} → ${APPLICATION_STAGE_LABELS[row.to_stage]}`
                          : `${APPLICATION_STAGE_LABELS[row.to_stage]}`}
                      </Typography>
                      {row.change_reason ? (
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {row.change_reason}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                      {formatDateTime(row.changed_at)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No stage history yet.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
