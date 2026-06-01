"use client";

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

import {
  jobOpeningSchema,
  type JobOpeningFormValues,
} from "@/features/job-openings/schemas/job-opening.schema";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  JOB_OPENING_STATUSES,
  JOB_OPENING_STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
} from "@/features/job-openings/types/job-openings.types";
import { JobOpeningSkillsEditor } from "@/features/job-openings/components/job-opening-skills-editor";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useSkills } from "@/features/skills/hooks/use-skills";
import type { SkillResponse } from "@/features/skills/types/skills.types";
import { useUsers } from "@/features/users/hooks/use-users";
import { ROLES } from "@/constants/roles";
import type { Resolver } from "react-hook-form";

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  // Offset mode
  if (Array.isArray(obj.data)) return obj.data as T[];

  // Cursor mode
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

export interface JobOpeningFormProps {
  title: string;
  subtitle?: string;
  defaultValues?: Partial<JobOpeningFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: JobOpeningFormValues) => void | Promise<void>;
}

export function JobOpeningForm({
  title,
  subtitle,
  defaultValues,
  submitLabel = "Save",
  isSubmitting,
  disableSubmit,
  onCancel,
  onSubmit,
}: JobOpeningFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<JobOpeningFormValues>({
    resolver: zodResolver(jobOpeningSchema) as unknown as Resolver<JobOpeningFormValues>,
    defaultValues: {
      title: defaultValues?.title ?? "",
      code: defaultValues?.code ?? "",
      department_id: defaultValues?.department_id ?? "",
      hiring_manager_user_id: defaultValues?.hiring_manager_user_id ?? "",
      recruiter_user_id: defaultValues?.recruiter_user_id ?? "",
      employment_type: defaultValues?.employment_type ?? EMPLOYMENT_TYPES[0],
      work_mode: defaultValues?.work_mode ?? WORK_MODES[0],
      experience_min_years: defaultValues?.experience_min_years ?? null,
      experience_max_years: defaultValues?.experience_max_years ?? null,
      min_salary: defaultValues?.min_salary ?? null,
      max_salary: defaultValues?.max_salary ?? null,
      currency_code: defaultValues?.currency_code ?? null,
      openings_count: defaultValues?.openings_count ?? 1,
      job_description: defaultValues?.job_description ?? null,
      responsibilities: defaultValues?.responsibilities ?? null,
      requirements: defaultValues?.requirements ?? null,
      location: defaultValues?.location ?? null,
      status: defaultValues?.status,
      is_active: defaultValues?.is_active ?? true,
      skills: defaultValues?.skills ?? [],
    },
    mode: "onTouched",
  });

  const selectedDepartmentId = watch("department_id");

  const departmentsQuery = useDepartments({
    page: 1,
    limit: 100,
    is_active: true,
    sort_by: "name",
    sort_order: "ASC",
  });

  const skillsQuery = useSkills({
    page: 1,
    limit: 100,
    is_active: true,
    sort_by: "name",
    sort_order: "ASC",
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

  const departments = unwrapListData<{ id: string; name: string; is_active: boolean }>(
    departmentsQuery.data,
  );

  const skills = unwrapListData<SkillResponse>(skillsQuery.data);

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

  const isDepartmentMissing =
    !!selectedDepartmentId &&
    !departments.some((d) => d.id === selectedDepartmentId);

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
            {/* Basic */}
            <Grid size={{ xs: 12 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 900 }}>Basic</Typography>
                <Typography variant="body2" color="text.secondary">
                  Core information used across the recruitment pipeline.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Job Title"
                fullWidth
                placeholder="e.g. Senior Backend Engineer"
                {...register("title")}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Job Code"
                fullWidth
                placeholder="e.g. BE-2026-001"
                {...register("code")}
                error={!!errors.code}
                helperText={errors.code?.message ?? "Uppercase recommended"}
                slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="department_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Department"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.department_id}
                    helperText={
                      errors.department_id?.message ||
                      (isDepartmentMissing
                        ? "This department is not in the active list"
                        : undefined)
                    }
                    disabled={departmentsQuery.isLoading || departmentsQuery.isError}
                  >
                    {departmentsQuery.isLoading ? (
                      <MenuItem value="" disabled>
                        Loading departments...
                      </MenuItem>
                    ) : null}

                    {departmentsQuery.isError ? (
                      <MenuItem value="" disabled>
                        Unable to load departments
                      </MenuItem>
                    ) : null}

                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="employment_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Employment Type"
                    fullWidth
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.employment_type}
                    helperText={errors.employment_type?.message}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {EMPLOYMENT_TYPE_LABELS[t]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="work_mode"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Work Mode"
                    fullWidth
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.work_mode}
                    helperText={errors.work_mode?.message}
                  >
                    {WORK_MODES.map((m) => (
                      <MenuItem key={m} value={m}>
                        {WORK_MODE_LABELS[m]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Assignment */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
              <Stack spacing={0.25} sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Assignment</Typography>
                <Typography variant="body2" color="text.secondary">
                  People accountable for this role.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="recruiter_user_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Recruiter"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.recruiter_user_id}
                    helperText={
                      errors.recruiter_user_id?.message ||
                      (recruitersQuery.isError ? "Failed to load recruiters" : undefined)
                    }
                    disabled={recruitersQuery.isLoading || recruitersQuery.isError}
                  >
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
                name="hiring_manager_user_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Hiring Manager"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.hiring_manager_user_id}
                    helperText={
                      errors.hiring_manager_user_id?.message ||
                      (hiringManagersQuery.isError
                        ? "Failed to load hiring managers"
                        : undefined)
                    }
                    disabled={hiringManagersQuery.isLoading || hiringManagersQuery.isError}
                  >
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

            {/* Metrics */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
              <Stack spacing={0.25} sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Experience & Compensation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Optional ranges help candidates and internal reporting.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="experience_min_years"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Min Experience (years)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.experience_min_years}
                    helperText={errors.experience_min_years?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="experience_max_years"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Max Experience (years)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.experience_max_years}
                    helperText={errors.experience_max_years?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="min_salary"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Min Salary (annual)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.min_salary}
                    helperText={errors.min_salary?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="max_salary"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Max Salary (annual)"
                    type="number"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.max_salary}
                    helperText={errors.max_salary?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="currency_code"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Currency Code"
                    fullWidth
                    placeholder="e.g. INR"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.currency_code}
                    helperText={errors.currency_code?.message}
                    slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="openings_count"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Openings Count"
                    type="number"
                    fullWidth
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.openings_count}
                    helperText={errors.openings_count?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Location"
                    fullWidth
                    placeholder="e.g. Bengaluru, IN"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.location}
                    helperText={errors.location?.message}
                  />
                )}
              />
            </Grid>

            {/* Skills */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
              <Stack spacing={0.25} sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Skills</Typography>
                <Typography variant="body2" color="text.secondary">
                  These are used for candidate screening and interviewer matching.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Box>
                    <JobOpeningSkillsEditor
                      options={skills}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={skillsQuery.isLoading || skillsQuery.isError}
                    />

                    {skillsQuery.isError ? (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Failed to load skills.
                      </Typography>
                    ) : null}

                    {errors.skills?.message ? (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {String(errors.skills.message)}
                      </Typography>
                    ) : null}
                  </Box>
                )}
              />
            </Grid>

            {/* Descriptions */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
              <Stack spacing={0.25} sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Description</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add enough detail for candidates and internal reviewers.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="job_description"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Job Description"
                    fullWidth
                    multiline
                    minRows={3}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.job_description}
                    helperText={errors.job_description?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="responsibilities"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Responsibilities"
                    fullWidth
                    multiline
                    minRows={3}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.responsibilities}
                    helperText={errors.responsibilities?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="requirements"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Requirements"
                    fullWidth
                    multiline
                    minRows={3}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={!!errors.requirements}
                    helperText={errors.requirements?.message}
                  />
                )}
              />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
              <Stack spacing={0.25} sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Status</Typography>
                <Typography variant="body2" color="text.secondary">
                  You can also manage status using actions like Publish / Close.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    error={!!errors.status}
                    helperText={errors.status?.message ?? "Leave empty to default to Draft"}
                  >
                    <MenuItem value="">
                      <em>Default (Draft)</em>
                    </MenuItem>
                    {JOB_OPENING_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {JOB_OPENING_STATUS_LABELS[s]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      borderColor: (t) => alpha(t.palette.divider, 0.9),
                      p: 0,
                    }}
                  >
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!field.value}
                            onChange={(_, checked) => field.onChange(checked)}
                            color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                              {field.value ? "Active" : "Inactive"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Inactive openings are hidden from most workflows.
                            </Typography>
                          </Box>
                        }
                      />
                    </CardContent>
                  </Card>
                )}
              />
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ justifyContent: "flex-end", mt: 1 }}
              >
                {onCancel ? (
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    sx={{ borderRadius: 2, px: 2.5 }}
                  >
                    Cancel
                  </Button>
                ) : null}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!!disableSubmit || !!isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : undefined
                  }
                  sx={{ borderRadius: 2, px: 3, fontWeight: 900 }}
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
