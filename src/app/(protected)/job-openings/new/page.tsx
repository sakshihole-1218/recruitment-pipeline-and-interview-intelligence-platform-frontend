"use client";

import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Link,
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
import { useCreateJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import {
  JobOpeningForm,
} from "@/features/job-openings/components/job-opening-form";
import type { JobOpeningFormValues } from "@/features/job-openings/schemas/job-opening.schema";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

export default function CreateJobOpeningPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const createJobOpening = useCreateJobOpening();

  const onSubmit = async (values: JobOpeningFormValues) => {
    try {
      const payload = {
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
          values.currency_code && values.currency_code.trim() !== ""
            ? values.currency_code.trim().toUpperCase()
            : undefined,
        openings_count: values.openings_count,
        location:
          values.location && values.location.trim() !== "" ? values.location.trim() : undefined,
        job_description:
          values.job_description && values.job_description.trim() !== ""
            ? values.job_description
            : undefined,
        responsibilities:
          values.responsibilities && values.responsibilities.trim() !== ""
            ? values.responsibilities
            : undefined,
        requirements:
          values.requirements && values.requirements.trim() !== "" ? values.requirements : undefined,
        status: values.status,
        is_active: values.is_active ?? true,
        skills:
          values.skills && values.skills.length > 0
            ? values.skills.map((s) => ({
                skill_id: s.skill_id,
                proficiency_level: s.proficiency_level,
                is_mandatory: s.is_mandatory ?? true,
                years_of_experience_required:
                  s.years_of_experience_required === null ||
                  s.years_of_experience_required === undefined
                    ? undefined
                    : s.years_of_experience_required,
              }))
            : undefined,
      };

      const result = await createJobOpening.mutateAsync(payload);
      showSuccess(result.message || "Job opening created successfully");
      router.push(`${ROUTES.JOB_OPENINGS}/${result.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

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
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
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
              <JobOpeningsIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Create Job Opening
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Add a new role and define skills, ownership and requirements.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <JobOpeningForm
            title="Job Opening Information"
            subtitle="Fill core role details, assignment, and skills."
            submitLabel="Create"
            isSubmitting={createJobOpening.isPending}
            onCancel={() => router.push(ROUTES.JOB_OPENINGS)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
