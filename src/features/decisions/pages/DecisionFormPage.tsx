"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  GavelOutlined as DecisionIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { authStorage } from "@/utils/auth-storage";
import {
  useCreateDecision,
  useDecision,
  useEligibleDecisionApplications,
  useUpdateDecision,
} from "@/features/decisions/hooks/use-decisions";
import { DecisionForm } from "@/features/decisions/components/DecisionForm";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import type { CandidateResponse } from "@/features/candidates/types/candidates.types";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import type { JobOpeningResponse } from "@/features/job-openings/types/job-openings.types";
import { feedbackService } from "@/features/feedback/services/feedback.service";
import { interviewerReviewService } from "@/features/feedback/services/interviewerReview.service";
import { resumeService } from "@/features/resumes/services/resume.service";
import type { ApplicationResponse } from "@/features/applications/types/applications.types";
import type {
  FeedbackResponse,
  InterviewerReviewResponse,
} from "@/features/feedback/types/feedback.types";
import type { ResumeAiAnalysisResponse } from "@/features/resumes/types/resume.types";
import type {
  DecisionFormValues,
  DecisionReadiness,
  EligibleDecisionApplication,
} from "@/features/decisions/types/decision.types";

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function getDecisionReadiness({
  application,
  feedback,
  interviewerReviews,
}: {
  application: ApplicationResponse | null | undefined;
  feedback: FeedbackResponse | null;
  interviewerReviews: InterviewerReviewResponse[];
}): DecisionReadiness {
  const missingItems: string[] = [];
  const eligibleStages = new Set(["DECISION", "OFFER", "HIRED", "REJECTED"]);

  if (!application || !eligibleStages.has(application.current_stage)) {
    missingItems.push("Application has not completed the interview process yet.");
  }

  if (!feedback || feedback.feedback_status !== "COMPLETED") {
    missingItems.push("Completed AI interview feedback is required.");
  }

  if (
    interviewerReviews.filter((review) => review.review_status === "SUBMITTED").length === 0
  ) {
    missingItems.push("At least one submitted interviewer review is required.");
  }

  return {
    canCreateOrUpdate: missingItems.length === 0,
    missingItems,
  };
}

export function DecisionFormPage({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = authStorage.getUser();
  const createDecisionMutation = useCreateDecision();
  const decisionQuery = useDecision(mode === "edit" ? id ?? "" : "");
  const updateDecisionMutation = useUpdateDecision(id ?? "");
  const eligibleApplicationsQuery = useEligibleDecisionApplications();

  const initialCreateApplicationId =
    searchParams.get("applicationId") ?? searchParams.get("application_id") ?? "";

  const [selectedApplicationId, setSelectedApplicationId] = useState(
    initialCreateApplicationId,
  );

  const applicationIdFromRoute =
    mode === "edit"
      ? decisionQuery.data?.data.application_id ?? ""
      : selectedApplicationId;

  const applicationQuery = useApplication(applicationIdFromRoute);
  const application = applicationQuery.data?.data;
  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;
  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const supportingQueries = useQueries({
    queries: [
      {
        queryKey: ["decisions", "feedback-form", application?.id],
        queryFn: async () => {
          const response = await feedbackService.list({
            application_id: application!.id,
            page: 1,
            limit: 1,
            sort_by: "generated_at",
            sort_order: "desc",
          });

          const rows = Array.isArray(response.data) ? response.data : response.data.data;
          return rows[0] ?? null;
        },
        enabled: !!application?.id,
      },
      {
        queryKey: ["decisions", "reviews-form", application?.id],
        queryFn: async () => {
          const response = await interviewerReviewService.getByApplication(application!.id);
          return response.data;
        },
        enabled: !!application?.id,
      },
      {
        queryKey: ["decisions", "resume-form", application?.id, candidate?.id],
        queryFn: async () => {
          if (application?.id) {
            const response = await resumeService.listAnalyses({
              application_id: application.id,
              page: 1,
              limit: 1,
              sort_by: "analyzed_at",
              sort_order: "desc",
            });

            const rows = Array.isArray(response.data) ? response.data : response.data.data;
            if (rows[0]) return rows[0];
          }

          if (candidate?.id) {
            const fallback = await resumeService.getLatestAnalysisByCandidate(candidate.id);
            return fallback.data;
          }

          return null;
        },
        enabled: !!application?.id || !!candidate?.id,
      },
    ],
  });

  const decision = decisionQuery.data?.data;
  const feedback = (supportingQueries[0]?.data ?? null) as FeedbackResponse | null;
  const interviewerReviews = (supportingQueries[1]?.data ??
    []) as InterviewerReviewResponse[];
  const resumeAnalysis = (supportingQueries[2]?.data ??
    null) as ResumeAiAnalysisResponse | null;
  const readiness = getDecisionReadiness({
    application,
    feedback,
    interviewerReviews,
  });

  const candidateName = formatName(candidate?.first_name, candidate?.last_name);
  const applicationLabel = application
    ? `${candidateName} • ${jobOpening?.title ?? application.application_number}`
    : undefined;

  const defaultValues = useMemo(
    () => ({
      application_id: applicationIdFromRoute,
      decision_status: decision?.decision_status ?? "SELECTED",
      decision_reason: decision?.decision_reason ?? "",
      decision_notes: decision?.decision_notes ?? "",
    }),
    [applicationIdFromRoute, decision?.decision_notes, decision?.decision_reason, decision?.decision_status],
  );

  const pageError =
    (decisionQuery.isError && getApiErrorMessage(decisionQuery.error)) ||
    (applicationQuery.isError && getApiErrorMessage(applicationQuery.error)) ||
    (eligibleApplicationsQuery.isError &&
      getApiErrorMessage(eligibleApplicationsQuery.error)) ||
    "";

  const isLoading =
    (mode === "edit" && decisionQuery.isLoading) || applicationQuery.isLoading;

  const eligibleApplications = eligibleApplicationsQuery.data?.data ?? [];
  const selectedEligibleApplication =
    eligibleApplications.find((applicationOption) => applicationOption.id === selectedApplicationId) ??
    null;

  const candidateOptionQueries = useQueries({
    queries: eligibleApplications.map((option) => ({
      queryKey: ["candidates", "detail", option.candidate_id],
      queryFn: () => candidatesService.getById(option.candidate_id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const jobOpeningOptionQueries = useQueries({
    queries: eligibleApplications.map((option) => ({
      queryKey: ["job-openings", "detail", option.job_opening_id],
      queryFn: () => jobOpeningsService.getById(option.job_opening_id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const candidatesById = useMemo(
    () =>
      new Map(
        candidateOptionQueries
          .map((query) => query.data?.data)
          .filter((value): value is CandidateResponse => Boolean(value))
          .map((candidateValue) => [candidateValue.id, candidateValue] as const),
      ),
    [candidateOptionQueries],
  );

  const jobOpeningsById = useMemo(
    () =>
      new Map(
        jobOpeningOptionQueries
          .map((query) => query.data?.data)
          .filter((value): value is JobOpeningResponse => Boolean(value))
          .map((jobOpeningValue) => [jobOpeningValue.id, jobOpeningValue] as const),
      ),
    [jobOpeningOptionQueries],
  );

  const buildApplicationOptionLabel = (option: EligibleDecisionApplication) => {
    const optionCandidate = candidatesById.get(option.candidate_id);
    const optionJobOpening = jobOpeningsById.get(option.job_opening_id);

    const optionCandidateName = optionCandidate
      ? formatName(optionCandidate.first_name, optionCandidate.last_name)
      : "Candidate";
    const optionJobTitle = optionJobOpening?.title ?? "Job opening";

    return `${option.application_number} • ${optionCandidateName} • ${optionJobTitle}`;
  };

  const handleSubmit = async (
    values: DecisionFormValues,
    action: "save" | "save_continue",
  ) => {
    const payload = {
      decision_status: values.decision_status,
      decision_reason: values.decision_reason.trim() || undefined,
      decision_notes: values.decision_notes.trim() || undefined,
    };

    if (mode === "create") {
      const created = await createDecisionMutation.mutateAsync({
        application_id: values.application_id,
        ...payload,
        decision_source: "HYBRID",
        decided_by_user_id: currentUser?.id,
        ai_interview_feedback_id: feedback?.id ?? undefined,
        ai_interview_session_id: feedback?.ai_interview_session_id ?? undefined,
      });

      if (action === "save_continue") {
        router.push(`${ROUTES.DECISIONS}/${created.data.id}`);
        return;
      }

      router.push(ROUTES.DECISIONS);
      return;
    }

    if (!id) return;

    await updateDecisionMutation.mutateAsync({
      ...payload,
      decision_source: "HYBRID",
    });

    if (action === "save_continue") {
      router.push(`${ROUTES.DECISIONS}/${id}`);
      return;
    }

    router.push(ROUTES.DECISIONS);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DECISIONS} underline="hover" color="inherit">
          Decisions
        </Link>
        <Typography color="text.primary">
          {mode === "create" ? "Create Decision" : "Update Decision"}
        </Typography>
      </Breadcrumbs>

      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 3,
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Button
                variant="text"
                startIcon={<BackIcon />}
                onClick={() => router.push(ROUTES.DECISIONS)}
              >
                Back
              </Button>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DecisionIcon sx={{ color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {mode === "create" ? "Create Decision" : "Update Decision"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {applicationLabel ?? "Open this screen from a specific application context."}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        {mode === "create" ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 3,
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Select Application
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pick the application you want to make a final hiring decision for.
              </Typography>
              <Autocomplete
                options={eligibleApplications}
                value={selectedEligibleApplication}
                onChange={(_event, value) => {
                  const nextId = value?.id ?? "";
                  setSelectedApplicationId(nextId);
                  router.replace(
                    nextId
                      ? `${ROUTES.DECISIONS}/create?applicationId=${nextId}`
                      : `${ROUTES.DECISIONS}/create`,
                  );
                }}
                loading={eligibleApplicationsQuery.isLoading}
                getOptionLabel={buildApplicationOptionLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Application"
                    placeholder="Search eligible applications"
                    helperText={
                      eligibleApplications.length === 0
                        ? "No eligible applications are currently available for decisioning."
                        : "Only active applications in INTERVIEW or DECISION stage and without an existing final decision are shown."
                    }
                  />
                )}
              />
            </Stack>
          </Paper>
        ) : null}

        {resumeAnalysis && candidate && jobOpening ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Typography variant="body2">
                Candidate:
                {" "}
                <strong>{candidateName}</strong>
              </Typography>
              <Typography variant="body2">
                Resume AI score:
                {" "}
                <strong>
                  {resumeAnalysis.ai_fit_score
                    ? `${Number(resumeAnalysis.ai_fit_score).toFixed(1)} / 100`
                    : "—"}
                </strong>
              </Typography>
              <Typography variant="body2">
                Interview score:
                {" "}
                <strong>{feedback?.overall_score ?? "—"}</strong>
              </Typography>
              <Typography variant="body2">
                Role:
                {" "}
                <strong>{jobOpening.title}</strong>
              </Typography>
            </Stack>
          </Paper>
        ) : null}

        {(mode === "edit" || applicationIdFromRoute) && !readiness.canCreateOrUpdate ? (
          <Alert severity="warning">
            The decision form is visible, but save will stay disabled until required interview evidence exists.
          </Alert>
        ) : null}

        {isLoading ? (
          <Typography>Loading decision form...</Typography>
        ) : mode === "create" && !applicationIdFromRoute ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 4,
              textAlign: "center",
            }}
          >
            <Stack spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Choose an Application to Continue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620 }}>
                Once you pick an application, we’ll load the resume analysis, AI interview
                feedback, interviewer reviews, and transcript for the correct candidate.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => router.push(ROUTES.APPLICATIONS)}
                sx={{ mt: 1, fontWeight: 800 }}
              >
                View Applications
              </Button>
            </Stack>
          </Paper>
        ) : (
          <DecisionForm
            key={`decision-form-${mode}-${applicationIdFromRoute || "empty"}-${id ?? "new"}`}
            title={mode === "create" ? "Decision Form" : "Update Decision"}
            subtitle="Capture the final hiring outcome after reviewing AI and human interview evidence."
            applicationLabel={applicationLabel}
            defaultValues={defaultValues}
            isSubmitting={
              createDecisionMutation.isPending || updateDecisionMutation.isPending
            }
            disableSubmit={
              !applicationIdFromRoute ||
              !readiness.canCreateOrUpdate ||
              createDecisionMutation.isPending ||
              updateDecisionMutation.isPending
            }
            readiness={readiness}
            onCancel={() =>
              router.push(mode === "edit" && id ? `${ROUTES.DECISIONS}/${id}` : ROUTES.DECISIONS)
            }
            onSubmit={handleSubmit}
          />
        )}

        {(createDecisionMutation.isError || updateDecisionMutation.isError) ? (
          <Alert severity="error">
            {getApiErrorMessage(
              createDecisionMutation.error ?? updateDecisionMutation.error,
            )}
          </Alert>
        ) : null}
      </Stack>
    </Box>
  );
}
