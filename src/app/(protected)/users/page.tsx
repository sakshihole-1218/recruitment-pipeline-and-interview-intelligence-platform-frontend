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
  GridSortModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  PeopleAlt as PeopleIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getUserRoles, hasAnyRole } from "@/utils/rbac";
import { ROLES } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useUsers, useToggleUserStatus } from "@/features/users/hooks/use-users";
import { UserStatusChip } from "@/features/users/components/user-status-chip";
import { ConfirmDialog } from "@/features/users/components/confirm-dialog";
import type { UserResponse } from "@/features/users/types/users.types";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";

// Extend MUI DataGrid slot-props to accept custom NoRowsOverlay props
declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
}


const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

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
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          bgcolor: (t) =>
            alpha(t.palette[isError ? "error" : "primary"].main, isError ? 0.15 : 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
          boxShadow: (t) => `0 0 20px ${alpha(t.palette[isError ? "error" : "primary"].main, 0.2)}`,
        }}
      >
        <PeopleIcon sx={{ color: isError ? "error.main" : "primary.main", fontSize: 36 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }} color={isError ? "error" : "text.primary"}>
        {isError ? "Failed to load users" : "No users found"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, whiteSpace: "normal" }}>
        {isError
          ? errorMessage
          : "Try adjusting your filters like name, email, or role to find what you're looking for."}
      </Typography>
    </Box>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const roles = getUserRoles();
  const isAdmin = hasAnyRole(roles, [ROLES.ADMIN]);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // ---- Filters & pagination state ----------------------------------------
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);

  // DataGrid may call onSortModelChange during its render.
  // Keep refs + defer updates to avoid React warning.
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

  // ---- Confirm dialog --------------------------------------------------------
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserResponse | null;
  }>({ open: false, user: null });

  // ---- Query -----------------------------------------------------------------
  const queryParams = useMemo(() => ({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...(search ? { search } : {}),
    ...(isActiveFilter !== "all" ? { is_active: isActiveFilter === "true" } : {}),
    ...(sortModel[0]
      ? {
          sort_by: sortModel[0].field,
          sort_order: sortModel[0].sort?.toUpperCase() as "ASC" | "DESC",
        }
      : {}),
  }), [paginationModel, search, isActiveFilter, sortModel]);

  const { data, isLoading, isError, error } = useUsers(queryParams);

  const users: UserResponse[] = data?.data ?? [];

  const isEmptyState = !isLoading && users.length === 0;

  const rowCount = useMemo(() => data?.pagination?.total_records ?? 0, [data]);

  // Prevent DataGrid from trying to "fix" out-of-range pages during render.
  // This can happen after filtering/searching when total records shrink.
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

  // ---- Toggle status mutation ------------------------------------------------
  const pendingUserId = confirmDialog.user?.id ?? "";
  const toggleStatus = useToggleUserStatus(pendingUserId);

  const handleToggleConfirm = useCallback(async () => {
    if (!confirmDialog.user) return;
    try {
      await toggleStatus.mutateAsync(!confirmDialog.user.is_active);
      showSuccess(
        `User ${!confirmDialog.user.is_active ? "activated" : "deactivated"} successfully.`,
      );
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmDialog({ open: false, user: null });
    }
  }, [confirmDialog.user, toggleStatus, showSuccess, showError]);

  // ---- Columns ---------------------------------------------------------------
  const columns: GridColDef<UserResponse>[] = useMemo(() => [
    {
      field: "created_at",
      headerName: "Created",
      width: 140,
      sortable: true,
      filterable: false,
      valueGetter: (_value, row) => row.created_at,
    },
    {
      field: "first_name",
      headerName: "Name",
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => `${row.first_name} ${row.last_name}`,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<UserResponse>) =>
        row.phone ?? (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        ),
    },
    {
      field: "roles",
      headerName: "Roles",
      flex: 1.2,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<UserResponse>) => (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, alignItems: "center", height: "100%", py: 0.5 }}>
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: "inline-flex",
                  px: 1,
                  py: 0.4,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                  color: "primary.main",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: 0.2,
                }}
              >
                {r.name}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
              No roles
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 110,
      renderCell: ({ row }: GridRenderCellParams<UserResponse>) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <UserStatusChip isActive={row.is_active} />
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: ({ row }: GridRenderCellParams<UserResponse>) => (
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 0.25, height: "100%", width: "100%" }}>
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => router.push(`${ROUTES.USERS}/${row.id}`)}
              sx={{
                color: "primary.main",
                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <>
              <Tooltip title="Edit user">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.USERS}/${row.id}/edit`)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { bgcolor: (t) => alpha(t.palette.info.main, 0.08), color: "info.main" },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.is_active ? "Deactivate user" : "Activate user"}>
                <Switch
                  checked={row.is_active}
                  onChange={() => setConfirmDialog({ open: true, user: row })}
                  size="small"
                  color="success"
                  sx={{ ml: 0.5 }}
                />
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ], [router, isAdmin, setConfirmDialog]);

  // ---- Search submit ---------------------------------------------------------
  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Users</Typography>
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
          bgcolor: "background.paper",
          backgroundImage: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 100%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}
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
              <PeopleIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Users
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Manage System Users and their Access
              </Typography>
            </Box>
          </Stack>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.USERS}/new`)}
              sx={{
                fontWeight: 600,
                px: 2.5,
                py: 1,
                boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
                "&:hover": { boxShadow: "0 4px 12px rgba(25,118,210,0.4)" },
              }}
            >
              Create User
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Filters toolbar */}
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
            placeholder="Search by name or email…"
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
              maxWidth: { sm: 320 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSearchSubmit}
            sx={{ height: 40, px: 2.5, fontWeight: 600, flexShrink: 0 }}
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
              minWidth: 140,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          minHeight: isEmptyState ? 0 : 400,
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          rowCount={rowCount}
          loading={isLoading}
          autoHeight={isEmptyState}
          paginationMode="server"
          paginationModel={safePaginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          initialState={{
            columns: {
              columnVisibilityModel: { created_at: false },
            },
          }}
          disableRowSelectionOnClick
          getRowHeight={getRowHeight}
          sx={{
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
          }}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage: getApiErrorMessage(error),
            },
          }}
        />
      </Paper>

      {/* Confirm activate / deactivate dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.user?.is_active ? "Deactivate User" : "Activate User"
        }
        description={
          confirmDialog.user?.is_active
            ? `Are you sure you want to deactivate ${confirmDialog.user.first_name} ${confirmDialog.user.last_name}? They will lose access to the system.`
            : `Are you sure you want to activate ${confirmDialog.user?.first_name} ${confirmDialog.user?.last_name}?`
        }
        confirmLabel={confirmDialog.user?.is_active ? "Deactivate" : "Activate"}
        confirmColor={confirmDialog.user?.is_active ? "error" : "success"}
        loading={toggleStatus.isPending}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmDialog({ open: false, user: null })}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
