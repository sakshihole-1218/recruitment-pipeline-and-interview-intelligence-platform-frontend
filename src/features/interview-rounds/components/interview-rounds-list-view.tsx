"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Add as AddIcon,
  EditOutlined as EditIcon,
  NavigateNext as NavigateNextIcon,
  PlaylistAddCheck as RoundsIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import { ROUTES } from "@/constants/routes";
import { AppSnackbar } from "@/components/app-snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useJobOpenings } from "@/features/job-openings/hooks/use-job-openings";
import { useInterviewRoundsByJobOpening } from "@/features/interview-rounds/hooks/use-interview-rounds";
import { useInterviewRoundsPermissions } from "@/features/interview-rounds/hooks/use-interview-rounds-permissions";
import type { InterviewRoundResponse } from "@/features/interview-rounds/types/interview-rounds.types";
import { InterviewRoundTypeChip } from "@/features/interview-rounds/components/interview-round-type-chip";

function unwrapListData<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

export function InterviewRoundsListView() {
  const router = useRouter();
  const { snackbar, closeSnackbar } = useSnackbar();

  const { canCreateInterviewRound, canEditInterviewRound } =
    useInterviewRoundsPermissions();

  const [jobOpeningId, setJobOpeningId] = useState<string>("");

  const jobOpeningsQuery = useJobOpenings({
    page: 1,
    limit: 100,
    sort_by: "created_at",
    sort_order: "DESC",
  });

  const jobOpenings = unwrapListData<{
    id: string;
    title: string;
    code: string;
    is_active: boolean;
  }>(jobOpeningsQuery.data);

  const roundsQuery = useInterviewRoundsByJobOpening({
    job_opening_id: jobOpeningId,
  });
  const rounds = useMemo(() => roundsQuery.data?.data ?? [], [roundsQuery.data]);

  const actionIconButtonSx = useMemo(
    () => ({
      color: "primary.main",
      "&:hover": {
        bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.08),
      },
    }),
    [],
  );

  const editIconButtonSx = useMemo(
    () => ({
      color: "text.secondary",
      "&:hover": {
        bgcolor: (t: Theme) => alpha(t.palette.text.primary, 0.06),
      },
    }),
    [],
  );

  const columns = useMemo<GridColDef<InterviewRoundResponse>[]>(
    () => [
      {
        field: "sequence_number",
        headerName: "Seq",
        flex: 0.35,
        minWidth: 84,
        headerAlign: "center",
        align: "center",
        sortable: true,
      },
      {
        field: "round_name",
        headerName: "Round",
        flex: 1.6,
        minWidth: 240,
      },
      {
        field: "round_type",
        headerName: "Type",
        flex: 1,
        minWidth: 160,
        renderCell: (p) => <InterviewRoundTypeChip type={p.row.round_type} />,
      },
      {
        field: "is_mandatory",
        headerName: "Mandatory",
        flex: 0.9,
        minWidth: 140,
        renderCell: (p) => (p.row.is_mandatory ? "Yes" : "No"),
      },
      {
        field: "max_score",
        headerName: "Max Score",
        flex: 0.8,
        minWidth: 130,
        valueGetter: (_v, row) => row.max_score ?? "—",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack
            direction="row"
            spacing={0.25}
            useFlexGap
            sx={{ justifyContent: "center", alignItems: "center", py: 0.25, flexWrap: "wrap", width: "100%" }}
          >
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => {
                  if (!jobOpeningId) return;
                  router.push(`${ROUTES.INTERVIEW_ROUNDS}/${p.row.id}?job_opening_id=${jobOpeningId}`);
                }}
                sx={actionIconButtonSx}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canEditInterviewRound ? (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (!jobOpeningId) return;
                    router.push(`${ROUTES.INTERVIEW_ROUNDS}/${p.row.id}/edit?job_opening_id=${jobOpeningId}`);
                  }}
                  sx={editIconButtonSx}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [router, jobOpeningId, canEditInterviewRound, actionIconButtonSx, editIconButtonSx],
  );

  const showRounds = !!jobOpeningId;
  const roundsErrorMessage = roundsQuery.isError
    ? getApiErrorMessage(roundsQuery.error)
    : "";
  const jobOpeningsErrorMessage = jobOpeningsQuery.isError
    ? getApiErrorMessage(jobOpeningsQuery.error)
    : "";

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component={NextLink}
          href={ROUTES.DASHBOARD}
          underline="hover"
          color="inherit"
        >
          Dashboard
        </Link>
        <Typography color="text.primary">Interview Rounds</Typography>
      </Breadcrumbs>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 3,
          mb: 3,
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
              <RoundsIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Interview Rounds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Configure round templates per job opening.
              </Typography>
            </Box>
          </Stack>

          {canCreateInterviewRound ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`${ROUTES.INTERVIEW_ROUNDS}/create`)}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 800 }}
            >
              Create Round
            </Button>
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
          <TextField
            select
            size="small"
            label="Job Opening"
            value={jobOpeningId}
            onChange={(e) => setJobOpeningId(e.target.value)}
            sx={{ flex: 1, maxWidth: { md: 420 } }}
            disabled={jobOpeningsQuery.isLoading}
            helperText={
              jobOpeningsQuery.isError
                ? `Unable to load job openings: ${jobOpeningsErrorMessage}`
                : "Select a job opening to view its rounds"
            }
            slotProps={{
              input: {
                sx: { borderRadius: 2, bgcolor: "background.paper" },
              },
            }}
          >
            <MenuItem value="">
              <em>Select...</em>
            </MenuItem>
            {jobOpeningsQuery.isLoading ? (
              <MenuItem value="" disabled>
                Loading job openings...
              </MenuItem>
            ) : null}
            {jobOpenings.map((j) => (
              <MenuItem key={j.id} value={j.id}>
                {j.title} ({j.code})
              </MenuItem>
            ))}
          </TextField>

          {showRounds ? (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {roundsQuery.isLoading ? "Loading rounds..." : `${rounds.length} round(s)`}
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          minHeight: showRounds ? 400 : 0,
        }}
      >
        {showRounds ? (
          <DataGrid
            rows={rounds}
            columns={columns}
            getRowId={(r) => r.id}
            loading={roundsQuery.isLoading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
              sorting: { sortModel: [{ field: "sequence_number", sort: "asc" }] },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 800 }}>
                    {roundsQuery.isError ? "Failed to load rounds" : "No rounds found"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {roundsQuery.isError
                      ? roundsErrorMessage
                      : "Create rounds to build an interview flow for this job opening."}
                  </Typography>
                </Box>
              ),
              noResultsOverlay: () => (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 800 }}>No matching rounds</Typography>
                </Box>
              ),
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
        ) : (
          <Box sx={{ p: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography sx={{ fontWeight: 900 }}>Pick a job opening</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Interview rounds are defined per job opening. Pick a job opening to view and manage its rounds.
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
