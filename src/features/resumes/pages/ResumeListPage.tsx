"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Clear as ClearIcon,
  Description as ResumeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import { type GridPaginationModel, type GridSortModel } from "@mui/x-data-grid";

import { ROUTES } from "@/constants/routes";
import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { resolveAbsoluteUrl } from "@/utils/url";
import { envConfig } from "@/config/env.config";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import type { CandidateResponse } from "@/features/candidates/types/candidates.types";
import { applicationsService } from "@/features/applications/services/applications.service";
import type { ApplicationResponse } from "@/features/applications/types/applications.types";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import { ResumeTable } from "@/features/resumes/components/ResumeTable";
import { ResumeUploadDialog } from "@/features/resumes/components/ResumeUploadDialog";
import { resumeService } from "@/features/resumes/services/resume.service";
import {
  RESUME_ANALYSIS_STATUSES,
  RESUME_ANALYSIS_STATUS_LABELS,
  type ResumeAiAnalysisResponse,
  type ResumeAnalysisStatus,
  type ResumeListRow,
} from "@/features/resumes/types/resume.types";

function formatCandidateName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown candidate";
}

function unwrapRows<T>(data: unknown): T[] {
  if (!data) return [];

  const response = data as { data?: unknown };
  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  const cursorData = response.data as { data?: T[] } | undefined;
  return cursorData?.data ?? [];
}

function toNumber(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function sortRows(rows: ResumeListRow[], sortModel: GridSortModel) {
  const sortField = sortModel[0]?.field;
  const sortDirection = sortModel[0]?.sort === "asc" ? 1 : -1;

  if (!sortField) return rows;

  return rows.slice().sort((left, right) => {
    const leftValue = left[sortField as keyof ResumeListRow];
    const rightValue = right[sortField as keyof ResumeListRow];

    if (sortField === "ai_fit_score") {
      const a = typeof leftValue === "number" ? leftValue : -1;
      const b = typeof rightValue === "number" ? rightValue : -1;
      return (a - b) * sortDirection;
    }

    if (sortField === "upload_date") {
      const a = leftValue ? new Date(String(leftValue)).getTime() : 0;
      const b = rightValue ? new Date(String(rightValue)).getTime() : 0;
      return (a - b) * sortDirection;
    }

    return String(leftValue ?? "").localeCompare(String(rightValue ?? "")) * sortDirection;
  });
}

export function ResumeListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();

  const [candidateName, setCandidateName] = useState("");
  const [selectedJobOpening, setSelectedJobOpening] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<ResumeAnalysisStatus | "all">("all");
  const [fitScoreMin, setFitScoreMin] = useState("");
  const [fitScoreMax, setFitScoreMax] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "upload_date", sort: "desc" },
  ]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedUploadCandidateId, setSelectedUploadCandidateId] = useState<string | null>(null);

  const analysesQuery = useQuery({
    queryKey: ["resumes", "analyses", selectedStatus],
    queryFn: () =>
      resumeService.listAnalyses({
        page: 1,
        limit: 100,
        ...(selectedStatus !== "all" ? { analysis_status: selectedStatus } : {}),
        sort_by: "created_at",
        sort_order: "desc",
      }),
  });

  const analyses = useMemo(
    () => unwrapRows<ResumeAiAnalysisResponse>(analysesQuery.data),
    [analysesQuery.data],
  );

  const uniqueCandidateIds = useMemo(
    () => Array.from(new Set(analyses.map((analysis) => analysis.candidate_id))),
    [analyses],
  );
  const uniqueApplicationIds = useMemo(
    () =>
      Array.from(
        new Set(
          analyses
            .map((analysis) => analysis.application_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [analyses],
  );

  const candidateQueries = useQueries({
    queries: uniqueCandidateIds.map((candidateId) => ({
      queryKey: ["candidates", "detail", candidateId],
      queryFn: () => candidatesService.getById(candidateId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const candidateDocumentQueries = useQueries({
    queries: uniqueCandidateIds.map((candidateId) => ({
      queryKey: ["resumes", "candidate-documents", candidateId],
      queryFn: () => candidatesService.listDocuments(candidateId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const applicationQueries = useQueries({
    queries: uniqueApplicationIds.map((applicationId) => ({
      queryKey: ["applications", "detail", applicationId],
      queryFn: () => applicationsService.getById(applicationId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const uniqueJobOpeningIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicationQueries
            .map((query) => query.data?.data.job_opening_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [applicationQueries],
  );

  const jobOpeningQueries = useQueries({
    queries: uniqueJobOpeningIds.map((jobOpeningId) => ({
      queryKey: ["job-openings", "detail", jobOpeningId],
      queryFn: () => jobOpeningsService.getById(jobOpeningId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const uploadCandidatesQuery = useQuery({
    queryKey: ["resumes", "upload-candidates"],
    queryFn: () =>
      candidatesService.list({
        page: 1,
        limit: 100,
        sort_by: "first_name",
        sort_order: "ASC",
      }),
    staleTime: 5 * 60 * 1000,
  });

  const uploadApplicationsQuery = useQuery({
    queryKey: ["resumes", "upload-applications", selectedUploadCandidateId],
    queryFn: () =>
      applicationsService.list({
        page: 1,
        limit: 100,
        candidate_id: selectedUploadCandidateId ?? undefined,
        sort_by: "applied_at",
        sort_order: "desc",
      }),
    enabled: !!selectedUploadCandidateId,
    staleTime: 2 * 60 * 1000,
  });

  const candidatesById = useMemo(
    () =>
      new Map(
        candidateQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((candidate) => [candidate.id, candidate]),
      ),
    [candidateQueries],
  );

  const documentsByCandidateId = useMemo(
    () =>
      new Map(
        candidateDocumentQueries.map((query, index) => [
          uniqueCandidateIds[index],
          query.data?.data ?? [],
        ]),
      ),
    [candidateDocumentQueries, uniqueCandidateIds],
  );

  const applicationsById = useMemo(
    () =>
      new Map(
        applicationQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((application) => [application.id, application]),
      ),
    [applicationQueries],
  );

  const jobOpeningsById = useMemo(
    () =>
      new Map(
        jobOpeningQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((jobOpening) => [jobOpening.id, jobOpening]),
      ),
    [jobOpeningQueries],
  );

  const resumeRows = useMemo<ResumeListRow[]>(() => {
    const byDocument = new Map<string, ResumeAiAnalysisResponse>();

    for (const analysis of analyses) {
      const existing = byDocument.get(analysis.candidate_document_id);
      if (!existing) {
        byDocument.set(analysis.candidate_document_id, analysis);
        continue;
      }

      const existingTime = new Date(existing.created_at).getTime();
      const nextTime = new Date(analysis.created_at).getTime();

      if (nextTime > existingTime) {
        byDocument.set(analysis.candidate_document_id, analysis);
      }
    }

    const allRows = Array.from(byDocument.values()).map((analysis) => {
      const candidate = candidatesById.get(analysis.candidate_id);
      const documents = documentsByCandidateId.get(analysis.candidate_id) ?? [];
      const resumeDocument =
        documents.find((document) => document.id === analysis.candidate_document_id) ?? null;
      const application = analysis.application_id
        ? applicationsById.get(analysis.application_id)
        : undefined;
      const jobOpening = application
        ? jobOpeningsById.get(application.job_opening_id)
        : undefined;

      return {
        id: analysis.id,
        analysis_id: analysis.id,
        candidate_id: analysis.candidate_id,
        candidate_name: formatCandidateName(candidate?.first_name, candidate?.last_name),
        candidate_email: candidate?.email ?? null,
        application_id: analysis.application_id,
        job_applied: jobOpening?.title ?? "Unlinked application",
        candidate_document_id: analysis.candidate_document_id,
        resume_file_name: resumeDocument?.file_name ?? "Resume file",
        resume_file_url: resumeDocument?.file_url ?? null,
        mime_type: resumeDocument?.mime_type ?? null,
        upload_date: resumeDocument?.uploaded_at ?? resumeDocument?.created_at ?? analysis.created_at,
        analysis_status: analysis.analysis_status,
        ai_fit_score: toNumber(analysis.ai_fit_score),
      };
    });

    const normalizedCandidateName = candidateName.trim().toLowerCase();
    const minFitScore = fitScoreMin === "" ? null : Number(fitScoreMin);
    const maxFitScore = fitScoreMax === "" ? null : Number(fitScoreMax);

    return sortRows(
      allRows.filter((row) => {
        const matchesCandidate =
          !normalizedCandidateName ||
          row.candidate_name.toLowerCase().includes(normalizedCandidateName);
        const matchesJob =
          selectedJobOpening === "all" || row.job_applied === selectedJobOpening;
        const matchesMin =
          minFitScore === null ||
          (row.ai_fit_score !== null && row.ai_fit_score >= minFitScore);
        const matchesMax =
          maxFitScore === null ||
          (row.ai_fit_score !== null && row.ai_fit_score <= maxFitScore);

        return matchesCandidate && matchesJob && matchesMin && matchesMax;
      }),
      sortModel,
    );
  }, [
    analyses,
    applicationsById,
    candidateName,
    candidatesById,
    documentsByCandidateId,
    fitScoreMax,
    fitScoreMin,
    jobOpeningsById,
    selectedJobOpening,
    sortModel,
  ]);

  const uploadCandidates = useMemo(() => {
    return unwrapRows<CandidateResponse>(uploadCandidatesQuery.data)
      .map((candidate) => ({
        id: candidate.id,
        label: formatCandidateName(candidate.first_name, candidate.last_name),
        email: candidate.email,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [uploadCandidatesQuery.data]);

  const uploadApplications = useMemo(() => {
    const rows = unwrapRows<ApplicationResponse>(uploadApplicationsQuery.data);
    const uniqueJobIds = Array.from(new Set(rows.map((row) => row.job_opening_id)));

    return rows.map((application) => {
      const openingTitle =
        jobOpeningsById.get(application.job_opening_id)?.title ??
        `Job ${uniqueJobIds.indexOf(application.job_opening_id) + 1}`;

      return {
        id: application.id,
        label: `${application.application_number} • ${openingTitle}`,
      };
    });
  }, [jobOpeningsById, uploadApplicationsQuery.data]);

  const uploadMutation = useMutation({
    mutationFn: async (payload: {
      candidateId: string;
      applicationId?: string;
      file: File;
    }) => {
      const uploadedDocument = await resumeService.uploadResume(payload.candidateId, payload.file);
      const analysis = await resumeService.createAnalysis({
        candidate_document_id: uploadedDocument.data.id,
        application_id: payload.applicationId,
      });

      try {
        await resumeService.startAnalysis(analysis.data.id);
      } catch {
        // The record is still useful to surface in the UI even if the async
        // provider cannot start immediately.
      }

      return analysis;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      showSuccess("Resume uploaded successfully");
      setUploadOpen(false);
      router.push(`${ROUTES.RESUMES}/${result.data.id}`);
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: (row: ResumeListRow) =>
      resumeService.regenerateByDocumentId(row.candidate_document_id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      showSuccess("Resume re-analysis started");
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const errorMessage = analysesQuery.isError ? getApiErrorMessage(analysesQuery.error) : "";

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Resumes</Typography>
      </Breadcrumbs>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ResumeIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Resumes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                View uploaded resumes, download files, and inspect AI analysis summaries in one place.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            Upload Resume
          </Button>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            label="Candidate Name"
            value={candidateName}
            onChange={(event) => {
              setCandidateName(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              minWidth: { xs: "100%", md: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            select
            size="small"
            label="Job Opening"
            value={selectedJobOpening}
            onChange={(event) => {
              setSelectedJobOpening(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {Array.from(new Set(resumeRows.map((row) => row.job_applied)))
              .sort((left, right) => left.localeCompare(right))
              .map((jobTitle) => (
                <MenuItem key={jobTitle} value={jobTitle}>
                  {jobTitle}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Analysis Status"
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value as ResumeAnalysisStatus | "all");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 180,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {RESUME_ANALYSIS_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {RESUME_ANALYSIS_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Min Fit Score"
            type="number"
            value={fitScoreMin}
            onChange={(event) => {
              setFitScoreMin(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              width: 130,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            size="small"
            label="Max Fit Score"
            type="number"
            value={fitScoreMax}
            onChange={(event) => {
              setFitScoreMax(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              width: 130,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <Button
            variant="text"
            size="small"
            onClick={() => {
              setCandidateName("");
              setSelectedJobOpening("all");
              setSelectedStatus("all");
              setFitScoreMin("");
              setFitScoreMax("");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            startIcon={<ClearIcon fontSize="small" />}
            sx={{ height: 40, borderRadius: 2, fontWeight: 800 }}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          minHeight: 400,
        }}
      >
        <ResumeTable
          rows={resumeRows}
          loading={analysesQuery.isLoading}
          isError={analysesQuery.isError}
          errorMessage={errorMessage}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          onView={(row) => router.push(`${ROUTES.RESUMES}/${row.analysis_id}`)}
          onDownload={(row) => {
            const resolvedUrl = resolveAbsoluteUrl(row.resume_file_url, envConfig.apiBaseUrl);
            if (resolvedUrl) {
              window.open(resolvedUrl, "_blank", "noopener,noreferrer");
            }
          }}
          onReanalyze={(row) => reanalyzeMutation.mutate(row)}
          reanalyzingAnalysisId={reanalyzeMutation.isPending ? reanalyzeMutation.variables?.analysis_id : null}
        />
      </Paper>

      <ResumeUploadDialog
        key={uploadOpen ? "resume-upload-open" : "resume-upload-closed"}
        open={uploadOpen}
        loading={uploadMutation.isPending}
        candidates={uploadCandidates}
        applications={uploadApplications}
        onClose={() => setUploadOpen(false)}
        onCandidateChange={setSelectedUploadCandidateId}
        onUpload={async (payload) => {
          await uploadMutation.mutateAsync(payload);
        }}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
