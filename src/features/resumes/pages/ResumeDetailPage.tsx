"use client";

import { use } from "react";
import NextLink from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { resolveAbsoluteUrl } from "@/utils/url";
import { envConfig } from "@/config/env.config";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import { applicationsService } from "@/features/applications/services/applications.service";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import { ResumeAnalysisPanel } from "@/features/resumes/components/ResumeAnalysisPanel";
import { ResumeViewer } from "@/features/resumes/components/ResumeViewer";
import { resumeAnalysisService } from "@/features/resumes/services/resumeAnalysis.service";
import {
  CANDIDATE_DOCUMENT_TYPE_LABELS,
  type CandidateDocumentResponse,
} from "@/features/candidates/types/candidates.types";
import {
  type ResumeAnalysisStatus,
  type ResumeRowStatus,
  isResumeAnalysisInFlight,
} from "@/features/resumes/types/resumeAnalysis.types";

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ candidateId?: string; applicationId?: string }>;
}

function handleAnalysisMutationFeedback(options: {
  message: string;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  failureReason?: string | null;
  status?: ResumeAnalysisStatus | null;
}) {
  const status = options.status ?? null;
  const failureReason = options.failureReason ?? "";

  if (status === "FAILED") {
    options.showError(failureReason || "Resume analysis failed");
    return;
  }

  if (status === "PENDING" || status === "PROCESSING") {
    options.showSuccess(options.message);
    return;
  }

  if (status === "COMPLETED") {
    options.showSuccess("Resume analysis completed");
    return;
  }

  options.showError("Resume analysis could not be started");
}

function formatCandidateName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown candidate";
}

function formatValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function isSupportedResumeDocument(document: CandidateDocumentResponse | null) {
  if (!document) return false;

  const name = document.file_name.toLowerCase();
  const mimeType = String(document.mime_type ?? "").toLowerCase();

  return (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    mimeType.includes("pdf") ||
    mimeType.includes("msword") ||
    mimeType.includes("wordprocessingml")
  );
}

export function ResumeDetailPage({ params, searchParams }: ResumeDetailPageProps) {
  const { id } = use(params);
  const resolvedSearchParams = use(searchParams);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();

  const analysisQuery = useQuery({
    queryKey: ["resumes", "analysis-by-document", id],
    queryFn: () => resumeAnalysisService.getAnalysisByDocumentIdOrNull(id),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.data.analysis_status;
      return isResumeAnalysisInFlight(status) ? 3000 : false;
    },
  });

  const analysis = analysisQuery.data?.data ?? null;
  const candidateId = analysis?.candidate_id ?? resolvedSearchParams.candidateId ?? null;
  const applicationId = analysis?.application_id ?? resolvedSearchParams.applicationId ?? null;

  const candidateQuery = useQuery({
    queryKey: ["candidates", "detail", candidateId],
    queryFn: () => candidatesService.getById(candidateId!),
    enabled: !!candidateId,
  });

  const documentsQuery = useQuery({
    queryKey: ["resumes", "candidate-documents", candidateId],
    queryFn: () => candidatesService.listDocuments(candidateId!),
    enabled: !!candidateId,
  });

  const applicationQuery = useQuery({
    queryKey: ["applications", "detail", applicationId],
    queryFn: () => applicationsService.getById(applicationId!),
    enabled: !!applicationId,
  });

  const jobOpeningQuery = useQuery({
    queryKey: ["job-openings", "detail", applicationQuery.data?.data.job_opening_id],
    queryFn: () => jobOpeningsService.getById(applicationQuery.data!.data.job_opening_id),
    enabled: !!applicationQuery.data?.data.job_opening_id,
  });

  const createAndStartMutation = useMutation({
    mutationFn: () =>
      resumeAnalysisService.createAndStartAnalysis({
        candidate_document_id: id,
        application_id: applicationId ?? undefined,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes", "analysis-by-document", id] });
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      handleAnalysisMutationFeedback({
        message: "Resume analysis started",
        showSuccess,
        showError,
        status: response.data.analysis_status,
        failureReason: response.data.failure_reason,
      });
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => {
      if (!analysis?.id) {
        throw new Error("Analysis record is missing.");
      }

      return resumeAnalysisService.reanalyzeById(analysis.id);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes", "analysis-by-document", id] });
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      handleAnalysisMutationFeedback({
        message: "Resume re-analysis started",
        showSuccess,
        showError,
        status: response.data.analysis_status,
        failureReason: response.data.failure_reason,
      });
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const candidate = candidateQuery.data?.data;
  const documents = documentsQuery.data?.data ?? [];
  const resumeDocument =
    documents.find((document) => document.id === id) ??
    null;
  const application = applicationQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;
  const fullName = formatCandidateName(candidate?.first_name, candidate?.last_name);
  const isResumeMissing = Boolean(candidateId && !documentsQuery.isLoading && !resumeDocument);
  const isUnsupportedType = resumeDocument ? !isSupportedResumeDocument(resumeDocument) : false;
  const analysisStatus: ResumeRowStatus = analysis?.analysis_status ?? "NOT_STARTED";
  const backendError =
    analysisQuery.isError ? getApiErrorMessage(analysisQuery.error) : "";

  if (analysisQuery.isError && !candidateId) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load resume details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {backendError}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.RESUMES)}>
          Back to Resumes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.RESUMES} underline="hover" color="inherit">
          Resumes
        </Link>
        <Typography color="text.primary">
          {candidateQuery.isLoading && !candidate ? <Skeleton width={220} /> : fullName}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => router.push(ROUTES.RESUMES)}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Resume Details
          </Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          component="a"
          href={resolveAbsoluteUrl(resumeDocument?.file_url, envConfig.apiBaseUrl) ?? undefined}
          target="_blank"
          rel="noreferrer"
          disabled={!resumeDocument?.file_url}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          Download Resume
        </Button>
      </Stack>

      <Stack spacing={2.5}>
        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={0.3}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Candidate Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recruiter-facing candidate details tied to this resume record.
              </Typography>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem title="Candidate Name" value={candidateQuery.isLoading ? "Loading..." : fullName} />
                <InfoItem title="Email" value={formatValue(candidate?.email)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem title="Phone" value={formatValue(candidate?.phone)} />
                <InfoItem
                  title="Experience"
                  value={
                    analysis?.total_experience_years_detected
                      ? `${analysis.total_experience_years_detected} years`
                      : candidate?.total_experience_years
                        ? `${candidate.total_experience_years} years`
                        : "-"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem title="Current Company" value={formatValue(candidate?.current_company)} />
                <InfoItem
                  title="Job Applied"
                  value={jobOpening?.title ?? application?.application_number ?? "Unlinked application"}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <ResumeViewer
          fileUrl={resumeDocument?.file_url}
          fileName={resumeDocument?.file_name}
          mimeType={resumeDocument?.mime_type}
        />

        <ResumeAnalysisPanel
          analysis={analysis}
          status={analysisStatus}
          isFetching={analysisQuery.isLoading}
          isCreating={createAndStartMutation.isPending && !analysis}
          isRunning={isResumeAnalysisInFlight(analysis?.analysis_status as ResumeAnalysisStatus | undefined)}
          isReanalyzing={reanalyzeMutation.isPending}
          isResumeMissing={isResumeMissing}
          isUnsupportedType={isUnsupportedType}
          backendError={backendError}
          onAnalyze={() => createAndStartMutation.mutate()}
          onReanalyze={() => reanalyzeMutation.mutate()}
          onRetry={() => reanalyzeMutation.mutate()}
        />

        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={0.3}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Resume Metadata
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload details and file metadata for the current resume document.
              </Typography>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoItem title="Document Name" value={formatValue(resumeDocument?.file_name)} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoItem
                  title="Document Type"
                  value={
                    resumeDocument
                      ? CANDIDATE_DOCUMENT_TYPE_LABELS[resumeDocument.document_type]
                      : "-"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoItem title="Mime Type" value={formatValue(resumeDocument?.mime_type)} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoItem
                  title="Uploaded At"
                  value={formatDateTime(resumeDocument?.uploaded_at ?? resumeDocument?.created_at)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}

function InfoItem({ title, value }: { title: string; value: string }) {
  return (
    <Stack spacing={0.35} sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
    </Stack>
  );
}
