"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  interviewRoundSchema,
  type InterviewRoundFormValues,
} from "@/features/interview-rounds/schemas/interview-round.schema";
import {
  INTERVIEW_ROUND_TYPES,
  INTERVIEW_ROUND_TYPE_LABELS,
} from "@/features/interview-rounds/types/interview-rounds.types";
import { useJobOpenings } from "@/features/job-openings/hooks/use-job-openings";
import { getApiErrorMessage } from "@/utils/api-error-handler";

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

export interface InterviewRoundFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<InterviewRoundFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableJobOpeningSelect?: boolean;
  onCancel?: () => void;
  onSubmit: (values: InterviewRoundFormValues) => void | Promise<void>;
}

export function InterviewRoundForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableJobOpeningSelect,
  onCancel,
  onSubmit,
}: InterviewRoundFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterviewRoundFormValues>({
    resolver: zodResolver(interviewRoundSchema) as unknown as Resolver<InterviewRoundFormValues>,
    defaultValues: {
      job_opening_id: defaultValues?.job_opening_id ?? "",
      round_name: defaultValues?.round_name ?? "",
      round_type: (defaultValues?.round_type as InterviewRoundFormValues["round_type"]) ?? INTERVIEW_ROUND_TYPES[0],
      sequence_number: defaultValues?.sequence_number ?? 1,
      is_mandatory: defaultValues?.is_mandatory ?? true,
      max_score: defaultValues?.max_score ?? null,
      description: defaultValues?.description ?? null,
    },
    mode: "onTouched",
  });

  const selectedJobOpeningId = useWatch({ control, name: "job_opening_id" });

  const jobOpeningsQuery = useJobOpenings({
    page: 1,
    limit: 100,
    sort_by: "created_at",
    sort_order: "DESC",
  });

  const jobOpenings = unwrapListData<{
    id: string;
    title: string;
    code: string;
    status: string;
    is_active: boolean;
  }>(jobOpeningsQuery.data);

  const isJobOpeningMissing =
    !!selectedJobOpeningId && !jobOpenings.some((j) => j.id === selectedJobOpeningId);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Round Setup</Typography>
                <Typography variant="body2" color="text.secondary">
                  Define the round structure for a specific job opening.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="job_opening_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Job Opening"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.job_opening_id}
                    helperText={
                      errors.job_opening_id?.message ||
                      (jobOpeningsQuery.isError
                        ? `Unable to load job openings: ${getApiErrorMessage(jobOpeningsQuery.error)}`
                        : undefined) ||
                      (isJobOpeningMissing
                        ? "This job opening is not in the current list"
                        : undefined)
                    }
                    disabled={disableJobOpeningSelect || jobOpeningsQuery.isLoading}
                  >
                    {jobOpeningsQuery.isLoading ? (
                      <MenuItem value="" disabled>
                        Loading job openings...
                      </MenuItem>
                    ) : null}
                    {jobOpeningsQuery.isError ? (
                      <MenuItem value="" disabled>
                        Unable to load job openings
                      </MenuItem>
                    ) : null}

                    {jobOpenings.map((j) => (
                      <MenuItem key={j.id} value={j.id}>
                        {j.title} ({j.code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Round Name"
                fullWidth
                placeholder="e.g. Technical Round 1"
                {...register("round_name")}
                error={!!errors.round_name}
                helperText={errors.round_name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="round_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Round Type"
                    fullWidth
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.round_type}
                    helperText={errors.round_type?.message}
                  >
                    {INTERVIEW_ROUND_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {INTERVIEW_ROUND_TYPE_LABELS[t] ?? t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="sequence_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Sequence (1-based)"
                    fullWidth
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    error={!!errors.sequence_number}
                    helperText={errors.sequence_number?.message ?? "Defines round order"}
                    slotProps={{ htmlInput: { min: 1, max: 50 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="max_score"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Max Score (optional)"
                    fullWidth
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? null : Number(v));
                    }}
                    error={!!errors.max_score}
                    helperText={errors.max_score?.message ?? "Leave empty if not used"}
                    slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Controller
                    name="is_mandatory"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label="Mandatory round"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Description (optional)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description?.message ?? "Add guidance for interviewers"}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!!isSubmitting}
                >
                  {isSubmitting ? "Saving..." : submitLabel}
                </Button>
                {onCancel ? (
                  <Button variant="outlined" onClick={onCancel} disabled={!!isSubmitting}>
                    Cancel
                  </Button>
                ) : null}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
