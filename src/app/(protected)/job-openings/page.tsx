"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Switch,
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
  Clear as ClearIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  WorkOutlined as JobOpeningsIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import {
  useJobOpenings,
  useUpdateJobOpening,
} from "@/features/job-openings/hooks/use-job-openings";
import { useJobOpeningsPermissions } from "@/features/job-openings/hooks/use-job-openings-permissions";
import { ConfirmDialog } from "@/features/job-openings/components/confirm-dialog";
import { JobOpeningStatusChip } from "@/features/job-openings/components/job-opening-status-chip";
import { JobOpeningActiveChip } from "@/features/job-openings/components/job-opening-active-chip";
import {
  JOB_OPENING_STATUSES,
  JOB_OPENING_STATUS_LABELS,
  type JobOpeningResponse,
  type JobOpeningStatus,
} from "@/features/job-openings/types/job-openings.types";

// Extend MUI DataGrid slot-props to accept custom NoRowsOverlay props
declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
}

interface NoRowsOverlayProps {
  isError?: boolean;
  errorMessage?: string;
}

function NoRowsOverlay({ isError, errorMessage }: NoRowsOverlayProps) {
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
      {isError ? (
        <>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: (t) => alpha(t.palette.error.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 0.5,
            }}
          >
            <JobOpeningsIcon sx={{ color: "error.main", fontSize: 24 }} />
          </Box>
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load job openings
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 420, whiteSpace: "normal" }}
          >
            {errorMessage}
          </Typography>
        </>
      ) : (
        <>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 0.5,
            }}
          >
            <JobOpeningsIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            No job openings found
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 420, whiteSpace: "normal" }}
          >
            Try adjusting your search or filters.
          </Typography>
        </>
      )}
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  // Offset mode
  if (Array.isArray(obj.data)) return obj.data as T[];

  // Cursor mode
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

type PendingAction =
  | "activate"
  | "deactivate";

export default function JobOpeningsPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const {
    canCreateJobOpening,
    canEditJobOpening,
    canManageJobOpeningStatus,
  } = useJobOpeningsPermissions();

  const [titleInput, setTitleInput] = useState("");
  const [title, setTitle] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "updated_at", sort: "desc" },
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

  const queryParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(title ? { title } : {}),
      ...(code ? { code } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter as JobOpeningStatus } : {}),
      ...(isActiveFilter !== "all" ? { is_active: isActiveFilter === "true" } : {}),
      ...(sortModel[0]
        ? {
            sort_by: sortModel[0].field as
              | "created_at"
              | "updated_at"
              | "title"
              | "code"
              | "status"
              | "published_at"
              | "closed_at"
              | "is_active",
            sort_order:
              (sortModel[0].sort?.toUpperCase() as "ASC" | "DESC") ?? "DESC",
          }
        : {}),
    }),
    [paginationModel, title, code, statusFilter, isActiveFilter, sortModel],
  );

  const { data, isLoading, isError, error } = useJobOpenings(queryParams);

  const openings: JobOpeningResponse[] = useMemo(() => {
    if (!data) return [];

    // Offset mode
    if (Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: JobOpeningResponse[] }).data;
    }

    // Cursor mode
    const cursorData = (data as { data?: { data?: JobOpeningResponse[] } }).data;
    return cursorData?.data ?? [];
  }, [data]);

  const isEmptyState = !isLoading && openings.length === 0;

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

  const handleApplyFilters = () => {
    setTitle(titleInput.trim());
    setCode(codeInput.trim().toUpperCase());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setTitleInput("");
    setTitle("");
    setCodeInput("");
    setCode("");
    setStatusFilter("all");
    setIsActiveFilter("all");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // --- Lookup: department names (best-effort) -------------------------------
  const departmentsQuery = useDepartments({
    page: 1,
    limit: 100,
    sort_by: "name",
    sort_order: "ASC",
  });
  const departmentsById = useMemo(() => {
    const map = new Map<string, string>();

    const rows = unwrapListData<{ id: string; name: string }>(departmentsQuery.data);
    for (const dep of rows) {
      if (dep?.id && dep?.name) map.set(dep.id, dep.name);
    }
    return map;
  }, [departmentsQuery.data]);

  // ---- Status/action confirmation dialog ----------------------------------
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: PendingAction | null;
    opening: JobOpeningResponse | null;
  }>({ open: false, action: null, opening: null });

  const pendingId = confirmDialog.opening?.id ?? "";
  const update = useUpdateJobOpening(pendingId);

  const isMutating = update.isPending;

  const confirmMeta = useMemo(() => {
    const openingTitle = confirmDialog.opening?.title ?? "this job opening";

    switch (confirmDialog.action) {
      case "activate":
        return {
          title: "Activate Job Opening",
          description: `Are you sure you want to activate ${openingTitle}?`,
          confirmLabel: "Activate",
          confirmColor: "success" as const,
        };
      case "deactivate":
        return {
          title: "Deactivate Job Opening",
          description: `Are you sure you want to deactivate ${openingTitle}?`,
          confirmLabel: "Deactivate",
          confirmColor: "error" as const,
        };
      default:
        return null;
    }
  }, [confirmDialog.action, confirmDialog.opening]);

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog.action || !confirmDialog.opening) return;

    try {
      switch (confirmDialog.action) {
        case "activate": {
          const res = await update.mutateAsync({ is_active: true });
          showSuccess(res.message || "Job opening activated successfully");
          break;
        }
        case "deactivate": {
          const res = await update.mutateAsync({ is_active: false });
          showSuccess(res.message || "Job opening deactivated successfully");
          break;
        }
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmDialog({ open: false, action: null, opening: null });
    }
  }, [
    confirmDialog.action,
    confirmDialog.opening,
    update,
    showSuccess,
    showError,
  ]);

  const columns: GridColDef<JobOpeningResponse>[] = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1.6,
        minWidth: 260,
        sortable: true,
      },
      {
        field: "code",
        headerName: "Code",
        width: 160,
        sortable: true,
      },
      {
        field: "department_id",
        headerName: "Department",
        flex: 1,
        minWidth: 220,
        sortable: false,
        valueGetter: (_value, row) => {
          const fromApi = row.department_name;
          if (fromApi && String(fromApi).trim() !== "") return fromApi;

          const fromLookup = departmentsById.get(row.department_id);
          return fromLookup ?? "—";
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        sortable: true,
        renderCell: (params: GridRenderCellParams<JobOpeningResponse>) => (
          <JobOpeningStatusChip status={params.row.status} />
        ),
      },
      {
        field: "is_active",
        headerName: "Active",
        width: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams<JobOpeningResponse>) => (
          <JobOpeningActiveChip isActive={params.row.is_active} />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canManageJobOpeningStatus ? 170 : 110,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<JobOpeningResponse>) => {
          const row = params.row;

          return (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                height: "100%",
                width: "100%",
              }}
            >
              <Tooltip title="View details">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.JOB_OPENINGS}/${row.id}`)}
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                  }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {canEditJobOpening ? (
                <Tooltip title="Edit job opening">
                  <IconButton
                    size="small"
                    onClick={() => router.push(`${ROUTES.JOB_OPENINGS}/${row.id}/edit`)}
                    sx={{
                      color: "text.secondary",
                      "&:hover": {
                        bgcolor: (t) => alpha(t.palette.info.main, 0.08),
                        color: "info.main",
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}

              {canManageJobOpeningStatus ? (
                <Tooltip
                  title={row.is_active ? "Deactivate job opening" : "Activate job opening"}
                >
                  <Switch
                    checked={row.is_active}
                    onChange={() =>
                      setConfirmDialog({
                        open: true,
                        action: row.is_active ? "deactivate" : "activate",
                        opening: row,
                      })
                    }
                    size="small"
                    color="success"
                    sx={{ ml: 0.5 }}
                  />
                </Tooltip>
              ) : null}
            </Stack>
          );
        },
      },
    ],
    [
      router,
      departmentsById,
      canEditJobOpening,
      canManageJobOpeningStatus,
    ],
  );

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Job Openings</Typography>
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
              <JobOpeningsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Job Openings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Create, manage and track roles across departments.
              </Typography>
            </Box>
          </Stack>

          {canCreateJobOpening ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.JOB_OPENINGS}/new`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 800 }}
            >
              Create Job Opening
            </Button>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" } }}
        >
          <TextField
            size="small"
            label="Title"
            placeholder="Search by title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
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
                endAdornment: titleInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTitleInput("");
                        setTitle("");
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
              maxWidth: { md: 320 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            size="small"
            label="Code"
            placeholder="e.g. BE-2026-001"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            slotProps={{
              htmlInput: { style: { textTransform: "uppercase" } },
              input: {
                endAdornment: codeInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCodeInput("");
                        setCode("");
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
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
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
            {JOB_OPENING_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {JOB_OPENING_STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Active"
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
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
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
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
          rows={openings}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          rowCount={rowCount}
          autoHeight={isEmptyState}
          disableRowSelectionOnClick
          paginationMode="server"
          sortingMode="server"
          paginationModel={safePaginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          getRowHeight={getRowHeight}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage: getApiErrorMessage(error),
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
              alignItems: "center",
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

      {confirmMeta ? (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmMeta.title}
          description={confirmMeta.description}
          confirmLabel={confirmMeta.confirmLabel}
          confirmColor={confirmMeta.confirmColor}
          loading={isMutating}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog({ open: false, action: null, opening: null })}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
