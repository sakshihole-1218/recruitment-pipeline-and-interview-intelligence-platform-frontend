"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_MODE_LABELS,
  type JobOpeningResponse,
} from "@/features/job-openings/types/job-openings.types";
import { JobOpeningStatusChip } from "@/features/job-openings/components/job-opening-status-chip";
import { JobOpeningActiveChip } from "@/features/job-openings/components/job-opening-active-chip";

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 900, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{value}</Box>
    </Grid>
  );
}

export interface JobOpeningDetailsViewProps {
  opening: JobOpeningResponse;
  departmentName?: string;
  recruiterName?: string;
  hiringManagerName?: string;
}

export function JobOpeningDetailsView({
  opening,
  departmentName,
  recruiterName,
  hiringManagerName,
}: JobOpeningDetailsViewProps) {
  const createdAt = formatDateTime(opening.created_at);
  const updatedAt = formatDateTime(opening.updated_at);
  const publishedAt = formatDateTime(opening.published_at);
  const closedAt = formatDateTime(opening.closed_at);

  const minExp = opening.experience_min_years;
  const maxExp = opening.experience_max_years;
  const experienceLabel =
    minExp !== null || maxExp !== null
      ? `${minExp ?? 0} - ${maxExp ?? 0} years`
      : null;

  const salaryLabel =
    opening.min_salary || opening.max_salary
      ? `${opening.currency_code ?? ""} ${opening.min_salary ?? ""} - ${opening.max_salary ?? ""}`.trim()
      : null;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }} noWrap>
                {opening.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Code: <Box component="span" sx={{ fontWeight: 900 }}>{opening.code}</Box>
              </Typography>
            </Box>
            <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <JobOpeningStatusChip status={opening.status} />
              <JobOpeningActiveChip isActive={opening.is_active} />
            </Stack>
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            <DetailRow
              label="Department"
              value={departmentName ? <Typography>{departmentName}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Recruiter"
              value={recruiterName ? <Typography>{recruiterName}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Hiring Manager"
              value={hiringManagerName ? <Typography>{hiringManagerName}</Typography> : <EmptyValue />}
            />

            <DetailRow
              label="Employment Type"
              value={<Typography>{EMPLOYMENT_TYPE_LABELS[opening.employment_type]}</Typography>}
            />
            <DetailRow
              label="Work Mode"
              value={<Typography>{WORK_MODE_LABELS[opening.work_mode]}</Typography>}
            />
            <DetailRow
              label="Openings"
              value={<Typography>{opening.openings_count}</Typography>}
            />

            <DetailRow
              label="Experience"
              value={experienceLabel ? <Typography>{experienceLabel}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Salary"
              value={salaryLabel ? <Typography>{salaryLabel}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Location"
              value={opening.location ? <Typography>{opening.location}</Typography> : <EmptyValue />}
            />

            <DetailRow
              label="Published At"
              value={publishedAt ? <Typography>{publishedAt}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Closed At"
              value={closedAt ? <Typography>{closedAt}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Created At"
              value={createdAt ? <Typography>{createdAt}</Typography> : <EmptyValue />}
            />
            <DetailRow
              label="Updated At"
              value={updatedAt ? <Typography>{updatedAt}</Typography> : <EmptyValue />}
            />
          </Grid>

          <Divider />

          <Box>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Skills</Typography>
            {opening.skills && opening.skills.length > 0 ? (
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                {opening.skills.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.skill_name ?? s.skill_id}
                    size="small"
                    variant={s.is_mandatory ? "filled" : "outlined"}
                    color={s.is_mandatory ? "primary" : "default"}
                    sx={{ fontWeight: 800 }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No skills defined for this opening.
              </Typography>
            )}
          </Box>

          {opening.job_description || opening.responsibilities || opening.requirements ? (
            <>
              <Divider />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Job Description</Typography>
                  {opening.job_description ? (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {opening.job_description}
                    </Typography>
                  ) : (
                    <EmptyValue />
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Responsibilities</Typography>
                  {opening.responsibilities ? (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {opening.responsibilities}
                    </Typography>
                  ) : (
                    <EmptyValue />
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Requirements</Typography>
                  {opening.requirements ? (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {opening.requirements}
                    </Typography>
                  ) : (
                    <EmptyValue />
                  )}
                </Grid>
              </Grid>
            </>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
