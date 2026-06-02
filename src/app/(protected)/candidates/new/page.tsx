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
  Group as CandidatesIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import {
  useCreateCandidate,
  useUpsertCandidateSkills,
} from "@/features/candidates/hooks/use-candidates";
import { CandidateForm } from "@/features/candidates/components/candidate-form";
import type { CandidateFormValues } from "@/features/candidates/schemas/candidate.schema";

export default function CreateCandidatePage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const createCandidate = useCreateCandidate();
  const upsertSkills = useUpsertCandidateSkills();

  const onSubmit = async (values: CandidateFormValues) => {
    try {
      const payload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone: values.phone && values.phone.trim() !== "" ? values.phone.trim() : null,
        date_of_birth: values.date_of_birth ?? undefined,
        gender: values.gender ?? undefined,
        total_experience_years:
          values.total_experience_years === null ? undefined : values.total_experience_years,
        current_company:
          values.current_company && values.current_company.trim() !== ""
            ? values.current_company.trim()
            : undefined,
        current_job_title:
          values.current_job_title && values.current_job_title.trim() !== ""
            ? values.current_job_title.trim()
            : undefined,
        current_location:
          values.current_location && values.current_location.trim() !== ""
            ? values.current_location.trim()
            : undefined,
        notice_period_days:
          values.notice_period_days === null ? undefined : values.notice_period_days,
        current_salary: values.current_salary === null ? undefined : values.current_salary,
        expected_salary: values.expected_salary === null ? undefined : values.expected_salary,
        currency_code:
          values.currency_code && values.currency_code.trim() !== ""
            ? values.currency_code.trim().toUpperCase()
            : undefined,
        linkedin_url:
          values.linkedin_url && values.linkedin_url.trim() !== ""
            ? values.linkedin_url.trim()
            : undefined,
        github_url:
          values.github_url && values.github_url.trim() !== ""
            ? values.github_url.trim()
            : undefined,
        portfolio_url:
          values.portfolio_url && values.portfolio_url.trim() !== ""
            ? values.portfolio_url.trim()
            : undefined,
        resume_headline:
          values.resume_headline && values.resume_headline.trim() !== ""
            ? values.resume_headline.trim()
            : undefined,
        source_type: values.source_type ?? undefined,
        source_details:
          values.source_details && values.source_details.trim() !== ""
            ? values.source_details.trim()
            : undefined,
        is_active: values.is_active ?? true,
      };

      const result = await createCandidate.mutateAsync(payload);

      const candidateId = result.data.id;

      if (values.skills && values.skills.length > 0) {
        await upsertSkills.mutateAsync({
          candidateId,
          payload: {
            skills: values.skills.map((s) => ({
              skill_id: s.skill_id,
              years_of_experience:
                s.years_of_experience === null || s.years_of_experience === undefined
                  ? undefined
                  : s.years_of_experience,
              proficiency_level: s.proficiency_level ?? undefined,
              is_primary: s.is_primary ?? false,
            })),
          },
        });
      }

      showSuccess(result.message || "Candidate created successfully");
      router.push(`${ROUTES.CANDIDATES}/${candidateId}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const isSubmitting = createCandidate.isPending || upsertSkills.isPending;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={ROUTES.CANDIDATES}
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          Candidates
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 900, fontSize: "0.875rem" }}>
          Create
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
              <CandidatesIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Create Candidate
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Add a new candidate profile and skills.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <CandidateForm
            title="Candidate Information"
            subtitle="Capture contact details, experience and sourcing info."
            submitLabel="Create"
            isSubmitting={isSubmitting}
            onCancel={() => router.push(ROUTES.CANDIDATES)}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
