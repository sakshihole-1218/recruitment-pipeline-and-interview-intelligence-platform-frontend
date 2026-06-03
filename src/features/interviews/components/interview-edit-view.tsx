"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  NavigateNext as NavigateNextIcon,
  Event as InterviewsIcon,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useInterview, useRescheduleInterview } from "@/features/interviews/hooks/use-interviews";
import { useInterviewsPermissions } from "@/features/interviews/hooks/use-interviews-permissions";
import {
  rescheduleInterviewSchema,
  type RescheduleInterviewFormValues,
} from "@/features/interviews/schemas/interview-reschedule.schema";

function toIso(localValue: string) {
  return new Date(localValue).toISOString();
}

function toLocalInputValue(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function InterviewEditView({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { canRescheduleInterview } = useInterviewsPermissions();

  const interviewQuery = useInterview(id);
  const interview = interviewQuery.data?.data;

  const rescheduleMutation = useRescheduleInterview(id);

  const defaultValues = useMemo<RescheduleInterviewFormValues>(
    () => ({
      scheduled_start_at_local: toLocalInputValue(interview?.scheduled_start_at),
      scheduled_end_at_local: toLocalInputValue(interview?.scheduled_end_at),
      reschedule_reason: "",
      meeting_link: interview?.meeting_link ?? "",
      location_details: interview?.location_details ?? "",
    }),
    [interview?.scheduled_start_at, interview?.scheduled_end_at, interview?.meeting_link, interview?.location_details],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RescheduleInterviewFormValues>({
    resolver: zodResolver(rescheduleInterviewSchema) as unknown as Resolver<RescheduleInterviewFormValues>,
    values: defaultValues,
    mode: "onTouched",
  });

  const onSubmit = async (values: RescheduleInterviewFormValues) => {
    try {
      if (!canRescheduleInterview) {
        showError("You do not have permission to reschedule interviews");
        return;
      }

      const payload = {
        scheduled_start_at: toIso(values.scheduled_start_at_local),
        scheduled_end_at: toIso(values.scheduled_end_at_local),
        reschedule_reason: values.reschedule_reason.trim(),
        ...(values.meeting_link && values.meeting_link.trim() !== ""
          ? { meeting_link: values.meeting_link.trim() }
          : {}),
        ...(values.location_details && values.location_details.trim() !== ""
          ? { location_details: values.location_details.trim() }
          : {}),
      };

      const res = await rescheduleMutation.mutateAsync(payload);
      showSuccess(res.message || "Interview rescheduled successfully");
      router.push(`${ROUTES.INTERVIEWS}/${res.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const errorMessage = interviewQuery.isError ? getApiErrorMessage(interviewQuery.error) : "";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component={NextLink}
          href={`${ROUTES.INTERVIEWS}/${id}`}
          underline="hover"
          color="inherit"
        >
          Interview Details
        </Link>
        <Typography color="text.primary">Reschedule</Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}`)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Reschedule Interview
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <InterviewsIcon color="primary" />
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {interviewQuery.isLoading ? (
            <Typography>Loading...</Typography>
          ) : interviewQuery.isError ? (
            <Box sx={{ p: 3, border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900 }} color="error">
                Failed to load interview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {errorMessage}
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Rescheduling creates a new interview record.
              </Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 900 }}>New Schedule</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provide new times and a reason.
                    </Typography>
                  </Stack>
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

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Reason"
                    fullWidth
                    multiline
                    minRows={3}
                    {...register("reschedule_reason")}
                    error={!!errors.reschedule_reason}
                    helperText={errors.reschedule_reason?.message}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Meeting link (optional)"
                    fullWidth
                    {...register("meeting_link")}
                    error={!!errors.meeting_link}
                    helperText={errors.meeting_link?.message}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Location details (optional)"
                    fullWidth
                    {...register("location_details")}
                    error={!!errors.location_details}
                    helperText={errors.location_details?.message}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!canRescheduleInterview || rescheduleMutation.isPending}
                    >
                      {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}`)}
                      disabled={rescheduleMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </Stack>

                  {!canRescheduleInterview ? (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                      You don’t have permission to reschedule interviews.
                    </Typography>
                  ) : null}
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
