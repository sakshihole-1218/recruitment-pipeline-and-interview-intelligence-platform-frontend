"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  alpha,
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
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  candidateSchema,
  type CandidateFormValues,
} from "@/features/candidates/schemas/candidate.schema";
import {
  CANDIDATE_GENDER_LABELS,
  CANDIDATE_GENDERS,
  CANDIDATE_SOURCE_TYPE_LABELS,
  CANDIDATE_SOURCE_TYPES,
} from "@/features/candidates/types/candidates.types";
import { CandidateSkillsEditor } from "@/features/candidates/components/candidate-skills-editor";
import { useSkills } from "@/features/skills/hooks/use-skills";
import type { SkillResponse } from "@/features/skills/types/skills.types";

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  // Offset mode
  if (Array.isArray(obj.data)) return obj.data as T[];

  // Cursor mode
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

export interface CandidateFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<CandidateFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: CandidateFormValues) => void | Promise<void>;
}

export function CandidateForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableSubmit,
  onCancel,
  onSubmit,
}: CandidateFormProps) {
  const resolvedDefaultValues = useMemo<CandidateFormValues>(
    () => ({
      first_name: defaultValues?.first_name ?? "",
      last_name: defaultValues?.last_name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? null,
      date_of_birth: defaultValues?.date_of_birth ?? null,
      gender: defaultValues?.gender ?? null,
      total_experience_years: defaultValues?.total_experience_years ?? null,
      current_company: defaultValues?.current_company ?? null,
      current_job_title: defaultValues?.current_job_title ?? null,
      current_location: defaultValues?.current_location ?? null,
      notice_period_days: defaultValues?.notice_period_days ?? null,
      current_salary: defaultValues?.current_salary ?? null,
      expected_salary: defaultValues?.expected_salary ?? null,
      currency_code: defaultValues?.currency_code ?? null,
      linkedin_url: defaultValues?.linkedin_url ?? null,
      github_url: defaultValues?.github_url ?? null,
      portfolio_url: defaultValues?.portfolio_url ?? null,
      resume_headline: defaultValues?.resume_headline ?? null,
      source_type: defaultValues?.source_type ?? null,
      source_details: defaultValues?.source_details ?? null,
      is_active: defaultValues?.is_active ?? true,
      skills: defaultValues?.skills ?? [],
    }),
    [defaultValues],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema) as unknown as Resolver<CandidateFormValues>,
    defaultValues: resolvedDefaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    // React Hook Form only uses `defaultValues` on first render.
    // For edit pages, values arrive async, so reset once they are available.
    if (!defaultValues) return;
    if (isDirty) return;

    const hasAnyPrefill =
      typeof defaultValues.first_name === "string" ||
      typeof defaultValues.last_name === "string" ||
      typeof defaultValues.email === "string" ||
      Array.isArray(defaultValues.skills);
    if (!hasAnyPrefill) return;

    reset(resolvedDefaultValues);
  }, [defaultValues, isDirty, reset, resolvedDefaultValues]);

  const currency = watch("currency_code");

  const skillsQuery = useSkills({
    page: 1,
    limit: 100,
    is_active: true,
    sort_by: "name",
    sort_order: "ASC",
  });

  const skillOptions = unwrapListData<SkillResponse>(skillsQuery.data);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
            {/* Personal */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Personal</Typography>
                <Typography variant="body2" color="text.secondary">
                  Identity and basic profile details.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="First Name"
                fullWidth
                placeholder="e.g. Sakshi"
                {...register("first_name")}
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Last Name"
                fullWidth
                placeholder="e.g. Sharma"
                {...register("last_name")}
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : e.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.date_of_birth}
                    helperText={errors.date_of_birth?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Gender"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                    error={!!errors.gender}
                    helperText={errors.gender?.message}
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    {CANDIDATE_GENDERS.map((g) => (
                      <MenuItem key={g} value={g}>
                        {CANDIDATE_GENDER_LABELS[g]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Contact */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Contact</Typography>
                <Typography variant="body2" color="text.secondary">
                  Primary contact details for outreach.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                fullWidth
                placeholder="e.g. sakshi@example.com"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Phone (optional)"
                fullWidth
                placeholder="e.g. +919876543210"
                {...register("phone")}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Experience */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Experience</Typography>
                <Typography variant="body2" color="text.secondary">
                  Current role, location and overall experience.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="total_experience_years"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Total Experience (years)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    error={!!errors.total_experience_years}
                    helperText={errors.total_experience_years?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Current Company (optional)"
                fullWidth
                {...register("current_company")}
                error={!!errors.current_company}
                helperText={errors.current_company?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Current Job Title (optional)"
                fullWidth
                {...register("current_job_title")}
                error={!!errors.current_job_title}
                helperText={errors.current_job_title?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Current Location (optional)"
                fullWidth
                placeholder="e.g. Bengaluru, IN"
                {...register("current_location")}
                error={!!errors.current_location}
                helperText={errors.current_location?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="notice_period_days"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Notice Period (days)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    error={!!errors.notice_period_days}
                    helperText={errors.notice_period_days?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Compensation */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Compensation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Optional salary details (use with discretion).
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="current_salary"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Current Salary"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    error={!!errors.current_salary}
                    helperText={errors.current_salary?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="expected_salary"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Expected Salary"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    error={!!errors.expected_salary}
                    helperText={errors.expected_salary?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Currency"
                fullWidth
                placeholder="e.g. INR"
                value={currency ?? ""}
                {...register("currency_code")}
                error={!!errors.currency_code}
                helperText={errors.currency_code?.message ?? "Uppercase recommended"}
                slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Links */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Links</Typography>
                <Typography variant="body2" color="text.secondary">
                  Social profiles and portfolio (optional).
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="LinkedIn URL"
                fullWidth
                placeholder="https://www.linkedin.com/in/..."
                {...register("linkedin_url")}
                error={!!errors.linkedin_url}
                helperText={errors.linkedin_url?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="GitHub URL"
                fullWidth
                placeholder="https://github.com/..."
                {...register("github_url")}
                error={!!errors.github_url}
                helperText={errors.github_url?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Portfolio URL"
                fullWidth
                placeholder="https://..."
                {...register("portfolio_url")}
                error={!!errors.portfolio_url}
                helperText={errors.portfolio_url?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Resume Headline"
                fullWidth
                placeholder="e.g. Backend engineer with 5+ years in Node.js"
                {...register("resume_headline")}
                error={!!errors.resume_headline}
                helperText={errors.resume_headline?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Source */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Sourcing</Typography>
                <Typography variant="body2" color="text.secondary">
                  How the candidate entered your pipeline.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="source_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Source Type"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                    error={!!errors.source_type}
                    helperText={errors.source_type?.message}
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    {CANDIDATE_SOURCE_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {CANDIDATE_SOURCE_TYPE_LABELS[t]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Source Details"
                fullWidth
                placeholder="e.g. Referred by John Doe"
                {...register("source_details")}
                error={!!errors.source_details}
                helperText={errors.source_details?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            {/* Skills */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      p: 2,
                      background: (t) =>
                        `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(t.palette.primary.main, 0.01)} 100%)`,
                    }}
                  >
                    <CandidateSkillsEditor
                      options={skillOptions}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={skillsQuery.isLoading || skillsQuery.isError || isSubmitting}
                    />
                    {errors.skills ? (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                        {errors.skills.message as string}
                      </Typography>
                    ) : null}
                  </Box>
                )}
              />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value ?? true}
                        onChange={(_e, checked) => field.onChange(checked)}
                        disabled={isSubmitting}
                        color="success"
                      />
                    )}
                  />
                }
                label={<Typography sx={{ fontWeight: 900 }}>Active</Typography>}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            {onCancel ? (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isSubmitting}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="contained"
              disabled={disableSubmit || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ borderRadius: 2, px: 3, fontWeight: 900, ml: { sm: "auto" } }}
            >
              {submitLabel}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
