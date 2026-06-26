"use client";

import NextLink from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
  Chip,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRenderCellParams,
  type GridSortModel,
} from "@mui/x-data-grid";
import {
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  GavelOutlined as DecisionIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import {
  DECISION_STATUS_LABELS,
  type DecisionResponse,
} from "@/features/decisions/types/decision.types";

export interface DecisionTableRow extends DecisionResponse {
  candidate_name: string;
  job_opening_title: string;
  application_stage: string;
  overall_ai_score: string;
  human_recommendation: string;
  decision_by_name: string;
}

declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function DecisionStatusChip({
  status,
}: {
  status: DecisionResponse["decision_status"];
}) {
  const color =
    status === "SELECTED" || status === "HIRED"
      ? "success"
      : status === "REJECTED"
        ? "error"
        : status === "HOLD"
          ? "warning"
          : "primary";

  return (
    <Chip
      label={DECISION_STATUS_LABELS[status]}
      color={color}
      variant={status === "HOLD" ? "outlined" : "filled"}
      size="small"
      sx={{ fontWeight: 800 }}
    />
  );
}

function NoRowsOverlay({
  isError,
  errorMessage,
}: {
  isError?: boolean;
  errorMessage?: string;
}) {
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
          bgcolor: (theme) =>
            isError
              ? alpha(theme.palette.error.main, 0.1)
              : alpha(theme.palette.primary.main, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DecisionIcon
          sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }}
        />
      </Box>

      <Typography
        variant="body1"
        sx={{ fontWeight: 700 }}
        color={isError ? "error" : "text.primary"}
      >
        {isError ? "Failed to load decisions" : "No decisions found"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
        {isError ? errorMessage : "Try adjusting your filters or selecting a different date range."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function DecisionTable({
  rows,
  loading,
  rowCount,
  isError,
  errorMessage,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  canEdit,
  canDelete,
  onDelete,
}: {
  rows: DecisionTableRow[];
  loading: boolean;
  rowCount: number;
  isError: boolean;
  errorMessage: string;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (row: DecisionTableRow) => void;
}) {
  const router = useRouter();
  const isEmptyState = !loading && !isError && rows.length === 0;

  const columns = useMemo<GridColDef<DecisionTableRow>[]>(
    () => [
      {
        field: "candidate_name",
        headerName: "Candidate",
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => (
          <Link
            component={NextLink}
            href={`${ROUTES.DECISIONS}/${params.row.id}`}
            underline="hover"
            sx={{ fontWeight: 900 }}
          >
            {params.row.candidate_name}
          </Link>
        ),
      },
      {
        field: "job_opening_title",
        headerName: "Job Opening",
        flex: 1.35,
        minWidth: 260,
        sortable: false,
      },
      {
        field: "overall_ai_score",
        headerName: "Overall AI Score",
        minWidth: 140,
        sortable: false,
      },
      {
        field: "human_recommendation",
        headerName: "Human Recommendation",
        minWidth: 170,
        sortable: false,
      },
      {
        field: "decision_status",
        headerName: "Final Decision",
        minWidth: 160,
        sortable: true,
        renderCell: (params: GridRenderCellParams<DecisionTableRow>) => (
          <DecisionStatusChip status={params.row.decision_status} />
        ),
      },
      {
        field: "decision_at",
        headerName: "Decision Date",
        minWidth: 130,
        sortable: true,
        valueGetter: (_value, row) => row.decision_at,
        renderCell: (params) => formatDate(params.row.decision_at),
      },
      {
        field: "decision_by_name",
        headerName: "Decision By",
        minWidth: 170,
        sortable: false,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canDelete ? 150 : 110,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => router.push(`${ROUTES.DECISIONS}/${params.row.id}`)}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canEdit ? (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    router.push(`${ROUTES.DECISIONS}/${params.row.id}/edit`)
                  }
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}

            {canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => onDelete(params.row)}
                  sx={{
                    color: "error.main",
                    "&:hover": {
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, router],
  );

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      rowCount={rowCount}
      autoHeight={isEmptyState}
      disableRowSelectionOnClick
      paginationMode="server"
      sortingMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      getRowHeight={() => "auto"}
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
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          borderBottom: "1px solid",
          borderColor: "divider",
        },
        "& .MuiDataGrid-columnHeader": {
          fontWeight: 800,
          fontSize: "0.75rem",
          letterSpacing: "0.2px",
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
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
      }}
    />
  );
}
