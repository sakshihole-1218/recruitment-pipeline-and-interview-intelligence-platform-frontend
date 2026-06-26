"use client";

import NextLink from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  alpha,
  Box,
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
  CancelOutlined as CancelIcon,
  EditOutlined as EditIcon,
  LocalOfferOutlined as OfferIcon,
  ScheduleOutlined as ExpireIcon,
  SendOutlined as SendIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { OfferStatusChip } from "@/features/offers/components/OfferStatusChip";
import type { OfferResponse } from "@/features/offers/types/offer.types";

export interface OfferTableRow extends OfferResponse {
  candidate_name: string;
  job_opening_title: string;
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

function formatMoney(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return parsed.toLocaleString();
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
        <OfferIcon
          sx={{ color: isError ? "error.main" : "primary.main", fontSize: 24 }}
        />
      </Box>

      <Typography
        variant="body1"
        sx={{ fontWeight: 700 }}
        color={isError ? "error" : "text.primary"}
      >
        {isError ? "Failed to load offers" : "No offers found"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
        {isError ? errorMessage : "Try adjusting your search or filters."}
      </Typography>
    </Box>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function OfferTable({
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
  canSend,
  canCancel,
  canExpire,
  onSend,
  onCancelOffer,
  onExpire,
}: {
  rows: OfferTableRow[];
  loading: boolean;
  rowCount: number;
  isError: boolean;
  errorMessage: string;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  canEdit: boolean;
  canSend: boolean;
  canCancel: boolean;
  canExpire: boolean;
  onSend: (row: OfferTableRow) => void;
  onCancelOffer: (row: OfferTableRow) => void;
  onExpire: (row: OfferTableRow) => void;
}) {
  const router = useRouter();
  const isEmptyState = !loading && !isError && rows.length === 0;

  const columns = useMemo<GridColDef<OfferTableRow>[]>(
    () => [
      {
        field: "candidate_name",
        headerName: "Candidate",
        flex: 1.15,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => (
          <Link
            component={NextLink}
            href={`${ROUTES.OFFERS}/${params.row.id}`}
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
        flex: 1.3,
        minWidth: 240,
        sortable: false,
      },
      {
        field: "offered_role_title",
        headerName: "Offered Role",
        flex: 1,
        minWidth: 200,
        sortable: false,
      },
      {
        field: "offered_ctc",
        headerName: "Offered CTC",
        minWidth: 140,
        sortable: false,
        renderCell: (params) => formatMoney(params.row.offered_ctc),
      },
      {
        field: "currency_code",
        headerName: "Currency",
        minWidth: 110,
        sortable: false,
        renderCell: (params) => params.row.currency_code ?? "—",
      },
      {
        field: "expected_joining_date",
        headerName: "Expected Joining Date",
        minWidth: 180,
        sortable: true,
        valueGetter: (_value, row) => row.expected_joining_date,
        renderCell: (params) => formatDate(params.row.expected_joining_date),
      },
      {
        field: "offer_status",
        headerName: "Offer Status",
        minWidth: 150,
        sortable: true,
        renderCell: (params: GridRenderCellParams<OfferTableRow>) => (
          <OfferStatusChip status={params.row.offer_status} />
        ),
      },
      {
        field: "offered_at",
        headerName: "Offered Date",
        minWidth: 140,
        sortable: true,
        valueGetter: (_value, row) => row.offered_at,
        renderCell: (params) => formatDate(params.row.offered_at),
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 180,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const isDraft = params.row.offer_status === "DRAFT";
          const isSent = params.row.offer_status === "SENT";

          return (
            <Stack direction="row" spacing={0.25}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => router.push(`${ROUTES.OFFERS}/${params.row.id}`)}
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

              {canEdit && isDraft ? (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => router.push(`${ROUTES.OFFERS}/${params.row.id}/edit`)}
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

              {canSend && isDraft ? (
                <Tooltip title="Send">
                  <IconButton
                    size="small"
                    onClick={() => onSend(params.row)}
                    sx={{
                      color: "info.main",
                      "&:hover": {
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}

              {canCancel && (isDraft || isSent) ? (
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    onClick={() => onCancelOffer(params.row)}
                    sx={{
                      color: "error.main",
                      "&:hover": {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}

              {canExpire && isSent ? (
                <Tooltip title="Expire">
                  <IconButton
                    size="small"
                    onClick={() => onExpire(params.row)}
                    sx={{
                      color: "warning.main",
                      "&:hover": {
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                      },
                    }}
                  >
                    <ExpireIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          );
        },
      },
    ],
    [canCancel, canEdit, canExpire, canSend, onCancelOffer, onExpire, onSend, router],
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
