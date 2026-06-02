"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Group as CandidatesIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import {
  useCandidate,
  useCandidateSkills,
  useUpdateCandidate,
  useUpsertCandidateSkills,
} from "@/features/candidates/hooks/use-candidates";
import { CandidateForm } from "@/features/candidates/components/candidate-form";
import type { CandidateFormValues } from "@/features/candidates/schemas/candidate.schema";

interface EditCandidatePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCandidatePage({ params }: EditCandidatePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const candidateQuery = useCandidate(id);
  const skillsQuery = useCandidateSkills(id);
  const updateCandidate = useUpdateCandidate(id);
  const upsertSkills = useUpsertCandidateSkills();

  const candidate = candidateQuery.data?.data;

  const defaultValues = useMemo<Partial<CandidateFormValues>>(() => {
    if (!candidate) return {};
    const candidateSkills = skillsQuery.data?.data ?? [];
    return {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      date_of_birth: candidate.date_of_birth,
      gender: candidate.gender,
      total_experience_years: candidate.total_experience_years
        ? Number(candidate.total_experience_years)
        : null,
      current_company: candidate.current_company,
      current_job_title: candidate.current_job_title,
      current_location: candidate.current_location,
      notice_period_days: candidate.notice_period_days,
      current_salary: candidate.current_salary ? Number(candidate.current_salary) : null,
      expected_salary: candidate.expected_salary ? Number(candidate.expected_salary) : null,
      currency_code: candidate.currency_code,
      linkedin_url: candidate.linkedin_url,
      github_url: candidate.github_url,
      portfolio_url: candidate.portfolio_url,
      resume_headline: candidate.resume_headline,
      source_type: candidate.source_type,
      source_details: candidate.source_details,
      is_active: candidate.is_active,
      skills: candidateSkills.map((s) => ({
        skill_id: s.skill_id,
        years_of_experience: s.years_of_experience ? Number(s.years_of_experience) : null,
        proficiency_level: s.proficiency_level,
        is_primary: s.is_primary,
      })),
    };
  }, [candidate, skillsQuery.data?.data]);

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

      const result = await updateCandidate.mutateAsync(payload);

      await upsertSkills.mutateAsync({
        candidateId: id,
        payload: {
          skills: (values.skills ?? []).map((s) => ({
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

      showSuccess(result.message || "Candidate updated successfully");
      router.push(`${ROUTES.CANDIDATES}/${id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  if (candidateQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load candidate
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(candidateQuery.error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.CANDIDATES)}>
          Back to Candidates
        </Button>
      </Box>
    );
  }

  const isSubmitting = updateCandidate.isPending || upsertSkills.isPending;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.CANDIDATES} underline="hover" color="inherit">
          Candidates
        </Link>
        <Typography color="text.primary">
          {candidateQuery.isLoading ? <Skeleton width={220} /> : `${candidate?.first_name} ${candidate?.last_name}`}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button variant="text" startIcon={<BackIcon />} onClick={() => router.push(`${ROUTES.CANDIDATES}/${id}`)} sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Edit Candidate
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <CandidatesIcon color="primary" />
        </Stack>
      </Stack>

      <CandidateForm
        title="Update Candidate Profile"
        subtitle="Edit candidate details and update skills."
        defaultValues={defaultValues}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        onCancel={() => router.push(`${ROUTES.CANDIDATES}/${id}`)}
        onSubmit={onSubmit}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
