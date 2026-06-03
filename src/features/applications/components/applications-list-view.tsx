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
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  EditOutlined as EditIcon,
  NavigateNext as NavigateNextIcon,
  WorkOutlined as ApplicationsIcon,
} from "@mui/icons-material";
import type { Theme } from "@mui/material/styles";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";

import {
  APPLICATION_CURRENT_STAGES,
  APPLICATION_SORT_FIELDS,
  APPLICATION_STATUSES,
  type ApplicationCurrentStage,
  type ApplicationResponse,
  type ApplicationStatus,
  type ApplicationsSortBy,
} from "@/features/applications/types/applications.types";
import { useApplicationsPermissions } from "@/features/applications/hooks/use-applications-permissions";
import { useApplications } from "@/features/applications/hooks/use-applications";
import { ApplicationStatusChip } from "@/features/applications/components/application-status-chip";
import { ApplicationStageChip } from "@/features/applications/components/application-stage-chip";
import { CandidateRef, JobOpeningRef } from "@/features/applications/components/application-references";

// Extend MUI DataGrid slot-props to accept custom NoRowsOverlay props
declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
}

function NoRowsOverlay({ isError, errorMessage }: { isError?: boolean; errorMessage?: string }) {
  return (
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
        <ApplicationsIcon sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }} />
      </Box>

      <Typography variant="body1" sx={{ fontWeight: 700 }} color={isError ? "error" : "text.primary"}>
        {isError ? "Failed to load applications" : "No applications found"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, whiteSpace: "normal" }}>
        {isError ? errorMessage : "Try adjusting your search or filters."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

function unwrapListRows<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  // Offset mode
  if (Array.isArray(obj.data)) return obj.data as T[];

  // Cursor mode
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

export function ApplicationsListView() {
  const router = useRouter();
  const { canCreateApplication, canManageApplicationStatus, canAssignOwners, canManageApplicationStage } = useApplicationsPermissions();
  const canEditApplication = canManageApplicationStatus || canAssignOwners || canManageApplicationStage;

  const [applicationNumberInput, setApplicationNumberInput] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [stageFilter, setStageFilter] = useState<ApplicationCurrentStage | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "true" | "false">("all");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);

  const sortModelRef = useRef<GridSortModel>(sortModel);
  const sortRafRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    sortModelRef.current = sortModel;
  }, [sortModel]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (sortRafRef.current !== null) {
        cancelAnimationFrame(sortRafRef.current);
        sortRafRef.current = null;
      }
    };
  }, []);

  const sortBy = sortModel[0]?.field as ApplicationsSortBy | undefined;
  const sortOrder = sortModel[0]?.sort as "asc" | "desc" | undefined;

  const queryParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(applicationNumber ? { application_number: applicationNumber } : {}),
      ...(statusFilter !== "all" ? { application_status: statusFilter } : {}),
      ...(stageFilter !== "all" ? { current_stage: stageFilter } : {}),
      ...(priorityFilter !== "all" ? { is_priority: priorityFilter === "true" } : {}),
      ...(sortBy && (APPLICATION_SORT_FIELDS as readonly string[]).includes(sortBy)
        ? { sort_by: sortBy, sort_order: sortOrder ?? "desc" }
        : {}),
    }),
    [paginationModel, applicationNumber, statusFilter, stageFilter, priorityFilter, sortBy, sortOrder],
  );

  const { data, isLoading, isError, error } = useApplications(queryParams);

  const rows: ApplicationResponse[] = useMemo(() => unwrapListRows<ApplicationResponse>(data), [data]);

  const rowCount = useMemo(() => {
    if (!data) return 0;

    // Offset mode: uses pagination.total_records
    const offset = data as { pagination?: { total_records?: number } };
    if (offset.pagination?.total_records !== undefined) return offset.pagination.total_records;

    // Cursor mode: DataGrid still needs a number; fallback to current length
    return rows.length;
  }, [data, rows.length]);

  const errorMessage = isError ? getApiErrorMessage(error) : "";

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => setPaginationModel(model),
    [],
  );

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    const prev0 = sortModelRef.current?.[0];
    const next0 = model?.[0];
    const isSame =
      (sortModelRef.current?.length ?? 0) === (model?.length ?? 0) &&
      prev0?.field === next0?.field &&
      prev0?.sort === next0?.sort;

    if (isSame) return;
    if (!isMountedRef.current) return;

    if (sortRafRef.current !== null) {
      cancelAnimationFrame(sortRafRef.current);
    }

    sortRafRef.current = requestAnimationFrame(() => {
      sortRafRef.current = null;
      if (!isMountedRef.current) return;
      setSortModel(model);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    });
  }, []);

  const isEmptyState = !isLoading && !isError && rows.length === 0;

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

  const handleApplyFilters = () => {
    setApplicationNumber(applicationNumberInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setApplicationNumberInput("");
    setApplicationNumber("");
    setStatusFilter("all");
    setStageFilter("all");
    setPriorityFilter("all");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns = useMemo<GridColDef<ApplicationResponse>[]>(
    () => [
      {
        field: "created_at",
        headerName: "Created",
        width: 140,
        valueGetter: (_value, row) => row.created_at,
        sortable: true,
      },
      {
        field: "application_number",
        headerName: "Application",
        flex: 1,
        minWidth: 170,
        renderCell: (params: GridRenderCellParams<ApplicationResponse, string>) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Link
              component={NextLink}
              href={`${ROUTES.APPLICATIONS}/${params.row.id}`}
              underline="hover"
              sx={{ fontWeight: 900 }}
              noWrap
            >
              {params.value}
            </Link>
            <Typography variant="caption" color="text.secondary" noWrap>
              Applied: {params.row.applied_at ? new Date(params.row.applied_at).toLocaleDateString() : "—"}
            </Typography>
          </Stack>
        ),
        sortable: true,
      },
      {
        field: "candidate_id",
        headerName: "Candidate",
        flex: 1.3,
        minWidth: 260,
        renderCell: (params) => <CandidateRef candidateId={params.row.candidate_id} />,
        sortable: false,
      },
      {
        field: "job_opening_id",
        headerName: "Job opening",
        flex: 1.5,
        minWidth: 320,
        renderCell: (params) => <JobOpeningRef jobOpeningId={params.row.job_opening_id} showCode={false} />,
        sortable: false,
      },
      {
        field: "current_stage",
        headerName: "Stage",
        minWidth: 140,
        renderCell: (params) => <ApplicationStageChip stage={params.row.current_stage} />,
        sortable: true,
      },
      {
        field: "application_status",
        headerName: "Status",
        minWidth: 140,
        renderCell: (params) => <ApplicationStatusChip status={params.row.application_status} />,
        sortable: true,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack
            direction="row"
            spacing={0.25}
            useFlexGap
            sx={{ justifyContent: "center", alignItems: "center", py: 0.25, flexWrap: "wrap", width: "100%" }}
          >
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => router.push(`${ROUTES.APPLICATIONS}/${params.row.id}`)}
                sx={actionIconButtonSx}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canEditApplication ? (
              <Tooltip title="Edit / Manage">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.APPLICATIONS}/${params.row.id}/edit`)}
                  sx={editIconButtonSx}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [
      actionIconButtonSx,
      editIconButtonSx,
      canEditApplication,
      router,
    ],
  );

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }} aria-label="breadcrumb">
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Applications</Typography>
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
              <ApplicationsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Applications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Central workflow for candidates as they move through stages.
              </Typography>
            </Box>
          </Stack>

          {canCreateApplication ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.APPLICATIONS}/new`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
            >
              Create Application
            </Button>
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
          <TextField
            size="small"
            label="Application number"
            value={applicationNumberInput}
            onChange={(e) => setApplicationNumberInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: applicationNumberInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setApplicationNumberInput("");
                        setApplicationNumber("");
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                      }}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              flex: 1,
              maxWidth: { sm: 360 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ApplicationStatus | "all");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {APPLICATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Stage"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value as ApplicationCurrentStage | "all");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {APPLICATION_CURRENT_STAGES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as "all" | "true" | "false");
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Priority</MenuItem>
            <MenuItem value="false">Normal</MenuItem>
          </TextField>

          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            sx={{
              height: 40,
              px: 2.5,
              borderRadius: 2,
              fontWeight: 800,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Apply
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={handleClearFilters}
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
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          rowCount={rowCount}
          autoHeight={isEmptyState}
          disableRowSelectionOnClick
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          getRowHeight={getRowHeight}
          initialState={{
            columns: {
              columnVisibilityModel: { created_at: false },
            },
          }}
          slots={{
            noRowsOverlay: NoRowsOverlay,
            noResultsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage,
            },
            noResultsOverlay: {
              isError,
              errorMessage,
            },
          }}
          sx={{
            border: "none",
            ...(isEmptyState
              ? {
                  "& .MuiDataGrid-virtualScroller": {
                    minHeight: 260,
                  },
                  "& .MuiDataGrid-overlayWrapperInner": {
                    overflow: "visible",
                  },
                }
              : {}),
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
        />
      </Paper>

    </Box>
  );
}
