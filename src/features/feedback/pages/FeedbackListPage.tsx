"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useQueries } from "@tanstack/react-query";
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
import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import {
  Clear as ClearIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  SmartToyOutlined as FeedbackIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { applicationsService } from "@/features/applications/services/applications.service";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import { feedbackService } from "@/features/feedback/services/feedback.service";
import { useFeedbackList } from "@/features/feedback/hooks/use-feedback";
import { FeedbackTable } from "@/features/feedback/components/FeedbackTable";
import {
  AI_INTERVIEW_FEEDBACK_STATUSES,
  AI_INTERVIEW_FEEDBACK_STATUS_LABELS,
  AI_INTERVIEW_RECOMMENDATIONS,
  FEEDBACK_SORT_FIELDS,
  RECOMMENDATION_LABELS,
  type AiInterviewFeedbackStatus,
  type AiInterviewRecommendation,
  type FeedbackEnrichedRow,
  type FeedbackResponse,
  type FeedbackSortBy,
} from "@/features/feedback/types/feedback.types";

function unwrapListRows<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  if (Array.isArray(obj.data)) return obj.data as T[];

  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

function formatCandidateName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown candidate";
}

function normalizeDateForApi(value: string, endOfDay = false) {
  if (!value) return undefined;

  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`).toISOString();
}

export function FeedbackListPage() {
  const [candidateSearchInput, setCandidateSearchInput] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [recommendation, setRecommendation] = useState<AiInterviewRecommendation | "all">("all");
  const [status, setStatus] = useState<AiInterviewFeedbackStatus | "all">("all");
  const [generatedFrom, setGeneratedFrom] = useState("");
  const [generatedTo, setGeneratedTo] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "generated_at", sort: "desc" },
  ]);

  const sortBy = sortModel[0]?.field as FeedbackSortBy | undefined;
  const sortOrder = sortModel[0]?.sort as "asc" | "desc" | undefined;

  const queryParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(recommendation !== "all" ? { recommendation } : {}),
      ...(status !== "all" ? { feedback_status: status } : {}),
      ...(generatedFrom ? { generated_from: normalizeDateForApi(generatedFrom) } : {}),
      ...(generatedTo ? { generated_to: normalizeDateForApi(generatedTo, true) } : {}),
      ...(sortBy && (FEEDBACK_SORT_FIELDS as readonly string[]).includes(sortBy)
        ? { sort_by: sortBy, sort_order: sortOrder ?? "desc" }
        : {}),
    }),
    [paginationModel, recommendation, status, generatedFrom, generatedTo, sortBy, sortOrder],
  );

  const feedbackQuery = useFeedbackList(queryParams);
  const feedbackRows = useMemo(
    () => unwrapListRows<FeedbackResponse>(feedbackQuery.data),
    [feedbackQuery.data],
  );

  const sessionIds = useMemo(
    () => Array.from(new Set(feedbackRows.map((row) => row.ai_interview_session_id))).filter(Boolean),
    [feedbackRows],
  );
  const applicationIds = useMemo(
    () => Array.from(new Set(feedbackRows.map((row) => row.application_id))).filter(Boolean),
    [feedbackRows],
  );
  const candidateIds = useMemo(
    () => Array.from(new Set(feedbackRows.map((row) => row.candidate_id))).filter(Boolean),
    [feedbackRows],
  );

  const sessionQueries = useQueries({
    queries: sessionIds.map((id) => ({
      queryKey: ["feedback", "session", id],
      queryFn: () => feedbackService.getSessionById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const applicationQueries = useQueries({
    queries: applicationIds.map((id) => ({
      queryKey: ["applications", "detail", id],
      queryFn: () => applicationsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const candidateQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ["candidates", "detail", id],
      queryFn: () => candidatesService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const jobOpeningIds = useMemo(
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
    queries: jobOpeningIds.map((id) => ({
      queryKey: ["job-openings", "detail", id],
      queryFn: () => jobOpeningsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const sessionsById = useMemo(
    () =>
      new Map(
        sessionQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((session) => [session.id, session]),
      ),
    [sessionQueries],
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

  const jobOpeningsById = useMemo(
    () =>
      new Map(
        jobOpeningQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((opening) => [opening.id, opening]),
      ),
    [jobOpeningQueries],
  );

  const enrichedRows = useMemo<FeedbackEnrichedRow[]>(() => {
    const normalizedSearch = candidateSearch.trim().toLowerCase();

    return feedbackRows
      .map((row) => {
        const candidate = candidatesById.get(row.candidate_id);
        const application = applicationsById.get(row.application_id);
        const session = sessionsById.get(row.ai_interview_session_id);
        const jobOpening = application
          ? jobOpeningsById.get(application.job_opening_id)
          : undefined;

        return {
          ...row,
          candidate_name: formatCandidateName(candidate?.first_name, candidate?.last_name),
          candidate_email: candidate?.email ?? null,
          job_title: jobOpening?.title ?? "Unknown job",
          session_code: session?.session_code ?? "—",
        };
      })
      .filter((row) =>
        normalizedSearch ? row.candidate_name.toLowerCase().includes(normalizedSearch) : true,
      );
  }, [applicationsById, candidateSearch, candidatesById, feedbackRows, jobOpeningsById, sessionsById]);

  const rowCount = useMemo(() => {
    if (candidateSearch) {
      return enrichedRows.length;
    }

    if (!feedbackQuery.data) return 0;

    const offset = feedbackQuery.data as { pagination?: { total_records?: number } };
    return offset.pagination?.total_records ?? enrichedRows.length;
  }, [candidateSearch, enrichedRows.length, feedbackQuery.data]);

  const errorMessage = feedbackQuery.isError ? getApiErrorMessage(feedbackQuery.error) : "";

  const handleApplyFilters = () => {
    setCandidateSearch(candidateSearchInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setCandidateSearchInput("");
    setCandidateSearch("");
    setRecommendation("all");
    setStatus("all");
    setGeneratedFrom("");
    setGeneratedTo("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Feedback</Typography>
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
              <FeedbackIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Feedback
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Review AI interview evaluations and drill into transcripts, questions, and reviewer input.
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            label="Candidate search"
            value={candidateSearchInput}
            onChange={(event) => setCandidateSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleApplyFilters();
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
              minWidth: { xs: "100%", md: 240 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            select
            size="small"
            label="Recommendation"
            value={recommendation}
            onChange={(event) => {
              setRecommendation(event.target.value as AiInterviewRecommendation | "all");
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
            {AI_INTERVIEW_RECOMMENDATIONS.map((value) => (
              <MenuItem key={value} value={value}>
                {RECOMMENDATION_LABELS[value]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Feedback status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AiInterviewFeedbackStatus | "all");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 170,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {AI_INTERVIEW_FEEDBACK_STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {AI_INTERVIEW_FEEDBACK_STATUS_LABELS[value]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Generated from"
            type="date"
            value={generatedFrom}
            onChange={(event) => {
              setGeneratedFrom(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              minWidth: 165,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            size="small"
            label="Generated to"
            type="date"
            value={generatedTo}
            onChange={(event) => {
              setGeneratedTo(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              minWidth: 165,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            sx={{ height: 40, px: 2.5, borderRadius: 2, fontWeight: 800 }}
          >
            Apply
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={handleClearFilters}
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
        <FeedbackTable
          rows={enrichedRows}
          loading={feedbackQuery.isLoading}
          rowCount={rowCount}
          isError={feedbackQuery.isError}
          errorMessage={errorMessage}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
        />
      </Paper>
    </Box>
  );
}
