"use client";

import { alpha, Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { SmartToyOutlined as FeedbackIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import type { Theme } from "@mui/material/styles";

import { ROUTES } from "@/constants/routes";
import {
  AI_INTERVIEW_FEEDBACK_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  type FeedbackEnrichedRow,
} from "@/features/feedback/types/feedback.types";

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
        <FeedbackIcon sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }} />
      </Box>

      <Typography variant="body1" sx={{ fontWeight: 700 }} color={isError ? "error" : "text.primary"}>
        {isError ? "Failed to load feedback" : "No feedback found"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, whiteSpace: "normal" }}>
        {isError ? errorMessage : "Try adjusting your filters or generated date range."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const getRowHeight = () => "auto" as const;

export function FeedbackTable({
  rows,
  loading,
  rowCount,
  isError,
  errorMessage,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
}: {
  rows: FeedbackEnrichedRow[];
  loading: boolean;
  rowCount: number;
  isError: boolean;
  errorMessage: string;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
}) {
  const router = useRouter();
  const isEmptyState = !loading && !isError && rows.length === 0;

  const actionIconButtonSx = {
    color: "primary.main",
    "&:hover": {
      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
    },
  };

  const columns: GridColDef<FeedbackEnrichedRow>[] = [
    {
      field: "candidate_name",
      headerName: "Candidate",
      flex: 1.2,
      minWidth: 230,
      sortable: false,
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
      field: "job_title",
      headerName: "Job title",
      flex: 1.2,
      minWidth: 220,
      sortable: false,
    },
    {
      field: "session_code",
      headerName: "Interview / Session",
      flex: 1,
      minWidth: 180,
      sortable: false,
    },
    {
      field: "overall_score",
      headerName: "Overall score",
      minWidth: 130,
      sortable: true,
      renderCell: (
        params: GridRenderCellParams<FeedbackEnrichedRow, number | null>,
      ) => (
        <Typography sx={{ fontWeight: 800 }}>
          {params.value === null || params.value === undefined
            ? "—"
            : params.value.toFixed(1)}
        </Typography>
      ),
    },
    {
      field: "recommendation",
      headerName: "AI recommendation",
      minWidth: 180,
      sortable: true,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color:
              params.row.recommendation === "STRONGLY_SELECT" ||
              params.row.recommendation === "SELECT"
                ? "success.main"
                : params.row.recommendation === "HOLD"
                  ? "warning.main"
                  : "error.main",
          }}
        >
          {params.row.recommendation
            ? RECOMMENDATION_LABELS[params.row.recommendation]
            : "—"}
        </Typography>
      ),
    },
    {
      field: "feedback_status",
      headerName: "Feedback status",
      minWidth: 150,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {AI_INTERVIEW_FEEDBACK_STATUS_LABELS[params.row.feedback_status]}
        </Typography>
      ),
    },
    {
      field: "generated_at",
      headerName: "Generated at",
      minWidth: 180,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.generated_at
            ? new Date(params.row.generated_at).toLocaleString()
            : "—"}
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
      renderCell: (params) => (
        <Tooltip title="View details">
          <IconButton
            size="small"
            onClick={() => router.push(`${ROUTES.FEEDBACK}/${params.row.id}`)}
            sx={actionIconButtonSx}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

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
      getRowHeight={getRowHeight}
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
