"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { useEffect, useMemo, useState } from "react";
import type { Resolver } from "react-hook-form";

import {
  createApplicationSchema,
  type CreateApplicationFormValues,
} from "@/features/applications/schemas/application.schema";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import type { CandidateResponse } from "@/features/candidates/types/candidates.types";
import { useJobOpenings } from "@/features/job-openings/hooks/use-job-openings";
import type { JobOpeningResponse } from "@/features/job-openings/types/job-openings.types";
import { useUsers } from "@/features/users/hooks/use-users";
import { ROLES } from "@/constants/roles";

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  // Offset mode
  if (Array.isArray(obj.data)) return obj.data as T[];

  // Cursor mode
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

function candidateSearchToParams(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return {};

  // Heuristic: email search if contains '@'
  if (trimmed.includes("@")) {
    return { email: trimmed };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
  }

  return { first_name: trimmed };
}

export interface ApplicationFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<CreateApplicationFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: CreateApplicationFormValues) => void | Promise<void>;
}

export function ApplicationForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Create Application",
  isSubmitting,
  disableSubmit,
  onCancel,
  onSubmit,
}: ApplicationFormProps) {
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<CreateApplicationFormValues>({
    resolver: zodResolver(createApplicationSchema) as unknown as Resolver<CreateApplicationFormValues>,
    defaultValues: {
      candidate_id: defaultValues?.candidate_id ?? "",
      job_opening_id: defaultValues?.job_opening_id ?? "",
      assigned_recruiter_user_id: defaultValues?.assigned_recruiter_user_id,
      assigned_hiring_manager_user_id: defaultValues?.assigned_hiring_manager_user_id,
      is_priority: defaultValues?.is_priority ?? false,
    },
    mode: "onTouched",
  });

  const candidateId = useWatch({ control, name: "candidate_id" });
  const jobOpeningId = useWatch({ control, name: "job_opening_id" });

  const [candidateSearch, setCandidateSearch] = useState("");
  const [jobOpeningSearch, setJobOpeningSearch] = useState("");

  const debouncedCandidateSearch = useDebouncedValue(candidateSearch, 350);
  const debouncedJobOpeningSearch = useDebouncedValue(jobOpeningSearch, 350);

  const candidatesQuery = useCandidates({
    page: 1,
    limit: 10,
    ...candidateSearchToParams(debouncedCandidateSearch),
    sort_by: "updated_at",
    sort_order: "DESC",
    is_active: true,
  });

  const jobOpeningsQuery = useJobOpenings({
    page: 1,
    limit: 10,
    ...(debouncedJobOpeningSearch ? { title: debouncedJobOpeningSearch } : {}),
    sort_by: "updated_at",
    sort_order: "DESC",
    is_active: true,
  });

  const recruitersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.RECRUITER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const hiringManagersQuery = useUsers({
    page: 1,
    limit: 100,
    is_active: true,
    role_code: ROLES.HIRING_MANAGER,
    sort_by: "first_name",
    sort_order: "ASC",
  });

  const candidates = unwrapListData<CandidateResponse>(candidatesQuery.data);
  const openings = unwrapListData<JobOpeningResponse>(jobOpeningsQuery.data);

  const recruiters = unwrapListData<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
  }>(recruitersQuery.data);

  const hiringManagers = unwrapListData<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
  }>(hiringManagersQuery.data);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === candidateId) ?? null,
    [candidates, candidateId],
  );

  const selectedOpening = useMemo(
    () => openings.find((o) => o.id === jobOpeningId) ?? null,
    [openings, jobOpeningId],
  );

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
                <Typography sx={{ fontWeight: 900 }}>Application</Typography>
                <Typography variant="body2" color="text.secondary">
                  Link a candidate to a job opening and optionally assign owners.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="candidate_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={candidates}
                    value={selectedCandidate}
                    onChange={(_, value) => field.onChange(value?.id ?? "")}
                    onInputChange={(_, value) => setCandidateSearch(value)}
                    getOptionLabel={(option) =>
                      `${option.first_name} ${option.last_name}`.trim() || option.email
                    }
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    loading={candidatesQuery.isLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Candidate"
                        placeholder="Search by name or email"
                        error={!!errors.candidate_id}
                        helperText={errors.candidate_id?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="job_opening_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={openings}
                    value={selectedOpening}
                    onChange={(_, value) => field.onChange(value?.id ?? "")}
                    onInputChange={(_, value) => setJobOpeningSearch(value)}
                    getOptionLabel={(option) => `${option.title} (${option.code})`}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    loading={jobOpeningsQuery.isLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Job Opening"
                        placeholder="Search by title"
                        error={!!errors.job_opening_id}
                        helperText={errors.job_opening_id?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="assigned_recruiter_user_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Assigned Recruiter (optional)"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    error={!!errors.assigned_recruiter_user_id}
                    helperText={errors.assigned_recruiter_user_id?.message}
                    disabled={recruitersQuery.isLoading || recruitersQuery.isError}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {recruitersQuery.isLoading ? (
                      <MenuItem value="" disabled>
                        Loading recruiters...
                      </MenuItem>
                    ) : null}
                    {recruitersQuery.isError ? (
                      <MenuItem value="" disabled>
                        Unable to load recruiters
                      </MenuItem>
                    ) : null}
                    {recruiters.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} — {u.email}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="assigned_hiring_manager_user_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Assigned Hiring Manager (optional)"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    error={!!errors.assigned_hiring_manager_user_id}
                    helperText={errors.assigned_hiring_manager_user_id?.message}
                    disabled={hiringManagersQuery.isLoading || hiringManagersQuery.isError}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {hiringManagersQuery.isLoading ? (
                      <MenuItem value="" disabled>
                        Loading hiring managers...
                      </MenuItem>
                    ) : null}
                    {hiringManagersQuery.isError ? (
                      <MenuItem value="" disabled>
                        Unable to load hiring managers
                      </MenuItem>
                    ) : null}
                    {hiringManagers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} — {u.email}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  borderRadius: 2,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
                  p: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      {...register("is_priority")}
                      defaultChecked={defaultValues?.is_priority ?? false}
                    />
                  }
                  label={
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 900 }}>Priority application</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Highlights this application in lists and triage.
                      </Typography>
                    </Stack>
                  }
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
                {onCancel ? (
                  <Button onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                ) : null}
                <Button
                  variant="contained"
                  type="submit"
                  disabled={disableSubmit || isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
                >
                  {submitLabel}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
