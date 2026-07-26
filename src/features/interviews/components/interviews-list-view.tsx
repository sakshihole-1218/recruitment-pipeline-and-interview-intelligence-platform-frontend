"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CancelOutlined as CancelIcon,
  Clear as ClearIcon,
  Event as InterviewsIcon,
  NavigateNext as NavigateNextIcon,
  SmartToyOutlined as AiIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import type { Theme } from "@mui/material/styles";

import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useInterviews } from "@/features/interviews/hooks/use-interviews";
import { useInterviewsPermissions } from "@/features/interviews/hooks/use-interviews-permissions";
import {
  INTERVIEW_MODES,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_STATUSES,
  INTERVIEW_STATUS_LABELS,
  getInterviewDisplayStatus,
  type InterviewMode,
  type InterviewResponse,
  type InterviewStatus,
  type InterviewsSortBy,
} from "@/features/interviews/types/interviews.types";
import { InterviewModeChip } from "@/features/interviews/components/interview-mode-chip";
import { InterviewStatusChip } from "@/features/interviews/components/interview-status-chip";
import { InterviewContextCell } from "./interviews-table/interview-context-cell";
import {
  InterviewRoundNameCell,
  InterviewRoundTypeCell,
} from "./interviews-table/interview-round-cell";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SORTABLE_FIELDS: readonly InterviewsSortBy[] = [
  "created_at",
  "updated_at",
  "scheduled_start_at",
  "scheduled_end_at",
  "completed_at",
  "interview_status",
] as const;

function toSortBy(field: string): InterviewsSortBy | undefined {
  return (SORTABLE_FIELDS as readonly string[]).includes(field)
    ? (field as InterviewsSortBy)
    : undefined;
}

function formatDateTimeShort(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewsListView() {
  const router = useRouter();
  const { snackbar, closeSnackbar } = useSnackbar();
  const { canScheduleInterview, canRescheduleInterview, canCancelInterview } =
    useInterviewsPermissions();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);

  const [status, setStatus] = useState<"all" | InterviewStatus>("all");
  const [mode, setMode] = useState<"all" | InterviewMode>("all");

  const [scheduledFromLocal, setScheduledFromLocal] = useState<string>("");
  const [scheduledToLocal, setScheduledToLocal] = useState<string>("");

  const sortModelRef = useRef<GridSortModel>(sortModel);
  const sortUpdateRafRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  useEffect(() => {
    sortModelRef.current = sortModel;
  }, [sortModel]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (sortUpdateRafRef.current != null) {
        cancelAnimationFrame(sortUpdateRafRef.current);
        sortUpdateRafRef.current = null;
      }
    };
  }, []);

  const queryParams = useMemo(() => {
    const sort0 = sortModel[0];
    const sort_by = sort0 ? toSortBy(sort0.field) : undefined;

    return {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(status !== "all" ? { interview_status: status } : {}),
      ...(mode !== "all" ? { interview_mode: mode } : {}),
      ...(scheduledFromLocal
        ? { scheduled_from: new Date(scheduledFromLocal).toISOString() }
        : {}),
      ...(scheduledToLocal
        ? { scheduled_to: new Date(scheduledToLocal).toISOString() }
        : {}),
      ...(sort_by
        ? {
            sort_by,
            sort_order: (sort0?.sort as "asc" | "desc" | undefined) ?? "desc",
          }
        : {}),
    };
  }, [
    paginationModel,
    status,
    mode,
    scheduledFromLocal,
    scheduledToLocal,
    sortModel,
  ]);

  const { data, isLoading, isError, error } = useInterviews(queryParams);

  const interviews: InterviewResponse[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: InterviewResponse[] }).data;
    }
    const cursor = (data as { data?: { data?: InterviewResponse[] } }).data;
    return cursor?.data ?? [];
  }, [data]);

  const rowCount = useMemo(() => {
    if (!data) return 0;
    if ("pagination" in data) return data.pagination?.total_records ?? 0;
    return 0;
  }, [data]);

  const safePaginationModel = useMemo(() => {
    const pageSize = paginationModel.pageSize;
    const maxPage =
      rowCount > 0 ? Math.max(0, Math.ceil(rowCount / pageSize) - 1) : 0;
    const page = Math.min(paginationModel.page, maxPage);
    return page === paginationModel.page
      ? paginationModel
      : { ...paginationModel, page };
  }, [paginationModel, rowCount]);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    const prev0 = sortModelRef.current?.[0];
    const next0 = model?.[0];
    const isSame =
      (sortModelRef.current?.length ?? 0) === (model?.length ?? 0) &&
      prev0?.field === next0?.field &&
      prev0?.sort === next0?.sort;
    if (isSame) return;

    // DataGrid can invoke this callback during its render lifecycle.
    // Defer state updates to avoid "Cannot update a component while rendering a different component".
    sortModelRef.current = model;
    if (sortUpdateRafRef.current != null) {
      cancelAnimationFrame(sortUpdateRafRef.current);
    }
    sortUpdateRafRef.current = requestAnimationFrame(() => {
      sortUpdateRafRef.current = null;
      if (!isMountedRef.current) return;
      setSortModel(model);
    });
  }, []);

  const actionIconButtonSx = useMemo(
    () => ({
      color: "primary.main",
      "&:hover": {
        bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.08),
      },
    }),
    [],
  );

  const editIconButtonSx = useMemo(
    () => ({
      color: "text.secondary",
      "&:hover": {
        bgcolor: (t: Theme) => alpha(t.palette.text.primary, 0.06),
      },
    }),
    [],
  );

  const dangerIconButtonSx = useMemo(
    () => ({
      color: "error.main",
      "&:hover": {
        bgcolor: (t: Theme) => alpha(t.palette.error.main, 0.08),
      },
    }),
    [],
  );

  const columns = useMemo<GridColDef<InterviewResponse>[]>(
    () => [
      {
        field: "context",
        headerName: "Candidate / Job",
        flex: 1.6,
        minWidth: 280,
        sortable: false,
        renderCell: (p) => <InterviewContextCell applicationId={p.row.application_id} />,
      },
      {
        field: "roundName",
        headerName: "Round Name",
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (p) => (
          <InterviewRoundNameCell
            applicationId={p.row.application_id}
            interviewRoundId={p.row.interview_round_id}
          />
        ),
      },
      {
        field: "roundType",
        headerName: "Round Type",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <InterviewRoundTypeCell
            applicationId={p.row.application_id}
            interviewRoundId={p.row.interview_round_id}
          />
        ),
      },
      {
        field: "scheduled_start_at",
        headerName: "Scheduled",
        flex: 0.7,
        minWidth: 160,
        valueGetter: (_v, row) => row.scheduled_start_at,
        renderCell: (p) => (
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {formatDateTimeShort(p.row.scheduled_start_at)}
          </Typography>
        ),
      },
      {
        field: "interview_mode",
        headerName: "Mode",
        flex: 0.7,
        minWidth: 140,
        renderCell: (p) => <InterviewModeChip mode={p.row.interview_mode} />,
      },
      {
        field: "interview_status",
        headerName: "Status",
        flex: 0.75,
        minWidth: 150,
        renderCell: (p) => <InterviewStatusChip status={getInterviewDisplayStatus(p.row)} />,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack
            direction="row"
            spacing={0.25}
            useFlexGap
            sx={{ justifyContent: "center", alignItems: "center", py: 0.25, flexWrap: "nowrap", width: "100%" }}
          >
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${p.row.id}`)}
                sx={actionIconButtonSx}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Open AI interview lobby">
              <IconButton
                size="small"
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${p.row.id}/ai-room`)}
                sx={actionIconButtonSx}
              >
                <AiIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canRescheduleInterview && ["SCHEDULED", "RESCHEDULED"].includes(p.row.interview_status) ? (
              <Tooltip title="Edit / Reschedule">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.INTERVIEWS}/${p.row.id}/edit`)}
                  sx={editIconButtonSx}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}

            {canCancelInterview && ["SCHEDULED", "RESCHEDULED"].includes(p.row.interview_status) ? (
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.INTERVIEWS}/${p.row.id}`)}
                  sx={dangerIconButtonSx}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [
      router,
      canRescheduleInterview,
      canCancelInterview,
      actionIconButtonSx,
      editIconButtonSx,
      dangerIconButtonSx,
    ],
  );

  const errorMessage = isError ? getApiErrorMessage(error) : "";

  const isEmptyState = !isLoading && !isError && interviews.length === 0;

  return (
    <Box>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
        aria-label="breadcrumb"
      >
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Interviews</Typography>
      </Breadcrumbs>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          background: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 100%)`,
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
              <InterviewsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Interviews
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Schedule, track and manage interview sessions.
              </Typography>
            </Box>
          </Stack>

          {canScheduleInterview ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.INTERVIEWS}/schedule`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
            >
              Schedule Interview
            </Button>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
        >
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "all" | InterviewStatus);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 170,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {INTERVIEW_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {INTERVIEW_STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Mode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "all" | InterviewMode);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {INTERVIEW_MODES.map((m) => (
              <MenuItem key={m} value={m}>
                {INTERVIEW_MODE_LABELS[m]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Scheduled from"
            type="datetime-local"
            value={scheduledFromLocal}
            onChange={(e) => {
              setScheduledFromLocal(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="Scheduled to"
            type="datetime-local"
            value={scheduledToLocal}
            onChange={(e) => {
              setScheduledToLocal(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Button
            variant="text"
            size="small"
            onClick={() => {
              setStatus("all");
              setMode("all");
              setScheduledFromLocal("");
              setScheduledToLocal("");
              setSortModel([{ field: "created_at", sort: "desc" }]);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            startIcon={<ClearIcon fontSize="small" />}
            sx={{
              height: 40,
              borderRadius: 2,
              fontWeight: 800,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
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
          minHeight: isEmptyState ? 0 : 400,
        }}
      >
        <DataGrid
          rows={interviews}
          columns={columns}
          getRowId={(r) => r.id}
          disableRowSelectionOnClick
          loading={isLoading}
          paginationMode="server"
          sortingMode="server"
          rowCount={rowCount}
          paginationModel={safePaginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          autoHeight={isEmptyState}
          sx={{
            border: "none",
            ...(isEmptyState
              ? {
                  "& .MuiDataGrid-virtualScroller": { minHeight: 260 },
                  "& .MuiDataGrid-overlayWrapperInner": { overflow: "visible" },
                }
              : null),
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              borderBottom: "1px solid",
              borderColor: "divider",
            },
            "& .MuiDataGrid-columnHeader": {
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.2px",
              textTransform: "none",
              color: "text.secondary",
              px: 2,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
            },
            "& .MuiDataGrid-cell": {
              py: 1.25,
              borderColor: "divider",
              px: 2,
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 220,
                  px: 2,
                  py: 4,
                  gap: 1.5,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: (t) =>
                      isError
                        ? alpha(t.palette.error.main, 0.1)
                        : alpha(t.palette.primary.main, 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0.5,
                  }}
                >
                  <InterviewsIcon
                    sx={{
                      color: isError ? "error.main" : "primary.main",
                      fontSize: 24,
                    }}
                  />
                </Box>

                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700 }}
                  color={isError ? "error" : "text.primary"}
                >
                  {isError ? "Failed to load interviews" : "No interviews found"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 520, whiteSpace: "normal" }}
                >
                  {isError ? errorMessage : "Try adjusting your search or filters."}
                </Typography>
              </Box>
            ),
            noResultsOverlay: () => (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 800 }}>No matching interviews</Typography>
              </Box>
            ),
          }}
        />
      </Paper>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );

}
