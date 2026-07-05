"use client";

import { alpha, Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import {
  Download as DownloadIcon,
  Refresh as ReanalyzeIcon,
  Visibility as ViewIcon,
  Description as ResumeIcon,
} from "@mui/icons-material";
import type { Theme } from "@mui/material/styles";

import {
  RESUME_ROW_STATUS_LABELS,
  type ResumeListRow,
} from "@/features/resumes/types/resume.types";

declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    isError: boolean;
    errorMessage: string;
  }
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
          mb: 0.5,
        }}
      >
        <ResumeIcon sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }} />
      </Box>

      <Typography variant="body1" sx={{ fontWeight: 700 }} color={isError ? "error" : "text.primary"}>
        {isError ? "Failed to load resumes" : "No resumes found"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, whiteSpace: "normal" }}>
        {isError ? errorMessage : "Try adjusting your filters or upload a resume to get started."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatFitScore(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}`;
}

export function ResumeTable({
  rows,
  loading,
  isError,
  errorMessage,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  onView,
  onDownload,
  onReanalyze,
  reanalyzingAnalysisId,
}: {
  rows: ResumeListRow[];
  loading: boolean;
  isError: boolean;
  errorMessage: string;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  onView: (row: ResumeListRow) => void;
  onDownload: (row: ResumeListRow) => void;
  onReanalyze: (row: ResumeListRow) => void;
  reanalyzingAnalysisId?: string | null;
}) {
  const isEmptyState = !loading && !isError && rows.length === 0;

  const actionIconButtonSx = {
    color: "primary.main",
    "&:hover": {
      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
    },
  };

  const columns: GridColDef<ResumeListRow>[] = [
    {
      field: "candidate_name",
      headerName: "Candidate Name",
      flex: 1.2,
      minWidth: 220,
      renderCell: (params) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900 }} noWrap>
            {params.row.candidate_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.candidate_email || "—"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "job_applied",
      headerName: "Job Applied",
      flex: 1.2,
      minWidth: 220,
    },
    {
      field: "resume_file_name",
      headerName: "Resume File Name",
      flex: 1.3,
      minWidth: 240,
    },
    {
      field: "upload_date",
      headerName: "Upload Date",
      minWidth: 190,
      valueFormatter: (_, row) => formatDateTime(row.upload_date),
    },
    {
      field: "analysis_status",
      headerName: "AI Analysis Status",
      minWidth: 170,
      valueFormatter: (value) =>
        RESUME_ROW_STATUS_LABELS[value as keyof typeof RESUME_ROW_STATUS_LABELS],
    },
    {
      field: "ai_fit_score",
      headerName: "AI Fit Score",
      minWidth: 130,
      valueFormatter: (value) => formatFitScore(value as number | null),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => onView(params.row)} sx={actionIconButtonSx}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <span>
              <IconButton
                size="small"
                onClick={() => onDownload(params.row)}
                sx={actionIconButtonSx}
                disabled={!params.row.resume_file_url}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Re-analyze">
            <span>
              <IconButton
                size="small"
                onClick={() => onReanalyze(params.row)}
                sx={actionIconButtonSx}
                disabled={
                  !params.row.analysis_id ||
                  !params.row.candidate_document_id ||
                  reanalyzingAnalysisId === params.row.analysis_id
                }
              >
                <ReanalyzeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      autoHeight={isEmptyState}
      disableRowSelectionOnClick
      pagination
      paginationMode="client"
      sortingMode="client"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
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
