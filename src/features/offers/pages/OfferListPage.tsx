"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  alpha,
  Box,
  Breadcrumbs,
  Button,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  LocalOfferOutlined as OfferIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { applicationsService } from "@/features/applications/services/applications.service";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import {
  OfferTable,
  type OfferTableRow,
} from "@/features/offers/components/OfferTable";
import { ConfirmDialog } from "@/features/offers/components/ConfirmDialog";
import {
  useCancelOfferAction,
  useExpireOfferAction,
  useOffers,
  useSendOfferAction,
} from "@/features/offers/hooks/use-offers";
import { useOffersPermissions } from "@/features/offers/hooks/use-offers-permissions";
import {
  OFFER_SORT_FIELDS,
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  type OfferResponse,
  type OfferSortBy,
  type OfferStatus,
} from "@/features/offers/types/offer.types";

function unwrapListRows<T>(data: unknown): T[] {
  if (!data) return [];
  const obj = data as { data?: unknown };

  if (Array.isArray(obj.data)) return obj.data as T[];

  const cursor = obj.data as { data?: T[] } | undefined;
  return cursor?.data ?? [];
}

function normalizeDateForApi(value: string, endOfDay = false) {
  if (!value) return undefined;

  return new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
  ).toISOString();
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

type PendingListAction = {
  type: "send" | "cancel" | "expire";
  row: OfferTableRow;
} | null;

export function OfferListPage() {
  const router = useRouter();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();
  const {
    canCreateOffer,
    canEditOffer,
    canSendOffer,
    canCancelOffer,
    canExpireOffer,
  } = useOffersPermissions();

  const [candidateSearchInput, setCandidateSearchInput] = useState("");
  const [jobOpeningSearchInput, setJobOpeningSearchInput] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [jobOpeningSearch, setJobOpeningSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState<OfferStatus | "all">("all");
  const [joiningFrom, setJoiningFrom] = useState("");
  const [joiningTo, setJoiningTo] = useState("");
  const [offeredFrom, setOfferedFrom] = useState("");
  const [offeredTo, setOfferedTo] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);
  const [pendingAction, setPendingAction] = useState<PendingListAction>(null);

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

  const sortBy = sortModel[0]?.field as OfferSortBy | undefined;
  const sortOrder = sortModel[0]?.sort as "asc" | "desc" | undefined;

  const offersQuery = useOffers({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...(offerStatus !== "all" ? { offer_status: offerStatus } : {}),
    ...(joiningFrom
      ? { expected_joining_from: normalizeDateForApi(joiningFrom) }
      : {}),
    ...(joiningTo
      ? { expected_joining_to: normalizeDateForApi(joiningTo, true) }
      : {}),
    ...(offeredFrom ? { offered_from: normalizeDateForApi(offeredFrom) } : {}),
    ...(offeredTo ? { offered_to: normalizeDateForApi(offeredTo, true) } : {}),
    ...(sortBy && (OFFER_SORT_FIELDS as readonly string[]).includes(sortBy)
      ? { sort_by: sortBy, sort_order: sortOrder ?? "desc" }
      : {}),
  });

  const offerRows = useMemo(
    () => unwrapListRows<OfferResponse>(offersQuery.data),
    [offersQuery.data],
  );

  const applicationIds = useMemo(
    () => Array.from(new Set(offerRows.map((row) => row.application_id))),
    [offerRows],
  );

  const applicationQueries = useQueries({
    queries: applicationIds.map((id) => ({
      queryKey: ["applications", "detail", id],
      queryFn: () => applicationsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const applicationsById = useMemo(
    () =>
      new Map(
        applicationQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((application) => [application.id, application]),
      ),
    [applicationQueries],
  );

  const candidateIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicationQueries
            .map((query) => query.data?.data?.candidate_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [applicationQueries],
  );

  const jobOpeningIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicationQueries
            .map((query) => query.data?.data?.job_opening_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [applicationQueries],
  );

  const candidateQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ["candidates", "detail", id],
      queryFn: () => candidatesService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const jobOpeningQueries = useQueries({
    queries: jobOpeningIds.map((id) => ({
      queryKey: ["job-openings", "detail", id],
      queryFn: () => jobOpeningsService.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const candidatesById = useMemo(
    () =>
      new Map(
        candidateQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((candidate) => [candidate.id, candidate]),
      ),
    [candidateQueries],
  );

  const jobOpeningsById = useMemo(
    () =>
      new Map(
        jobOpeningQueries
          .map((query) => query.data?.data)
          .filter((value): value is NonNullable<typeof value> => !!value)
          .map((opening) => [opening.id, opening]),
      ),
    [jobOpeningQueries],
  );

  const clientCandidateSearch = candidateSearch.trim().toLowerCase();
  const clientJobOpeningSearch = jobOpeningSearch.trim().toLowerCase();

  const enrichedRows = useMemo<OfferTableRow[]>(() => {
    return offerRows.filter(Boolean).map((row) => {
      const application = applicationsById.get(row.application_id);
      const candidate = application
        ? candidatesById.get(application.candidate_id)
        : undefined;
      const jobOpening = application
        ? jobOpeningsById.get(application.job_opening_id)
        : undefined;

      return {
        ...row,
        candidate_name: formatName(candidate?.first_name, candidate?.last_name),
        job_opening_title: jobOpening?.title ?? "Unknown job opening",
      };
    }).filter((row) => {
      if (
        clientCandidateSearch &&
        !row.candidate_name.toLowerCase().includes(clientCandidateSearch)
      ) {
        return false;
      }

      if (
        clientJobOpeningSearch &&
        !row.job_opening_title.toLowerCase().includes(clientJobOpeningSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [
    applicationsById,
    candidatesById,
    clientCandidateSearch,
    clientJobOpeningSearch,
    jobOpeningsById,
    offerRows,
  ]);

  const rowCount = useMemo(() => {
    if (candidateSearch || jobOpeningSearch) {
      return enrichedRows.length;
    }

    if (!offersQuery.data) return 0;

    const offset = offersQuery.data as { pagination?: { total_records?: number } };
    return offset.pagination?.total_records ?? enrichedRows.length;
  }, [candidateSearch, enrichedRows.length, jobOpeningSearch, offersQuery.data]);

  const sendOfferMutation = useSendOfferAction();
  const cancelOfferMutation = useCancelOfferAction();
  const expireOfferMutation = useExpireOfferAction();

  const errorMessage = offersQuery.isError
    ? getApiErrorMessage(offersQuery.error)
    : "";

  const isMutating =
    sendOfferMutation.isPending ||
    cancelOfferMutation.isPending ||
    expireOfferMutation.isPending;

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
    setCandidateSearch(candidateSearchInput.trim());
    setJobOpeningSearch(jobOpeningSearchInput.trim());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setCandidateSearchInput("");
    setJobOpeningSearchInput("");
    setCandidateSearch("");
    setJobOpeningSearch("");
    setOfferStatus("all");
    setJoiningFrom("");
    setJoiningTo("");
    setOfferedFrom("");
    setOfferedTo("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "send") {
        const response = await sendOfferMutation.mutateAsync(pendingAction.row.id);
        showSuccess(response.message || "Offer sent successfully");
      }

      if (pendingAction.type === "cancel") {
        const response = await cancelOfferMutation.mutateAsync(pendingAction.row.id);
        showSuccess(response.message || "Offer cancelled successfully");
      }

      if (pendingAction.type === "expire") {
        const response = await expireOfferMutation.mutateAsync(pendingAction.row.id);
        showSuccess(response.message || "Offer expired successfully");
      }
    } catch (error) {
      showError(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const confirmMeta = pendingAction
    ? pendingAction.type === "send"
      ? {
          title: "Send Offer",
          description: `Send the offer for ${pendingAction.row.candidate_name}?`,
          confirmLabel: "Send",
          confirmColor: "info" as const,
        }
      : pendingAction.type === "cancel"
        ? {
            title: "Cancel Offer",
            description: `Cancel the offer for ${pendingAction.row.candidate_name}?`,
            confirmLabel: "Cancel Offer",
            confirmColor: "error" as const,
          }
        : {
            title: "Expire Offer",
            description: `Mark the offer for ${pendingAction.row.candidate_name} as expired?`,
            confirmLabel: "Expire Offer",
            confirmColor: "warning" as const,
          }
    : null;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DASHBOARD} underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Offers</Typography>
      </Breadcrumbs>

      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 3,
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
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
                <OfferIcon sx={{ color: "white", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Offers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                  Manage compensation proposals and track final candidate outcomes.
                </Typography>
              </Box>
            </Stack>

            {canCreateOffer ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push(`${ROUTES.OFFERS}/create`)}
                sx={{ borderRadius: 2, px: 2.5, fontWeight: 900 }}
              >
                Create Offer
              </Button>
            ) : null}
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
          >
            <TextField
              size="small"
              label="Candidate"
              value={candidateSearchInput}
              onChange={(event) => setCandidateSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleApplyFilters();
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: { xs: "100%", md: 220 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <TextField
              size="small"
              label="Job Opening"
              value={jobOpeningSearchInput}
              onChange={(event) => setJobOpeningSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleApplyFilters();
              }}
              sx={{
                minWidth: { xs: "100%", md: 220 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <TextField
              select
              size="small"
              label="Offer Status"
              value={offerStatus}
              onChange={(event) => {
                setOfferStatus(event.target.value as OfferStatus | "all");
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              {OFFER_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {OFFER_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Joining From"
              type="date"
              value={joiningFrom}
              onChange={(event) => {
                setJoiningFrom(event.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <TextField
              size="small"
              label="Joining To"
              type="date"
              value={joiningTo}
              onChange={(event) => {
                setJoiningTo(event.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <TextField
              size="small"
              label="Offered From"
              type="date"
              value={offeredFrom}
              onChange={(event) => {
                setOfferedFrom(event.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <TextField
              size="small"
              label="Offered To"
              type="date"
              value={offeredTo}
              onChange={(event) => {
                setOfferedTo(event.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.paper",
                },
              }}
            />

            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilters}
              sx={{ height: 40, px: 2.5, borderRadius: 2, fontWeight: 800 }}
            >
              Apply
            </Button>

            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearIcon fontSize="small" />}
              sx={{ height: 40, borderRadius: 2, fontWeight: 800 }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>
        {(sendOfferMutation.isError ||
          cancelOfferMutation.isError ||
          expireOfferMutation.isError) ? (
          <Alert severity="error">
            {getApiErrorMessage(
              sendOfferMutation.error ??
                cancelOfferMutation.error ??
                expireOfferMutation.error,
            )}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            minHeight: 400,
          }}
        >
          <OfferTable
            rows={enrichedRows}
            loading={
              offersQuery.isLoading ||
              isMutating ||
              applicationQueries.some((query) => query.isLoading)
            }
            rowCount={rowCount}
            isError={offersQuery.isError}
            errorMessage={errorMessage}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            canEdit={canEditOffer}
            canSend={canSendOffer}
            canCancel={canCancelOffer}
            canExpire={canExpireOffer}
            onSend={(row) => setPendingAction({ type: "send", row })}
            onCancelOffer={(row) => setPendingAction({ type: "cancel", row })}
            onExpire={(row) => setPendingAction({ type: "expire", row })}
          />
        </Paper>
      </Stack>

      {confirmMeta ? (
        <ConfirmDialog
          open={!!pendingAction}
          title={confirmMeta.title}
          description={confirmMeta.description}
          confirmLabel={confirmMeta.confirmLabel}
          confirmColor={confirmMeta.confirmColor}
          loading={isMutating}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
