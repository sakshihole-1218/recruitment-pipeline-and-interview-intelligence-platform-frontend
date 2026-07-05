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
import type {
  CandidateDocumentResponse,
  CandidateResponse,
} from "@/features/candidates/types/candidates.types";
import { applicationsService } from "@/features/applications/services/applications.service";
import type { ApplicationResponse } from "@/features/applications/types/applications.types";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import { ResumeTable } from "@/features/resumes/components/ResumeTable";
import { ResumeUploadDialog } from "@/features/resumes/components/ResumeUploadDialog";
import { resumeAnalysisService } from "@/features/resumes/services/resumeAnalysis.service";
import { resumeService } from "@/features/resumes/services/resume.service";
import {
  RESUME_ROW_STATUSES,
  RESUME_ROW_STATUS_LABELS,
  type ResumeAiAnalysisResponse,
  type ResumeListRow,
  type ResumeRowStatus,
  toResumeFitScore,
  unwrapResumeRows,
} from "@/features/resumes/types/resumeAnalysis.types";

function formatCandidateName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown candidate";
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
  const [selectedStatus, setSelectedStatus] = useState<ResumeRowStatus | "all">("all");
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

  const candidatesQuery = useQuery({
    queryKey: ["resumes", "candidates"],
    queryFn: () =>
      candidatesService.list({
        page: 1,
        limit: 100,
        sort_by: "first_name",
        sort_order: "ASC",
      }),
    staleTime: 5 * 60 * 1000,
  });

  const analysesQuery = useQuery({
    queryKey: ["resumes", "analyses"],
    queryFn: () =>
      resumeAnalysisService.listAnalyses({
        page: 1,
        limit: 500,
        sort_by: "created_at",
        sort_order: "desc",
      }),
  });

  const candidates = useMemo(
    () => unwrapResumeRows<CandidateResponse>(candidatesQuery.data),
    [candidatesQuery.data],
  );
  const analyses = useMemo(
    () => unwrapResumeRows<ResumeAiAnalysisResponse>(analysesQuery.data),
    [analysesQuery.data],
  );

  const candidateDocumentsQueries = useQueries({
    queries: candidates.map((candidate) => ({
      queryKey: ["resumes", "candidate-documents", candidate.id],
      queryFn: () => candidatesService.listDocuments(candidate.id),
      staleTime: 5 * 60 * 1000,
      enabled: candidates.length > 0,
    })),
  });

  const latestAnalysisByDocumentId = useMemo(() => {
    const map = new Map<string, ResumeAiAnalysisResponse>();

    for (const analysis of analyses) {
      const existing = map.get(analysis.candidate_document_id);
      if (!existing) {
        map.set(analysis.candidate_document_id, analysis);
        continue;
      }

      const existingTime = new Date(existing.updated_at ?? existing.created_at).getTime();
      const nextTime = new Date(analysis.updated_at ?? analysis.created_at).getTime();

      if (nextTime > existingTime) {
        map.set(analysis.candidate_document_id, analysis);
      }
    }

    return map;
  }, [analyses]);

  const applicationIds = useMemo(
    () =>
      Array.from(
        new Set(
          analyses
            .map((analysis) => analysis.application_id)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [analyses],
  );

  const applicationQueries = useQueries({
    queries: applicationIds.map((applicationId) => ({
      queryKey: ["applications", "detail", applicationId],
      queryFn: () => applicationsService.getById(applicationId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const jobOpeningIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicationQueries
            .map((query) => query.data?.data.job_opening_id)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [applicationQueries],
  );

  const jobOpeningQueries = useQueries({
    queries: jobOpeningIds.map((jobOpeningId) => ({
      queryKey: ["job-openings", "detail", jobOpeningId],
      queryFn: () => jobOpeningsService.getById(jobOpeningId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const applicationsById = useMemo(
    () =>
      new Map(
        applicationQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => Boolean(value))
          .map((application) => [application.id, application]),
      ),
    [applicationQueries],
  );

  const jobOpeningsById = useMemo(
    () =>
      new Map(
        jobOpeningQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => Boolean(value))
          .map((jobOpening) => [jobOpening.id, jobOpening]),
      ),
    [jobOpeningQueries],
  );

  const documentsByCandidateId = useMemo(
    () =>
      new Map(
        candidateDocumentsQueries.map((query, index) => [
          candidates[index]?.id,
          (query.data?.data ?? []).filter(
            (document): document is CandidateDocumentResponse =>
              document.document_type === "RESUME",
          ),
        ]),
      ),
    [candidateDocumentsQueries, candidates],
  );

  const resumeRows = useMemo<ResumeListRow[]>(() => {
    const allRows = candidates.flatMap((candidate) => {
      const documents = documentsByCandidateId.get(candidate.id) ?? [];

      return documents.map((document) => {
        const analysis = latestAnalysisByDocumentId.get(document.id) ?? null;
        const application = analysis?.application_id
          ? applicationsById.get(analysis.application_id)
          : undefined;
        const jobOpening = application
          ? jobOpeningsById.get(application.job_opening_id)
          : undefined;

        return {
          id: document.id,
          analysis_id: analysis?.id ?? null,
          candidate_id: candidate.id,
          candidate_name: formatCandidateName(candidate.first_name, candidate.last_name),
          candidate_email: candidate.email ?? null,
          application_id: analysis?.application_id ?? null,
          job_applied: jobOpening?.title ?? "Unlinked application",
          candidate_document_id: document.id,
          resume_file_name: document.file_name,
          resume_file_url: document.file_url ?? null,
          mime_type: document.mime_type ?? null,
          upload_date: document.uploaded_at ?? document.created_at,
          analysis_status: analysis?.analysis_status ?? "NOT_STARTED",
          ai_fit_score: toResumeFitScore(analysis?.ai_fit_score),
        } satisfies ResumeListRow;
      });
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
        const matchesStatus =
          selectedStatus === "all" || row.analysis_status === selectedStatus;
        const matchesMin =
          minFitScore === null ||
          (row.ai_fit_score !== null && row.ai_fit_score >= minFitScore);
        const matchesMax =
          maxFitScore === null ||
          (row.ai_fit_score !== null && row.ai_fit_score <= maxFitScore);

        return matchesCandidate && matchesJob && matchesStatus && matchesMin && matchesMax;
      }),
      sortModel,
    );
  }, [
    applicationsById,
    candidateName,
    candidates,
    documentsByCandidateId,
    fitScoreMax,
    fitScoreMin,
    jobOpeningsById,
    latestAnalysisByDocumentId,
    selectedJobOpening,
    selectedStatus,
    sortModel,
  ]);

  const uploadCandidates = useMemo(() => {
    return candidates
      .map((candidate) => ({
        id: candidate.id,
        label: formatCandidateName(candidate.first_name, candidate.last_name),
        email: candidate.email,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [candidates]);

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

  const uploadApplications = useMemo(() => {
    const rows = unwrapResumeRows<ApplicationResponse>(uploadApplicationsQuery.data);
    const uniqueJobIds = Array.from(new Set(rows.map((row) => row.job_opening_id)));

    return rows.map((application) => {
      const openingTitle =
        jobOpeningsById.get(application.job_opening_id)?.title ??
        `Job ${uniqueJobIds.indexOf(application.job_opening_id) + 1}`;

      return {
        id: application.id,
        label: `${application.application_number} - ${openingTitle}`,
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
      return { uploadedDocument, payload };
    },
    onSuccess: async ({ uploadedDocument, payload }) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      showSuccess("Resume uploaded successfully");
      setUploadOpen(false);

      const search = new URLSearchParams({ candidateId: payload.candidateId });
      if (payload.applicationId) {
        search.set("applicationId", payload.applicationId);
      }

      router.push(`${ROUTES.RESUMES}/${uploadedDocument.data.id}?${search.toString()}`);
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: (row: ResumeListRow) => {
      if (!row.analysis_id) {
        throw new Error("No analysis record exists for this resume yet.");
      }

      return resumeAnalysisService.reanalyzeById(row.analysis_id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      showSuccess("Resume re-analysis started");
    },
    onError: (error) => {
      showError(getApiErrorMessage(error));
    },
  });

  const loading =
    candidatesQuery.isLoading ||
    analysesQuery.isLoading ||
    candidateDocumentsQueries.some((query) => query.isLoading) ||
    applicationQueries.some((query) => query.isLoading) ||
    jobOpeningQueries.some((query) => query.isLoading);

  const errorMessage = candidatesQuery.isError
    ? getApiErrorMessage(candidatesQuery.error)
    : analysesQuery.isError
      ? getApiErrorMessage(analysesQuery.error)
      : "";

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
                View uploaded resumes, start AI analysis, and inspect recruiter-ready summaries in one place.
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
              setSelectedStatus(event.target.value as ResumeRowStatus | "all");
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
            {RESUME_ROW_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {RESUME_ROW_STATUS_LABELS[status]}
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
          loading={loading}
          isError={candidatesQuery.isError || analysesQuery.isError}
          errorMessage={errorMessage}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          onView={(row) => {
            const search = new URLSearchParams({ candidateId: row.candidate_id });
            if (row.application_id) {
              search.set("applicationId", row.application_id);
            }

            router.push(`${ROUTES.RESUMES}/${row.candidate_document_id}?${search.toString()}`);
          }}
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
