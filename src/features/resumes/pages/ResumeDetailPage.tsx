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
  Refresh as ReanalyzeIcon,
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
import { ResumeAnalysisCard } from "@/features/resumes/components/ResumeAnalysisCard";
import { ResumeViewer } from "@/features/resumes/components/ResumeViewer";
import { SkillsExtractedCard } from "@/features/resumes/components/SkillsExtractedCard";
import { resumeService } from "@/features/resumes/services/resume.service";

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatCandidateName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown candidate";
}

function formatValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();

  const analysisQuery = useQuery({
    queryKey: ["resumes", "analysis", id],
    queryFn: () => resumeService.getAnalysisById(id),
  });

  const analysis = analysisQuery.data?.data;

  const candidateQuery = useQuery({
    queryKey: ["candidates", "detail", analysis?.candidate_id],
    queryFn: () => candidatesService.getById(analysis!.candidate_id),
    enabled: !!analysis?.candidate_id,
  });

  const documentsQuery = useQuery({
    queryKey: ["resumes", "candidate-documents", analysis?.candidate_id],
    queryFn: () => candidatesService.listDocuments(analysis!.candidate_id),
    enabled: !!analysis?.candidate_id,
  });

  const applicationQuery = useQuery({
    queryKey: ["applications", "detail", analysis?.application_id],
    queryFn: () => applicationsService.getById(analysis!.application_id!),
    enabled: !!analysis?.application_id,
  });

  const jobOpeningQuery = useQuery({
    queryKey: ["job-openings", "detail", applicationQuery.data?.data.job_opening_id],
    queryFn: () => jobOpeningsService.getById(applicationQuery.data!.data.job_opening_id),
    enabled: !!applicationQuery.data?.data.job_opening_id,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => resumeService.regenerateByDocumentId(analysis!.candidate_document_id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resumes", "analysis", id] });
      showSuccess("Resume re-analysis started");
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const candidate = candidateQuery.data?.data;
  const documents = documentsQuery.data?.data ?? [];
  const resumeDocument =
    documents.find((document) => document.id === analysis?.candidate_document_id) ??
    documents.find((document) => document.document_type === "RESUME" && document.is_latest) ??
    null;
  const application = applicationQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;
  const fullName = formatCandidateName(candidate?.first_name, candidate?.last_name);

  if (analysisQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load resume details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(analysisQuery.error)}
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
          {analysisQuery.isLoading ? <Skeleton width={220} /> : fullName}
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Button
            variant="outlined"
            startIcon={<ReanalyzeIcon />}
            onClick={() => reanalyzeMutation.mutate()}
            disabled={!analysis || reanalyzeMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            {reanalyzeMutation.isPending ? "Re-analyzing..." : "Re-analyze"}
          </Button>
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
                        : "—"
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

        {analysis ? <ResumeAnalysisCard analysis={analysis} /> : null}

        {analysis ? <SkillsExtractedCard skills={analysis.skills_extracted} /> : null}

        <SummaryCard
          title="Experience Summary"
          description="AI-generated summary of the candidate's work experience."
          content={analysis?.experience_summary}
        />

        <SummaryCard
          title="Education Summary"
          description="AI-generated summary of the candidate's education background."
          content={analysis?.education_summary}
        />

        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={0.3}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Raw Resume Metadata
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Useful file and extraction metadata returned by the backend.
              </Typography>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem
                  title="Extracted Text Length"
                  value={
                    analysis?.extracted_text ? `${analysis.extracted_text.length.toLocaleString()} chars` : "—"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem
                  title="Document Type"
                  value={resumeDocument?.mime_type ?? formatValue(resumeDocument?.file_name?.split(".").pop()?.toUpperCase())}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoItem
                  title="Upload Timestamp"
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

function SummaryCard({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string | null | undefined;
}) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.3}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="body2" color={content ? "text.primary" : "text.secondary"}>
          {content || "No AI summary available yet."}
        </Typography>
      </CardContent>
    </Card>
  );
}
