"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  alpha,
  Alert,
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
  Add as AddIcon,
  Clear as ClearIcon,
  GavelOutlined as DecisionIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { usersService } from "@/features/users/services/users.service";
import { applicationsService } from "@/features/applications/services/applications.service";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import { useDeleteDecision, useDecisions } from "@/features/decisions/hooks/use-decisions";
import { useDecisionsPermissions } from "@/features/decisions/hooks/use-decisions-permissions";
import { DecisionTable, type DecisionTableRow } from "@/features/decisions/components/DecisionTable";
import {
  DECISION_SORT_FIELDS,
  DECISION_STATUS_LABELS,
  DECISION_STATUSES,
  type DecisionResponse,
  type DecisionSortBy,
  type DecisionStatus,
} from "@/features/decisions/types/decision.types";
import {
  AI_INTERVIEW_RECOMMENDATIONS,
  INTERVIEWER_RECOMMENDATIONS,
  RECOMMENDATION_LABELS,
  type AiInterviewRecommendation,
  type InterviewerRecommendation,
} from "@/features/feedback/types/feedback.types";

function unwrapListRows<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  if (Array.isArray(obj.data)) return obj.data as T[];

  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

function normalizeDateForApi(value: string, endOfDay = false) {
  if (!value) return undefined;

  return new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
  ).toISOString();
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function readSnapshotRecommendation(
  snapshot: Record<string, unknown> | null | undefined,
) {
  if (!snapshot) return null;

  const direct = snapshot.recommendation ?? snapshot.final_recommendation;
  return typeof direct === "string" ? direct : null;
}

export function DecisionListPage() {
  const router = useRouter();
  const { canCreateDecision, canDeleteDecision, canEditDecision } =
    useDecisionsPermissions();
  const deleteDecisionMutation = useDeleteDecision();

  const [candidateSearchInput, setCandidateSearchInput] = useState("");
  const [jobOpeningSearchInput, setJobOpeningSearchInput] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [jobOpeningSearch, setJobOpeningSearch] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus | "all">(
    "all",
  );
  const [recommendation, setRecommendation] = useState<
    InterviewerRecommendation | AiInterviewRecommendation | "all"
  >("all");
  const [decisionFrom, setDecisionFrom] = useState("");
  const [decisionTo, setDecisionTo] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "decision_at", sort: "desc" },
  ]);

  const sortBy = sortModel[0]?.field as DecisionSortBy | undefined;
  const sortOrder = sortModel[0]?.sort as "asc" | "desc" | undefined;

  const decisionsQuery = useDecisions({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...(decisionStatus !== "all" ? { decision_status: decisionStatus } : {}),
    ...(decisionFrom ? { decision_from: normalizeDateForApi(decisionFrom) } : {}),
    ...(decisionTo ? { decision_to: normalizeDateForApi(decisionTo, true) } : {}),
    ...(sortBy && (DECISION_SORT_FIELDS as readonly string[]).includes(sortBy)
      ? { sort_by: sortBy, sort_order: sortOrder ?? "desc" }
      : {}),
  });

  const decisionRows = useMemo(
    () => unwrapListRows<DecisionResponse>(decisionsQuery.data),
    [decisionsQuery.data],
  );

  const applicationIds = useMemo(
    () => Array.from(new Set(decisionRows.map((row) => row.application_id))),
    [decisionRows],
  );

  const applicationQueries = useQueries({
    queries: applicationIds.map((id) => ({
      queryKey: ["applications", "detail", id],
      queryFn: () => applicationsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const decidedByIds = useMemo(
    () =>
      Array.from(
        new Set(decisionRows.map((row) => row.decided_by_user_id).filter(Boolean)),
      ),
    [decisionRows],
  );

  const deciderQueries = useQueries({
    queries: decidedByIds.map((id) => ({
      queryKey: ["users", "detail", id],
      queryFn: () => usersService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

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

  const candidateIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicationQueries
            .map((query) => query.data?.data.job_opening_id && query.data?.data.candidate_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [applicationQueries],
  );

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

  const candidateQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ["candidates", "detail", id],
      queryFn: () => candidatesService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const jobOpeningQueries = useQueries({
    queries: jobOpeningIds.map((id) => ({
      queryKey: ["job-openings", "detail", id],
      queryFn: () => jobOpeningsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
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

  const decidersById = useMemo(
    () =>
      new Map(
        deciderQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((user) => [user.id, user]),
      ),
    [deciderQueries],
  );

  const clientCandidateSearch = candidateSearch.trim().toLowerCase();
  const clientJobOpeningSearch = jobOpeningSearch.trim().toLowerCase();

  const enrichedRows = useMemo<DecisionTableRow[]>(() => {
    return decisionRows
      .map((row) => {
        const application = applicationsById.get(row.application_id);
        const candidate = application
          ? candidatesById.get(application.candidate_id)
          : undefined;
        const jobOpening = application
          ? jobOpeningsById.get(application.job_opening_id)
          : undefined;
        const decider = decidersById.get(row.decided_by_user_id);

        const aiRecommendation =
          readSnapshotRecommendation(row.ai_recommendation_snapshot) ?? "—";
        const interviewerRecommendation =
          readSnapshotRecommendation(row.interviewer_recommendation_snapshot) ?? "—";

        return {
          ...row,
          candidate_name: formatName(candidate?.first_name, candidate?.last_name),
          job_opening_title: jobOpening?.title ?? "Unknown job opening",
          application_stage: application?.current_stage ?? "—",
          overall_ai_score: row.final_score
            ? `${Number(row.final_score).toFixed(1)} / 100`
            : "—",
          human_recommendation:
            interviewerRecommendation !== "—"
              ? RECOMMENDATION_LABELS[
                  interviewerRecommendation as InterviewerRecommendation
                ] ?? interviewerRecommendation
              : RECOMMENDATION_LABELS[
                    aiRecommendation as AiInterviewRecommendation
                  ] ?? "—",
          decision_by_name: decider
            ? formatName(decider.first_name, decider.last_name)
            : "—",
        };
      })
      .filter((row) => {
        if (
          clientCandidateSearch &&
          !row.candidate_name.toLowerCase().includes(clientCandidateSearch)
        ) {
          return false;
        }

        if (
          clientJobOpeningSearch &&
          !row.job_opening_title.toLowerCase().includes(clientJobOpeningSearch)
        ) {
          return false;
        }

        if (recommendation !== "all") {
          const normalized = row.human_recommendation.toUpperCase().replaceAll(" ", "_");
          if (normalized !== recommendation) return false;
        }

        return true;
      });
  }, [
    applicationsById,
    candidatesById,
    clientCandidateSearch,
    clientJobOpeningSearch,
    decidersById,
    decisionRows,
    jobOpeningsById,
    recommendation,
  ]);

  const rowCount = useMemo(() => {
    if (candidateSearch || jobOpeningSearch || recommendation !== "all") {
      return enrichedRows.length;
    }

    if (!decisionsQuery.data) return 0;

    const offset = decisionsQuery.data as { pagination?: { total_records?: number } };
    return offset.pagination?.total_records ?? enrichedRows.length;
  }, [candidateSearch, decisionsQuery.data, enrichedRows.length, jobOpeningSearch, recommendation]);

  const errorMessage = decisionsQuery.isError
    ? getApiErrorMessage(decisionsQuery.error)
    : "";

  const handleApplyFilters = () => {
    setCandidateSearch(candidateSearchInput.trim());
    setJobOpeningSearch(jobOpeningSearchInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setCandidateSearchInput("");
    setJobOpeningSearchInput("");
    setCandidateSearch("");
    setJobOpeningSearch("");
    setDecisionStatus("all");
    setRecommendation("all");
    setDecisionFrom("");
    setDecisionTo("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleDelete = async (row: DecisionTableRow) => {
    const confirmed = window.confirm(
      `Delete the decision for ${row.candidate_name}?`,
    );

    if (!confirmed) return;

    try {
      await deleteDecisionMutation.mutateAsync(row.id);
    } catch {
      // mutation error is surfaced below
    }
  };

  const recommendationOptions = Array.from(
    new Set([...AI_INTERVIEW_RECOMMENDATIONS, ...INTERVIEWER_RECOMMENDATIONS]),
  );

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Decisions</Typography>
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
              <DecisionIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Decisions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Central decision-making workspace for final hiring outcomes.
              </Typography>
            </Box>
          </Stack>

          {canCreateDecision ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.DECISIONS}/create`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
            >
              Create Decision
            </Button>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            label="Candidate"
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
              minWidth: { xs: "100%", md: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            size="small"
            label="Job Opening"
            value={jobOpeningSearchInput}
            onChange={(event) => setJobOpeningSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleApplyFilters();
            }}
            sx={{
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
            label="Decision Status"
            value={decisionStatus}
            onChange={(event) => {
              setDecisionStatus(event.target.value as DecisionStatus | "all");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {DECISION_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {DECISION_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Recommendation"
            value={recommendation}
            onChange={(event) => {
              setRecommendation(
                event.target.value as
                  | InterviewerRecommendation
                  | AiInterviewRecommendation
                  | "all",
              );
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
            {recommendationOptions.map((value) => (
              <MenuItem key={value} value={value}>
                {RECOMMENDATION_LABELS[value]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Decision From"
            type="date"
            value={decisionFrom}
            onChange={(event) => {
              setDecisionFrom(event.target.value);
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
            label="Decision To"
            type="date"
            value={decisionTo}
            onChange={(event) => {
              setDecisionTo(event.target.value);
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

      {deleteDecisionMutation.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(deleteDecisionMutation.error)}
        </Alert>
      ) : null}

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
        <DecisionTable
          rows={enrichedRows}
          loading={
            decisionsQuery.isLoading ||
            deleteDecisionMutation.isPending ||
            applicationQueries.some((query) => query.isLoading)
          }
          rowCount={rowCount}
          isError={decisionsQuery.isError}
          errorMessage={errorMessage}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          canEdit={canEditDecision}
          canDelete={canDeleteDecision}
          onDelete={handleDelete}
        />
      </Paper>
    </Box>
  );
}
