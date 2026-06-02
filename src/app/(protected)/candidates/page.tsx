"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
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
import type { SxProps, Theme } from "@mui/material/styles";
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
  Group as CandidatesIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import NextLink from "next/link";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import {
  useCandidates,
  useUpdateCandidate,
} from "@/features/candidates/hooks/use-candidates";
import { useCandidatesPermissions } from "@/features/candidates/hooks/use-candidates-permissions";
import {
  CANDIDATE_SOURCE_TYPES,
  CANDIDATE_SOURCE_TYPE_LABELS,
  type CandidateResponse,
  type CandidateSourceType,
} from "@/features/candidates/types/candidates.types";
import { CandidateStatusChip } from "@/features/candidates/components/candidate-status-chip";
import { ConfirmDialog } from "@/features/candidates/components/confirm-dialog";
import { useSkills } from "@/features/skills/hooks/use-skills";
import type { SkillResponse } from "@/features/skills/types/skills.types";

declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }

  interface NoResultsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
}

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

type OverlaySlotProps = HTMLAttributes<HTMLDivElement> &
  { sx?: SxProps<Theme> } & {
    isError: boolean;
    errorMessage: string;
  };

function NoRowsOverlay({ isError, errorMessage, sx: _sx, ...divProps }: OverlaySlotProps) {
  return (
    <Box
      {...divProps}
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
            alpha(t.palette[isError ? "error" : "primary"].main, isError ? 0.1 : 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        }}
      >
        <CandidatesIcon sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }} />
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 800 }} color={isError ? "error" : "text.primary"}>
        {isError ? "Failed to load candidates" : "No candidates found"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, whiteSpace: "normal" }}>
        {isError
          ? errorMessage
          : "Try adjusting filters like name, status or location."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

export default function CandidatesPage() {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { canCreateCandidate, canEditCandidate, canToggleCandidateStatus } =
    useCandidatesPermissions();

  const [firstNameInput, setFirstNameInput] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");

  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");

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

  const handleApplyFilters = useCallback(() => {
    setFirstName(firstNameInput.trim());
    setLastName(lastNameInput.trim());
    setEmail(emailInput.trim());
    setLocation(locationInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [
    firstNameInput,
    lastNameInput,
    emailInput,
    locationInput,
  ]);

  const handleClearFilters = useCallback(() => {
    setFirstNameInput("");
    setFirstName("");
    setLastNameInput("");
    setLastName("");
    setEmailInput("");
    setEmail("");
    setLocationInput("");
    setLocation("");
    setSourceTypeFilter("all");
    setSkillFilter("all");
    setIsActiveFilter("all");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const skillsQuery = useSkills({
    page: 1,
    limit: 100,
    is_active: true,
    sort_by: "name",
    sort_order: "ASC",
  });
  const skills = unwrapListData<SkillResponse>(skillsQuery.data);

  const queryParams = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(email ? { email } : {}),
      ...(location ? { current_location: location } : {}),
      ...(sourceTypeFilter !== "all"
        ? { source_type: sourceTypeFilter as CandidateSourceType }
        : {}),
      ...(isActiveFilter !== "all" ? { is_active: isActiveFilter === "true" } : {}),
      ...(skillFilter !== "all" ? { skill_id: skillFilter } : {}),
      ...(sortModel[0]
        ? {
            sort_by: sortModel[0].field as
              | "created_at"
              | "updated_at"
              | "first_name"
              | "last_name"
              | "email"
              | "current_location"
              | "total_experience_years"
              | "is_active",
            sort_order: (sortModel[0].sort?.toUpperCase() as "ASC" | "DESC") ?? "DESC",
          }
        : {}),
    }),
    [
      paginationModel,
      firstName,
      lastName,
      email,
      location,
      sourceTypeFilter,
      isActiveFilter,
      skillFilter,
      sortModel,
    ],
  );

  const { data, isLoading, isError, error } = useCandidates(queryParams);

  const rows = useMemo(() => {
    if (!data) return [];
    // Offset mode
    if ("pagination" in data) return data.data;
    // Cursor mode
    return data.data?.data ?? [];
  }, [data]);

  const rowCount = useMemo(() => {
    if (!data) return 0;
    if ("pagination" in data) return data.pagination.total_records;
    return data.data?.data?.length ?? 0;
  }, [data]);

  const safePaginationModel = useMemo(() => {
    const pageSize = paginationModel.pageSize;
    const maxPage = rowCount > 0 ? Math.max(0, Math.ceil(rowCount / pageSize) - 1) : 0;
    const page = Math.min(paginationModel.page, maxPage);
    return page === paginationModel.page ? paginationModel : { ...paginationModel, page };
  }, [paginationModel, rowCount]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    candidate: CandidateResponse | null;
  }>({ open: false, candidate: null });

  const pendingCandidateId = confirmDialog.candidate?.id ?? "";
  const toggleStatus = useUpdateCandidate(pendingCandidateId);

  const handleConfirmToggle = useCallback(async () => {
    if (!confirmDialog.candidate) return;
    try {
      const nextActive = !confirmDialog.candidate.is_active;
      const res = await toggleStatus.mutateAsync({ is_active: nextActive });
      showSuccess(res.message || `Candidate ${nextActive ? "activated" : "deactivated"} successfully.`);
      setConfirmDialog({ open: false, candidate: null });
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  }, [confirmDialog.candidate, toggleStatus, showSuccess, showError, setConfirmDialog]);

  const columns = useMemo<GridColDef<CandidateResponse>[]>(
    () => [
      {
        field: "name",
        headerName: "Candidate",
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        valueGetter: (_v, row) => `${row.first_name} ${row.last_name}`,
        renderCell: (params: GridRenderCellParams<CandidateResponse>) => (
          <Stack sx={{ py: 1 }}>
            <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap>
              {params.row.first_name} {params.row.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.current_job_title ?? "—"}
              {params.row.current_company ? ` • ${params.row.current_company}` : ""}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "phone",
        headerName: "Phone",
        minWidth: 160,
        valueGetter: (_v, row) => row.phone ?? "—",
        sortable: false,
      },
      {
        field: "current_location",
        headerName: "Location",
        minWidth: 160,
        valueGetter: (_v, row) => row.current_location ?? "—",
      },
      {
        field: "total_experience_years",
        headerName: "Experience",
        minWidth: 120,
        valueGetter: (_v, row) =>
          row.total_experience_years ? `${row.total_experience_years} yrs` : "—",
      },
      {
        field: "source_type",
        headerName: "Source",
        minWidth: 140,
        valueGetter: (_v, row) =>
          row.source_type ? CANDIDATE_SOURCE_TYPE_LABELS[row.source_type] : "—",
        sortable: false,
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 130,
        renderCell: (params: GridRenderCellParams<CandidateResponse>) => (
          <CandidateStatusChip isActive={params.row.is_active} />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        minWidth: 170,
        renderCell: (params: GridRenderCellParams<CandidateResponse>) => {
          const row = params.row;
          return (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Tooltip title="View">
                <IconButton onClick={() => router.push(`${ROUTES.CANDIDATES}/${row.id}`)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {canEditCandidate ? (
                <Tooltip title="Edit">
                  <IconButton
                    onClick={() => router.push(`${ROUTES.CANDIDATES}/${row.id}/edit`)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}

              {canToggleCandidateStatus ? (
                <Tooltip title={row.is_active ? "Deactivate" : "Activate"}>
                  <span>
                    <Switch
                      checked={row.is_active}
                      onChange={() => setConfirmDialog({ open: true, candidate: row })}
                      color="success"
                      size="small"
                    />
                  </span>
                </Tooltip>
              ) : null}
            </Stack>
          );
        },
      },
    ],
    [router, canEditCandidate, canToggleCandidateStatus, setConfirmDialog],
  );

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    // Avoid scheduling state updates before mount/unmount (DataGrid can emit
    // during init/unmount in some cases).
    if (!isMountedRef.current) return;

    if (sortRafRef.current !== null) {
      cancelAnimationFrame(sortRafRef.current);
      sortRafRef.current = null;
    }

    sortRafRef.current = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      setSortModel(model);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    });
  }, []);

  const isEmptyState = !isLoading && !isError && rows.length === 0;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Candidates</Typography>
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
              <CandidatesIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Candidates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Manage candidate profiles across sourcing, screening and interviews.
              </Typography>
            </Box>
          </Stack>

          {canCreateCandidate ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.CANDIDATES}/new`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
            >
              Create Candidate
            </Button>
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
          <TextField
            size="small"
            label="First name"
            value={firstNameInput}
            onChange={(e) => setFirstNameInput(e.target.value)}
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
                endAdornment: firstNameInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFirstNameInput("");
                        setFirstName("");
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
              maxWidth: { md: 220 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <TextField
            size="small"
            label="Last name"
            value={lastNameInput}
            onChange={(e) => setLastNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            sx={{
              flex: 1,
              maxWidth: { md: 220 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <TextField
            size="small"
            label="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            sx={{
              flex: 1,
              maxWidth: { md: 260 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <TextField
            size="small"
            label="Location"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            sx={{
              flex: 1,
              maxWidth: { md: 220 },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          />

          <TextField
            select
            size="small"
            label="Source"
            value={sourceTypeFilter}
            onChange={(e) => {
              setSourceTypeFilter(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {CANDIDATE_SOURCE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {CANDIDATE_SOURCE_TYPE_LABELS[t]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Skill"
            value={skillFilter}
            onChange={(e) => {
              setSkillFilter(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            disabled={skillsQuery.isLoading || skillsQuery.isError}
            sx={{
              minWidth: 180,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {skills.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
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
              minWidth: 140,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
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
          paginationMode="server"
          sortingMode="server"
          paginationModel={safePaginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          disableRowSelectionOnClick
          getRowHeight={getRowHeight}
          slots={{
            noRowsOverlay: NoRowsOverlay,
            noResultsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            noRowsOverlay: {
              isError,
              errorMessage: getApiErrorMessage(error),
            },
            noResultsOverlay: {
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.candidate?.is_active ? "Deactivate Candidate" : "Activate Candidate"}
        description={
          confirmDialog.candidate
            ? confirmDialog.candidate.is_active
              ? `Are you sure you want to deactivate ${confirmDialog.candidate.first_name} ${confirmDialog.candidate.last_name}?`
              : `Are you sure you want to activate ${confirmDialog.candidate.first_name} ${confirmDialog.candidate.last_name}?`
            : ""
        }
        confirmLabel={confirmDialog.candidate?.is_active ? "Deactivate" : "Activate"}
        confirmColor={confirmDialog.candidate?.is_active ? "error" : "success"}
        loading={toggleStatus.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmDialog({ open: false, candidate: null })}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
