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
  Stack,
  Switch,
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
  Apartment as DepartmentsIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import {
  useDepartments,
  useUpdateDepartmentStatus,
} from "@/features/departments/hooks/use-departments";
import { useDepartmentsPermissions } from "@/features/departments/hooks/use-departments-permissions";
import { DepartmentStatusChip } from "@/features/departments/components/department-status-chip";
import { ConfirmDialog } from "@/features/departments/components/confirm-dialog";
import type { DepartmentResponse } from "@/features/departments/types/departments.types";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

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
            <DepartmentsIcon sx={{ color: "error.main", fontSize: 24 }} />
          </Box>
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load departments
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
            <DepartmentsIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            No departments found
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

export default function DepartmentsPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const {
    canCreateDepartment,
    canEditDepartment,
    canToggleDepartmentStatus,
  } = useDepartmentsPermissions();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");

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

  const queryParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(search ? { search } : {}),
      ...(isActiveFilter !== "all"
        ? { is_active: isActiveFilter === "true" }
        : {}),
      ...(sortModel[0]
        ? {
            sort_by: sortModel[0].field as
              | "created_at"
              | "updated_at"
              | "name"
              | "code"
              | "is_active",
            sort_order:
              (sortModel[0].sort?.toUpperCase() as "ASC" | "DESC") ?? "DESC",
          }
        : {}),
    }),
    [paginationModel, search, isActiveFilter, sortModel],
  );

  const { data, isLoading, isError, error } = useDepartments(queryParams);

  const departments: DepartmentResponse[] = useMemo(() => {
    if (!data) return [];

    // Offset mode
    if (Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: DepartmentResponse[] }).data;
    }

    // Cursor mode
    const cursorData = (data as { data?: { data?: DepartmentResponse[] } }).data;
    return cursorData?.data ?? [];
  }, [data]);

  const isEmptyState = !isLoading && departments.length === 0;

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

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // ---- Confirm dialog --------------------------------------------------------
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    department: DepartmentResponse | null;
  }>({ open: false, department: null });

  const pendingDepartmentId = confirmDialog.department?.id ?? "";
  const toggleStatus = useUpdateDepartmentStatus(pendingDepartmentId);

  const handleToggleConfirm = useCallback(async () => {
    if (!confirmDialog.department) return;

    try {
      await toggleStatus.mutateAsync(!confirmDialog.department.is_active);
      showSuccess(
        `Department ${
          !confirmDialog.department.is_active ? "activated" : "deactivated"
        } successfully.`,
      );
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmDialog({ open: false, department: null });
    }
  }, [confirmDialog.department, toggleStatus, showSuccess, showError]);

  const columns: GridColDef<DepartmentResponse>[] = useMemo(
    () => [
      {
        field: "created_at",
        headerName: "Created",
        width: 140,
        sortable: true,
        filterable: false,
        valueGetter: (_value, row) => row.created_at,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1.1,
        minWidth: 220,
        sortable: true,
      },
      {
        field: "code",
        headerName: "Code",
        width: 150,
        sortable: true,
        renderCell: ({ row }: GridRenderCellParams<DepartmentResponse>) => (
          <Box
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.4,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              color: "primary.main",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: 0.4,
            }}
          >
            {row.code}
          </Box>
        ),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.9,
        minWidth: 320,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<DepartmentResponse>) => (
          <Typography
            variant="body2"
            color={row.description ? "text.primary" : "text.disabled"}
            sx={{ whiteSpace: "normal" }}
          >
            {row.description ?? "—"}
          </Typography>
        ),
      },
      {
        field: "is_active",
        headerName: "Status",
        width: 120,
        sortable: true,
        renderCell: ({ row }: GridRenderCellParams<DepartmentResponse>) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <DepartmentStatusChip isActive={row.is_active} />
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canToggleDepartmentStatus ? 170 : 110,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: ({ row }: GridRenderCellParams<DepartmentResponse>) => (
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
                onClick={() => router.push(`${ROUTES.DEPARTMENTS}/${row.id}`)}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                  },
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canEditDepartment ? (
              <Tooltip title="Edit department">
                <IconButton
                  size="small"
                  onClick={() =>
                    router.push(`${ROUTES.DEPARTMENTS}/${row.id}/edit`)
                  }
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

            {canToggleDepartmentStatus ? (
              <Tooltip
                title={row.is_active ? "Deactivate department" : "Activate department"}
              >
                <Switch
                  checked={row.is_active}
                  onChange={() => setConfirmDialog({ open: true, department: row })}
                  size="small"
                  color="success"
                  sx={{ ml: 0.5 }}
                />
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [router, canEditDepartment, canToggleDepartmentStatus],
  );

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={NextLink}
          href={ROUTES.DASHBOARD}
          underline="hover"
          color="inherit"
        >
          Dashboard
        </Link>
        <Typography color="text.primary">Departments</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
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
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DepartmentsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Departments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Manage Organizational Departments Used Across Recruitment.
              </Typography>
            </Box>
          </Stack>

          {canCreateDepartment ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.DEPARTMENTS}/new`)}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                px: 2.5,
                py: 1,
                boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
                "&:hover": { boxShadow: "0 4px 12px rgba(25,118,210,0.4)" },
              }}
            >
              Create Department
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 1.5, alignItems: { xs: "stretch", sm: "center" } }}
        >
          <TextField
            size="small"
            placeholder="Search by name or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
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
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleSearchSubmit}
            sx={{
              height: 40,
              px: 2.5,
              borderRadius: 2,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            Search
          </Button>

          <TextField
            select
            size="small"
            label="Status"
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 150,
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
        </Stack>
      </Paper>

      {/* Data grid */}
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
          rows={departments}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          rowCount={rowCount}
          autoHeight={isEmptyState}
          paginationMode="server"
          sortingMode="server"
          paginationModel={safePaginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          disableRowSelectionOnClick
          getRowHeight={getRowHeight}
          initialState={{
            columns: {
              columnVisibilityModel: { created_at: false },
            },
          }}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage: getApiErrorMessage(error),
            },
          }}
          sx={{
            border: "none",
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.department?.is_active
            ? "Deactivate Department"
            : "Activate Department"
        }
        description={
          confirmDialog.department?.is_active
            ? `Are you sure you want to deactivate ${confirmDialog.department.name}?`
            : `Are you sure you want to activate ${confirmDialog.department?.name}?`
        }
        confirmLabel={
          confirmDialog.department?.is_active ? "Deactivate" : "Activate"
        }
        confirmColor={confirmDialog.department?.is_active ? "error" : "success"}
        loading={toggleStatus.isPending}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmDialog({ open: false, department: null })}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
