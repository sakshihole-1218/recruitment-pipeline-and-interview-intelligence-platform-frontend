"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  WorkOutlined as JobOpeningsIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  useJobOpening,
  useReplaceJobOpeningSkills,
  useUpdateJobOpening,
} from "@/features/job-openings/hooks/use-job-openings";
import { JobOpeningForm } from "@/features/job-openings/components/job-opening-form";
import type { JobOpeningFormValues } from "@/features/job-openings/schemas/job-opening.schema";

interface EditJobOpeningPageProps {
  params: Promise<{ id: string }>;
}

export default function EditJobOpeningPage({ params }: EditJobOpeningPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { data, isLoading, isError, error } = useJobOpening(id);
  const opening = data?.data;

  const update = useUpdateJobOpening(id);
  const replaceSkills = useReplaceJobOpeningSkills(id);

  const defaultValues: Partial<JobOpeningFormValues> | undefined = useMemo(() => {
    if (!opening) return undefined;

    return {
      title: opening.title,
      code: opening.code,
      department_id: opening.department_id,
      recruiter_user_id: opening.recruiter_user_id,
      hiring_manager_user_id: opening.hiring_manager_user_id,
      employment_type: opening.employment_type,
      work_mode: opening.work_mode,
      experience_min_years: opening.experience_min_years,
      experience_max_years: opening.experience_max_years,
      min_salary: opening.min_salary ? Number(opening.min_salary) : null,
      max_salary: opening.max_salary ? Number(opening.max_salary) : null,
      currency_code: opening.currency_code,
      openings_count: opening.openings_count,
      location: opening.location,
      job_description: opening.job_description,
      responsibilities: opening.responsibilities,
      requirements: opening.requirements,
      status: opening.status,
      is_active: opening.is_active,
      skills:
        opening.skills?.map((s) => ({
          skill_id: s.skill_id,
          proficiency_level: s.proficiency_level,
          is_mandatory: s.is_mandatory,
          years_of_experience_required: s.years_of_experience_required ?? undefined,
        })) ?? [],
    };
  }, [opening]);

  const onSubmit = async (values: JobOpeningFormValues) => {
    try {
      const currency = values.currency_code;
      const location = values.location;
      const jobDescription = values.job_description;
      const responsibilities = values.responsibilities;
      const requirements = values.requirements;

      // 1) Update fields (excluding skills)
      const updatePayload = {
        title: values.title.trim(),
        code: values.code.trim().toUpperCase(),
        department_id: values.department_id,
        hiring_manager_user_id: values.hiring_manager_user_id,
        recruiter_user_id: values.recruiter_user_id,
        employment_type: values.employment_type,
        work_mode: values.work_mode,
        experience_min_years:
          values.experience_min_years === null ? undefined : values.experience_min_years,
        experience_max_years:
          values.experience_max_years === null ? undefined : values.experience_max_years,
        min_salary: values.min_salary === null ? undefined : values.min_salary,
        max_salary: values.max_salary === null ? undefined : values.max_salary,
        currency_code:
          currency === null || currency === undefined
            ? null
            : currency.trim() === ""
              ? null
              : currency.trim().toUpperCase(),
        openings_count: values.openings_count,
        location:
          location === null || location === undefined
            ? null
            : location.trim() === ""
              ? null
              : location.trim(),
        job_description:
          jobDescription === null || jobDescription === undefined
            ? null
            : jobDescription.trim() === ""
              ? null
              : jobDescription,
        responsibilities:
          responsibilities === null || responsibilities === undefined
            ? null
            : responsibilities.trim() === ""
              ? null
              : responsibilities,
        requirements:
          requirements === null || requirements === undefined
            ? null
            : requirements.trim() === ""
              ? null
              : requirements,
        status: values.status,
        is_active: values.is_active ?? true,
      };

      const updated = await update.mutateAsync(updatePayload);

      // 2) Replace skills (always mirrors form)
      await replaceSkills.mutateAsync({
        skills: (values.skills ?? []).map((s) => ({
          skill_id: s.skill_id,
          proficiency_level: s.proficiency_level,
          is_mandatory: s.is_mandatory ?? true,
          years_of_experience_required:
            s.years_of_experience_required === null ||
            s.years_of_experience_required === undefined
              ? undefined
              : s.years_of_experience_required,
        })),
      });

      showSuccess(updated.message || "Job opening updated successfully");
      router.push(`${ROUTES.JOB_OPENINGS}/${id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load job opening
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(error)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.JOB_OPENINGS}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Job Openings
        </Link>
        <Link
          component={NextLink}
          href={`${ROUTES.JOB_OPENINGS}/${id}`}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Details
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
          Edit
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
              <JobOpeningsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Edit Job Opening
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Update role details, ownership, and skills.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {isLoading || !defaultValues ? (
            <Stack spacing={2}>
              <Skeleton height={60} />
              <Skeleton height={400} />
            </Stack>
          ) : (
            <JobOpeningForm
              title="Job Opening Information"
              subtitle="Edit core role details, assignment, and skills."
              defaultValues={defaultValues}
              submitLabel="Save Changes"
              isSubmitting={update.isPending || replaceSkills.isPending}
              onCancel={() => router.push(`${ROUTES.JOB_OPENINGS}/${id}`)}
              onSubmit={onSubmit}
            />
          )}
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
