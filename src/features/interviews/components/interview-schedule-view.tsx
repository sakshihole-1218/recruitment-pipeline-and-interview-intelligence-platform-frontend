"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  Event as InterviewsIcon,
  Person as CandidateIcon,
  WorkOutlined as JobIcon,
  Group as PanelIcon,
} from "@mui/icons-material";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useScheduleInterview } from "@/features/interviews/hooks/use-interviews";
import { useInterviewsPermissions } from "@/features/interviews/hooks/use-interviews-permissions";
import {
  scheduleInterviewSchema,
  type ScheduleInterviewFormValues,
} from "@/features/interviews/schemas/interview-schedule.schema";
import {
  INTERVIEW_MODES,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_PANEL_ROLE_LABELS,
  INTERVIEW_PANEL_ROLES,
} from "@/features/interviews/types/interviews.types";
import { useApplications } from "@/features/applications/hooks/use-applications";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useInterviewRoundsByJobOpening } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { useUsers } from "@/features/users/hooks/use-users";
import { INTERVIEW_ROUND_TYPE_LABELS } from "@/features/interview-rounds/types/interview-rounds.types";

function safeText(value: string | null | undefined) {
  return value && value.trim() !== "" ? value : "—";
}

function ApplicationMenuItemContent({ candidateId, jobOpeningId }: { candidateId: string; jobOpeningId: string }) {
  const candidateQuery = useCandidate(candidateId);
  const jobOpeningQuery = useJobOpening(jobOpeningId);

  const candidate = candidateQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;

  const candidateName = candidate
    ? `${safeText(candidate.first_name)} ${safeText(candidate.last_name)}`.trim()
    : candidateQuery.isLoading
      ? "Loading..."
      : "—";

  const jobTitle = jobOpening
    ? safeText(jobOpening.title)
    : jobOpeningQuery.isLoading
      ? "Loading..."
      : "—";

  return (
    <Stack spacing={0.15} sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
        {candidateName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {jobTitle}
      </Typography>
    </Stack>
  );
}

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

function toIso(localValue: string) {
  return new Date(localValue).toISOString();
}

export function InterviewScheduleView() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { canScheduleInterview } = useInterviewsPermissions();

  const scheduleMutation = useScheduleInterview();

  const applicationsQuery = useApplications({
    page: 1,
    limit: 50,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const applications = unwrapListData<{
    id: string;
    application_number: string;
    candidate_id: string;
    job_opening_id: string;
  }>(applicationsQuery.data);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ScheduleInterviewFormValues>({
    resolver: zodResolver(scheduleInterviewSchema) as unknown as Resolver<ScheduleInterviewFormValues>,
    defaultValues: {
      application_id: "",
      interview_round_id: "",
      scheduled_start_at_local: "",
      scheduled_end_at_local: "",
      interview_mode: INTERVIEW_MODES[0],
      meeting_link: "",
      location_details: "",
      members: [],
    },
    mode: "onTouched",
  });

  const applicationId = useWatch({ control, name: "application_id" });
  const interviewMode = useWatch({ control, name: "interview_mode" });

  const selectedApplication = useMemo(
    () => applications.find((a) => a.id === applicationId) ?? null,
    [applications, applicationId],
  );

  const candidateQuery = useCandidate(selectedApplication?.candidate_id ?? "");
  const jobOpeningQuery = useJobOpening(selectedApplication?.job_opening_id ?? "");

  const roundsQuery = useInterviewRoundsByJobOpening({
    job_opening_id: selectedApplication?.job_opening_id ?? "",
  });

  const usersInterviewersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.INTERVIEWER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const usersHiringManagersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.HIRING_MANAGER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const selectableUsers = useMemo(() => {
    const a = unwrapListData<{ id: string; first_name: string; last_name: string; email: string }>(
      usersInterviewersQuery.data,
    );
    const b = unwrapListData<{ id: string; first_name: string; last_name: string; email: string }>(
      usersHiringManagersQuery.data,
    );
    const map = new Map<string, { id: string; first_name: string; last_name: string; email: string }>();
    [...a, ...b].forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [usersInterviewersQuery.data, usersHiringManagersQuery.data]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const onSubmit = async (values: ScheduleInterviewFormValues) => {
    try {
      if (!canScheduleInterview) {
        showError("You do not have permission to schedule interviews");
        return;
      }

      const payload = {
        application_id: values.application_id,
        interview_round_id: values.interview_round_id,
        scheduled_start_at: toIso(values.scheduled_start_at_local),
        scheduled_end_at: toIso(values.scheduled_end_at_local),
        interview_mode: values.interview_mode,
        ...(values.meeting_link && values.meeting_link.trim() !== ""
          ? { meeting_link: values.meeting_link.trim() }
          : {}),
        ...(values.location_details && values.location_details.trim() !== ""
          ? { location_details: values.location_details.trim() }
          : {}),
        ...(values.members && values.members.length > 0
          ? {
              members: values.members.map((m) => ({
                user_id: m.user_id,
                role_in_panel: m.role_in_panel,
              })),
            }
          : {}),
      };

      const res = await scheduleMutation.mutateAsync(payload);
      showSuccess(res.message || "Interview scheduled successfully");
      router.push(`${ROUTES.INTERVIEWS}/${res.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const rounds = roundsQuery.data?.data ?? [];
  const candidate = candidateQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;

  const isVirtual = interviewMode === "VIRTUAL";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.INTERVIEWS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Interviews
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 900, fontSize: "0.875rem" }}>
          New
        </Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            background: (t) =>
              `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.03)} 100%)`,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <InterviewsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Schedule Interview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Select an application, pick a round, and confirm the schedule.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontWeight: 900 }}>Application</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interviews are scheduled against an application.
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="application_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Select application"
                      fullWidth
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setValue("interview_round_id", "");
                      }}
                      error={!!errors.application_id}
                      helperText={
                        errors.application_id?.message ||
                        (applicationsQuery.isError
                          ? "Unable to load applications"
                          : ""
                        )
                      }
                      disabled={applicationsQuery.isLoading || applicationsQuery.isError}
                    >
                      <MenuItem value="">
                        <em>Select...</em>
                      </MenuItem>
                      {applications.map((a) => (
                        <MenuItem key={a.id} value={a.id}>
                          <ApplicationMenuItemContent
                            candidateId={a.candidate_id}
                            jobOpeningId={a.job_opening_id}
                          />
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Context cards */}
              {applicationId ? (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <CandidateIcon color="primary" />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900 }} noWrap>
                              Candidate
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {candidateQuery.isLoading
                                ? "Loading..."
                                : candidate
                                  ? `${candidate.first_name} ${candidate.last_name}`
                                  : "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <JobIcon color="primary" />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900 }} noWrap>
                              Job Opening
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {jobOpeningQuery.isLoading
                                ? "Loading..."
                                : jobOpening
                                  ? `${jobOpening.title} (${jobOpening.code})`
                                  : "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : null}

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontWeight: 900 }}>Round & Schedule</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pick a round and confirm time + mode.
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="interview_round_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Interview round"
                      fullWidth
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!errors.interview_round_id}
                      helperText={
                        errors.interview_round_id?.message ||
                        (!selectedApplication?.job_opening_id
                          ? "Select an application first"
                          : roundsQuery.isLoading
                            ? "Loading rounds..."
                            : roundsQuery.isError
                              ? "Unable to load rounds"
                              : rounds.length === 0
                                ? "No interview rounds found for this job opening"
                                : "")
                      }
                      disabled={!selectedApplication?.job_opening_id || roundsQuery.isLoading || roundsQuery.isError}
                    >
                      <MenuItem value="">
                        <em>Select...</em>
                      </MenuItem>
                      {rounds
                        .slice()
                        .sort((a, b) => a.sequence_number - b.sequence_number)
                        .map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.round_name} • {INTERVIEW_ROUND_TYPE_LABELS[r.round_type]}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="interview_mode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Interview mode"
                      fullWidth
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!errors.interview_mode}
                      helperText={errors.interview_mode?.message}
                    >
                      {INTERVIEW_MODES.map((m) => (
                        <MenuItem key={m} value={m}>
                          {INTERVIEW_MODE_LABELS[m]}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Start"
                  type="datetime-local"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register("scheduled_start_at_local")}
                  error={!!errors.scheduled_start_at_local}
                  helperText={errors.scheduled_start_at_local?.message}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="End"
                  type="datetime-local"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register("scheduled_end_at_local")}
                  error={!!errors.scheduled_end_at_local}
                  helperText={errors.scheduled_end_at_local?.message}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={isVirtual ? "Meeting link (optional)" : "Meeting link"}
                  fullWidth
                  placeholder={isVirtual ? "https://meet.google.com/..." : ""}
                  {...register("meeting_link")}
                  error={!!errors.meeting_link}
                  helperText={
                    errors.meeting_link?.message ||
                    (isVirtual ? "Recommended for virtual interviews" : "")
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Location details (optional)"
                  fullWidth
                  placeholder="e.g. Office - Meeting Room A"
                  {...register("location_details")}
                  error={!!errors.location_details}
                  helperText={errors.location_details?.message}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                    <PanelIcon color="primary" />
                    <Typography sx={{ fontWeight: 900 }}>Panel Members (optional)</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Add interviewers or hiring managers to the panel.
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Add member"
                  fullWidth
                  value=""
                  onChange={(e) => {
                    const userId = e.target.value;
                    if (!userId) return;
                    append({ user_id: userId, role_in_panel: INTERVIEW_PANEL_ROLES[0] });
                  }}
                  disabled={
                    usersInterviewersQuery.isLoading ||
                    usersHiringManagersQuery.isLoading ||
                    usersInterviewersQuery.isError ||
                    usersHiringManagersQuery.isError
                  }
                  helperText={
                    usersInterviewersQuery.isError || usersHiringManagersQuery.isError
                      ? "Unable to load users"
                      : "Select a user to add"
                  }
                >
                  <MenuItem value="">
                    <em>Select...</em>
                  </MenuItem>
                  {selectableUsers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack spacing={1.25}>
                  {fields.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No panel members added.
                    </Typography>
                  ) : null}

                  {fields.map((f, idx) => {
                    const user = selectableUsers.find((u) => u.id === f.user_id);
                    return (
                      <Card key={f.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography sx={{ fontWeight: 900 }}>
                                {user
                                  ? `${user.first_name} ${user.last_name}`
                                  : f.user_id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user?.email ?? ""}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Controller
                                name={`members.${idx}.role_in_panel`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    select
                                    label="Role"
                                    fullWidth
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  >
                                    {INTERVIEW_PANEL_ROLES.map((r) => (
                                      <MenuItem key={r} value={r}>
                                        {INTERVIEW_PANEL_ROLE_LABELS[r]}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                              <Button
                                color="error"
                                variant="outlined"
                                fullWidth
                                onClick={() => remove(idx)}
                              >
                                Remove
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {errors.members ? (
                    <Typography variant="body2" color="error">
                      {errors.members.message as string}
                    </Typography>
                  ) : null}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canScheduleInterview || scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => router.push(ROUTES.INTERVIEWS)}
                    disabled={scheduleMutation.isPending}
                  >
                    Cancel
                  </Button>
                </Stack>

                {!canScheduleInterview ? (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                    You don’t have permission to schedule interviews.
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
