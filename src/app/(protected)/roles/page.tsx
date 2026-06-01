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
  AdminPanelSettings as RolesIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useRoles } from "@/features/roles/hooks/use-roles";
import type { RoleResponse } from "@/features/roles/types/roles.types";

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
            <RolesIcon sx={{ color: "error.main", fontSize: 24 }} />
          </Box>
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load roles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, whiteSpace: "normal" }}>
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
            <RolesIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
            No roles found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, whiteSpace: "normal" }}>
            Try adjusting your search.
          </Typography>
        </>
      )}
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

export default function RolesPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

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
      ...(sortModel[0]
        ? {
            sort_by: sortModel[0].field as "created_at" | "updated_at" | "code" | "name",
            sort_order: (sortModel[0].sort?.toUpperCase() as "ASC" | "DESC") ?? "DESC",
          }
        : {}),
    }),
    [paginationModel, search, sortModel],
  );

  const { data, isLoading, isError, error } = useRoles(queryParams);

  const roles: RoleResponse[] = data?.data ?? [];

  const isEmptyState = !isLoading && roles.length === 0;

  const rowCount = useMemo(() => data?.pagination?.total_records ?? 0, [data]);

  const safePaginationModel = useMemo(() => {
    const pageSize = paginationModel.pageSize;
    const maxPage = rowCount > 0 ? Math.max(0, Math.ceil(rowCount / pageSize) - 1) : 0;
    const page = Math.min(paginationModel.page, maxPage);
    return page === paginationModel.page ? paginationModel : { ...paginationModel, page };
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

    // Avoid scheduling state updates before mount/unmount (DataGrid can emit
    // sort model changes during initial render in dev/StrictMode).
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

  const columns: GridColDef<RoleResponse>[] = useMemo(
    () => [
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
        width: 190,
        sortable: true,
        headerAlign: "left",
        align: "left",
        renderCell: ({ row }: GridRenderCellParams<RoleResponse>) => (
          <Box
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.4,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              color: "primary.main",
              fontWeight: 700,
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
        flex: 2.2,
        minWidth: 360,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<RoleResponse>) => (
          <Typography variant="body2" color={row.description ? "text.primary" : "text.disabled"} sx={{ whiteSpace: "normal" }}>
            {row.description ?? "—"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 110,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: ({ row }: GridRenderCellParams<RoleResponse>) => (
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 0.25, height: "100%", width: "100%" }}>
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => router.push(`${ROUTES.ROLES}/${row.id}`)}
                sx={{
                  color: "primary.main",
                  "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [router],
  );

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Roles</Typography>
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
              <RolesIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Roles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                View System Roles and Role Metadata
              </Typography>
            </Box>
          </Stack>

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
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5, alignItems: { xs: "stretch", sm: "center" } }}>
          <TextField
            size="small"
            placeholder="Search roles by name or code…"
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
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleSearchSubmit}
            sx={{ height: 40, px: 2.5, borderRadius: 2, fontWeight: 700, flexShrink: 0 }}
          >
            Search
          </Button>
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
          rows={roles}
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
          slots={{
            noRowsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage: isError ? getApiErrorMessage(error) : "",
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
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.2px",
              textTransform: "none",
              color: "text.secondary",
              px: 2,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
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
