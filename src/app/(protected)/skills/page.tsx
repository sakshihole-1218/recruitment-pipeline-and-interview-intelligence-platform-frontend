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
  Clear as ClearIcon,
  Edit as EditIcon,
  Psychology as SkillsIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import {
  useSkills,
  useUpdateSkillStatus,
} from "@/features/skills/hooks/use-skills";
import { useSkillsPermissions } from "@/features/skills/hooks/use-skills-permissions";
import { SkillStatusChip } from "@/features/skills/components/skill-status-chip";
import { ConfirmDialog } from "@/features/skills/components/confirm-dialog";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  type SkillCategory,
  type SkillResponse,
} from "@/features/skills/types/skills.types";
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
            <SkillsIcon sx={{ color: "error.main", fontSize: 24 }} />
          </Box>
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load skills
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
            <SkillsIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            No skills found
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

export default function SkillsPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { canCreateSkill, canEditSkill, canToggleSkillStatus } =
    useSkillsPermissions();

  const [nameInput, setNameInput] = useState("");
  const [name, setName] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
      ...(name ? { name } : {}),
      ...(code ? { code } : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter as SkillCategory } : {}),
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
              | "category"
              | "is_active",
            sort_order:
              (sortModel[0].sort?.toUpperCase() as "ASC" | "DESC") ?? "DESC",
          }
        : {}),
    }),
    [paginationModel, name, code, categoryFilter, isActiveFilter, sortModel],
  );

  const { data, isLoading, isError, error } = useSkills(queryParams);

  const skills: SkillResponse[] = useMemo(() => {
    if (!data) return [];

    // Offset mode
    if (Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: SkillResponse[] }).data;
    }

    // Cursor mode
    const cursorData = (data as { data?: { data?: SkillResponse[] } }).data;
    return cursorData?.data ?? [];
  }, [data]);

  const isEmptyState = !isLoading && skills.length === 0;

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
    setName(nameInput.trim());
    setCode(codeInput.trim().toUpperCase());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setNameInput("");
    setName("");
    setCodeInput("");
    setCode("");
    setCategoryFilter("all");
    setIsActiveFilter("all");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // ---- Confirm dialog ------------------------------------------------------
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    skill: SkillResponse | null;
  }>({ open: false, skill: null });

  const pendingSkillId = confirmDialog.skill?.id ?? "";
  const toggleStatus = useUpdateSkillStatus(pendingSkillId);

  const handleToggleConfirm = useCallback(async () => {
    if (!confirmDialog.skill) return;

    try {
      await toggleStatus.mutateAsync(!confirmDialog.skill.is_active);
      showSuccess(
        `Skill ${!confirmDialog.skill.is_active ? "activated" : "deactivated"} successfully.`,
      );
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setConfirmDialog({ open: false, skill: null });
    }
  }, [confirmDialog.skill, toggleStatus, showSuccess, showError]);

  const columns: GridColDef<SkillResponse>[] = useMemo(
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
        renderCell: ({ row }: GridRenderCellParams<SkillResponse>) => (
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
        field: "category",
        headerName: "Category",
        width: 160,
        sortable: true,
        renderCell: ({ row }: GridRenderCellParams<SkillResponse>) => (
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {SKILL_CATEGORY_LABELS[row.category]}
          </Typography>
        ),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.7,
        minWidth: 280,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<SkillResponse>) => (
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
        renderCell: ({ row }: GridRenderCellParams<SkillResponse>) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <SkillStatusChip isActive={row.is_active} />
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canToggleSkillStatus ? 170 : 110,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: ({ row }: GridRenderCellParams<SkillResponse>) => (
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
                onClick={() => router.push(`${ROUTES.SKILLS}/${row.id}`)}
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

            {canEditSkill ? (
              <Tooltip title="Edit skill">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.SKILLS}/${row.id}/edit`)}
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

            {canToggleSkillStatus ? (
              <Tooltip title={row.is_active ? "Deactivate skill" : "Activate skill"}>
                <Switch
                  checked={row.is_active}
                  onChange={() => setConfirmDialog({ open: true, skill: row })}
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
    [router, canEditSkill, canToggleSkillStatus],
  );

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Skills</Typography>
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
              <SkillsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Skills
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Manage Skill Taxonomy Used Across Job Openings and Interviews.
              </Typography>
            </Box>
          </Stack>

          {canCreateSkill ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.SKILLS}/new`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 800 }}
            >
              Create Skill
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
            label="Search by name"
            placeholder="e.g. TypeScript"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: nameInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setNameInput("");
                        setName("");
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
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
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
            {SKILL_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {SKILL_CATEGORY_LABELS[c]}
              </MenuItem>
            ))}
          </TextField>

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
          rows={skills}
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.skill?.is_active ? "Deactivate Skill" : "Activate Skill"}
        description={
          confirmDialog.skill?.is_active
            ? `Are you sure you want to deactivate ${confirmDialog.skill.name}?`
            : `Are you sure you want to activate ${confirmDialog.skill?.name}?`
        }
        confirmLabel={confirmDialog.skill?.is_active ? "Deactivate" : "Activate"}
        confirmColor={confirmDialog.skill?.is_active ? "error" : "success"}
        loading={toggleStatus.isPending}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmDialog({ open: false, skill: null })}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
