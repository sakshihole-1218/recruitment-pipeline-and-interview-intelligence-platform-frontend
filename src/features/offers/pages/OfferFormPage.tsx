"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LocalOfferOutlined as OfferIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { applicationsService } from "@/features/applications/services/applications.service";
import { useApplication } from "@/features/applications/hooks/use-applications";
import type { ApplicationResponse } from "@/features/applications/types/applications.types";
import { candidatesService } from "@/features/candidates/services/candidates.service";
import type { CandidateResponse } from "@/features/candidates/types/candidates.types";
import { decisionService } from "@/features/decisions/services/decision.service";
import type {
  DecisionResponse,
  DecisionStatus,
} from "@/features/decisions/types/decision.types";
import { jobOpeningsService } from "@/features/job-openings/services/job-openings.service";
import type { JobOpeningResponse } from "@/features/job-openings/types/job-openings.types";
import { ConfirmDialog } from "@/features/offers/components/ConfirmDialog";
import { OfferForm } from "@/features/offers/components/OfferForm";
import {
  useCreateOffer,
  useOffer,
  useSendOfferAction,
  useUpdateOffer,
} from "@/features/offers/hooks/use-offers";
import type { OfferFormValues } from "@/features/offers/types/offer.types";

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toApiDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function unwrapDecisionRows(data: unknown): DecisionResponse[] {
  if (!data) return [];
  const response = data as { data?: unknown };

  if (Array.isArray(response.data)) return response.data as DecisionResponse[];

  const cursor = response.data as { data?: DecisionResponse[] } | undefined;
  return cursor?.data ?? [];
}

function buildPrerequisiteWarning(
  application: ApplicationResponse | undefined,
  decision: DecisionResponse | null | undefined,
) {
  const warnings: string[] = [];

  if (!decision) {
    warnings.push("A final decision is required before creating an offer.");
  } else {
    const allowedStatuses = new Set<DecisionStatus>([
      "SELECTED",
      "OFFER_IN_PROGRESS",
    ]);

    if (!allowedStatuses.has(decision.decision_status)) {
      warnings.push(
        "Offer can only be created when the decision is Selected or Offer in progress.",
      );
    }
  }

  if (application) {
    const allowedStages = new Set(["DECISION", "OFFER"]);
    if (!allowedStages.has(application.current_stage)) {
      warnings.push(
        "Offer can only be created for applications in Decision or Offer stage.",
      );
    }
  }

  return warnings.length > 0 ? warnings.join(" ") : null;
}

interface OfferApplicationOption {
  applicationId: string;
  decisionId: string;
  candidateId: string;
  jobOpeningId: string;
  candidateName: string;
  jobOpeningTitle: string;
  decisionStatus: DecisionStatus;
}

export function OfferFormPage({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();

  const offerQuery = useOffer(mode === "edit" ? id ?? "" : "");
  const existingOffer = offerQuery.data?.data;

  const initialCreateApplicationId =
    searchParams.get("applicationId") ?? searchParams.get("application_id") ?? "";
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    initialCreateApplicationId,
  );
  const [pendingSendValues, setPendingSendValues] = useState<OfferFormValues | null>(null);

  const selectedApplicationRouteId =
    mode === "edit" ? existingOffer?.application_id ?? "" : selectedApplicationId;

  const applicationQuery = useApplication(selectedApplicationRouteId);
  const application = applicationQuery.data?.data;

  const createOfferMutation = useCreateOffer();
  const updateOfferMutation = useUpdateOffer(id ?? "");
  const sendOfferMutation = useSendOfferAction();

  const eligibleDecisionQueries = useQueries({
    queries: [
      {
        queryKey: ["decisions", "offer-create", "SELECTED"],
        queryFn: () =>
          decisionService.list({
            page: 1,
            limit: 100,
            decision_status: "SELECTED",
            sort_by: "decision_at",
            sort_order: "desc",
          }),
      },
      {
        queryKey: ["decisions", "offer-create", "OFFER_IN_PROGRESS"],
        queryFn: () =>
          decisionService.list({
            page: 1,
            limit: 100,
            decision_status: "OFFER_IN_PROGRESS",
            sort_by: "decision_at",
            sort_order: "desc",
          }),
      },
    ],
  });

  const eligibleDecisionRows = useMemo(
    () =>
      eligibleDecisionQueries.flatMap((query) =>
        query.data ? unwrapDecisionRows(query.data) : [],
      ),
    [eligibleDecisionQueries],
  );

  const eligibleApplicationIds = useMemo(
    () =>
      Array.from(new Set(eligibleDecisionRows.map((decision) => decision.application_id))),
    [eligibleDecisionRows],
  );

  const eligibleApplicationQueries = useQueries({
    queries: eligibleApplicationIds.map((applicationId) => ({
      queryKey: ["applications", "detail", applicationId],
      queryFn: () => applicationsService.getById(applicationId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const eligibleApplicationsById = useMemo(
    () =>
      new Map(
        eligibleApplicationQueries
          .map((query) => query.data?.data)
          .filter((value): value is ApplicationResponse => !!value)
          .map((applicationValue) => [applicationValue.id, applicationValue]),
      ),
    [eligibleApplicationQueries],
  );

  const optionCandidateIds = useMemo(
    () =>
      Array.from(
        new Set(
          eligibleApplicationQueries
            .map((query) => query.data?.data?.candidate_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [eligibleApplicationQueries],
  );

  const optionJobOpeningIds = useMemo(
    () =>
      Array.from(
        new Set(
          eligibleApplicationQueries
            .map((query) => query.data?.data?.job_opening_id)
            .filter((value): value is string => !!value),
        ),
      ),
    [eligibleApplicationQueries],
  );

  const optionCandidateQueries = useQueries({
    queries: optionCandidateIds.map((candidateId) => ({
      queryKey: ["candidates", "detail", candidateId],
      queryFn: () => candidatesService.getById(candidateId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const optionJobOpeningQueries = useQueries({
    queries: optionJobOpeningIds.map((jobOpeningId) => ({
      queryKey: ["job-openings", "detail", jobOpeningId],
      queryFn: () => jobOpeningsService.getById(jobOpeningId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const optionCandidatesById = useMemo(
    () =>
      new Map(
        optionCandidateQueries
          .map((query) => query.data?.data)
          .filter((value): value is CandidateResponse => !!value)
          .map((candidateValue) => [candidateValue.id, candidateValue]),
      ),
    [optionCandidateQueries],
  );

  const optionJobOpeningsById = useMemo(
    () =>
      new Map(
        optionJobOpeningQueries
          .map((query) => query.data?.data)
          .filter((value): value is JobOpeningResponse => !!value)
          .map((jobOpeningValue) => [jobOpeningValue.id, jobOpeningValue]),
      ),
    [optionJobOpeningQueries],
  );

  const applicationOptions = useMemo<OfferApplicationOption[]>(() => {
    return eligibleDecisionRows
      .map((decision) => {
        const app = eligibleApplicationsById.get(decision.application_id);
        if (!app) return null;

        const candidate = optionCandidatesById.get(app.candidate_id);
        const jobOpening = optionJobOpeningsById.get(app.job_opening_id);

        if (!candidate || !jobOpening) return null;

        if (!["DECISION", "OFFER"].includes(app.current_stage)) {
          return null;
        }

        return {
          applicationId: app.id,
          decisionId: decision.id,
          candidateId: candidate.id,
          jobOpeningId: jobOpening.id,
          candidateName: formatName(candidate.first_name, candidate.last_name),
          jobOpeningTitle: jobOpening.title,
          decisionStatus: decision.decision_status,
        };
      })
      .filter((value): value is OfferApplicationOption => !!value);
  }, [
    eligibleApplicationsById,
    eligibleDecisionRows,
    optionCandidatesById,
    optionJobOpeningsById,
  ]);

  const selectedOption =
    applicationOptions.find((option) => option.applicationId === selectedApplicationId) ??
    null;

  const decisionForSelectedApplication = useMemo(() => {
    if (mode === "edit") {
      return eligibleDecisionRows.find(
        (decision) => decision.application_id === existingOffer?.application_id,
      ) ?? null;
    }

    return (
      eligibleDecisionRows.find(
        (decision) => decision.application_id === selectedApplicationId,
      ) ?? null
    );
  }, [eligibleDecisionRows, existingOffer?.application_id, mode, selectedApplicationId]);

  const candidateQuery = useQuery({
    queryKey: ["candidates", "detail", application?.candidate_id],
    queryFn: () => candidatesService.getById(application!.candidate_id),
    enabled: !!application?.candidate_id,
    staleTime: 5 * 60 * 1000,
  });

  const jobOpeningQuery = useQuery({
    queryKey: ["job-openings", "detail", application?.job_opening_id],
    queryFn: () => jobOpeningsService.getById(application!.job_opening_id),
    enabled: !!application?.job_opening_id,
    staleTime: 5 * 60 * 1000,
  });

  const candidate = candidateQuery.data?.data;
  const jobOpening = jobOpeningQuery.data?.data;

  const prerequisiteWarning = buildPrerequisiteWarning(
    application,
    decisionForSelectedApplication,
  );

  const applicationLabel = application
    ? `${formatName(candidate?.first_name, candidate?.last_name)} • ${jobOpening?.title ?? application.application_number}`
    : selectedOption
      ? `${selectedOption.candidateName} • ${selectedOption.jobOpeningTitle}`
      : undefined;

  const defaultValues = useMemo<Partial<OfferFormValues>>(() => {
    if (mode === "edit" && existingOffer) {
      return {
        application_id: existingOffer.application_id,
        offered_role_title: existingOffer.offered_role_title,
        offered_ctc: Number(existingOffer.offered_ctc),
        currency_code: existingOffer.currency_code ?? "INR",
        joining_bonus: existingOffer.joining_bonus
          ? Number(existingOffer.joining_bonus)
          : null,
        probation_period_months: existingOffer.probation_period_months ?? null,
        expected_joining_date: toDateInputValue(existingOffer.expected_joining_date),
      };
    }

    return {
      application_id: selectedApplicationId,
      offered_role_title: jobOpening?.title ?? "",
      offered_ctc: 0,
      currency_code: "INR",
      joining_bonus: null,
      probation_period_months: null,
      expected_joining_date: "",
    };
  }, [existingOffer, jobOpening?.title, mode, selectedApplicationId]);

  const isReadOnly = mode === "edit" && existingOffer?.offer_status !== "DRAFT";
  const isSubmitting =
    createOfferMutation.isPending ||
    updateOfferMutation.isPending ||
    sendOfferMutation.isPending;

  const pageError =
    (offerQuery.isError && getApiErrorMessage(offerQuery.error)) ||
    (applicationQuery.isError && getApiErrorMessage(applicationQuery.error)) ||
    "";

  const handlePersistOffer = async (
    values: OfferFormValues,
    action: "save_draft" | "send_offer",
  ) => {
    if (action === "send_offer") {
      setPendingSendValues(values);
      return;
    }

    try {
      const payload = {
        application_id: values.application_id,
        offered_role_title: values.offered_role_title.trim(),
        offered_ctc: values.offered_ctc,
        currency_code: values.currency_code.trim().toUpperCase(),
        joining_bonus: values.joining_bonus ?? undefined,
        probation_period_months: values.probation_period_months ?? undefined,
        expected_joining_date: toApiDate(values.expected_joining_date),
      };

      if (mode === "create") {
        const response = await createOfferMutation.mutateAsync(payload);
        showSuccess(response.message || "Offer created successfully");
        router.push(`${ROUTES.OFFERS}/${response.data.id}`);
        return;
      }

      if (!id) return;

      const response = await updateOfferMutation.mutateAsync({
        offered_role_title: payload.offered_role_title,
        offered_ctc: payload.offered_ctc,
        currency_code: payload.currency_code,
        joining_bonus: payload.joining_bonus,
        probation_period_months: payload.probation_period_months,
        expected_joining_date: payload.expected_joining_date,
      });
      showSuccess(response.message || "Offer updated successfully");
      router.push(`${ROUTES.OFFERS}/${id}`);
    } catch (error) {
      showError(getApiErrorMessage(error));
    }
  };

  const handleConfirmSend = async () => {
    if (!pendingSendValues) return;

    try {
      const payload = {
        application_id: pendingSendValues.application_id,
        offered_role_title: pendingSendValues.offered_role_title.trim(),
        offered_ctc: pendingSendValues.offered_ctc,
        currency_code: pendingSendValues.currency_code.trim().toUpperCase(),
        joining_bonus: pendingSendValues.joining_bonus ?? undefined,
        probation_period_months: pendingSendValues.probation_period_months ?? undefined,
        expected_joining_date: toApiDate(pendingSendValues.expected_joining_date),
      };

      let offerId = id ?? "";

      if (mode === "create") {
        const created = await createOfferMutation.mutateAsync(payload);
        offerId = created.data.id;
      } else if (id) {
        await updateOfferMutation.mutateAsync({
          offered_role_title: payload.offered_role_title,
          offered_ctc: payload.offered_ctc,
          currency_code: payload.currency_code,
          joining_bonus: payload.joining_bonus,
          probation_period_months: payload.probation_period_months,
          expected_joining_date: payload.expected_joining_date,
        });
        offerId = id;
      }

      const sent = await sendOfferMutation.mutateAsync(offerId);
      showSuccess(sent.message || "Offer sent successfully");
      setPendingSendValues(null);
      router.push(`${ROUTES.OFFERS}/${offerId}`);
    } catch (error) {
      showError(getApiErrorMessage(error));
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.OFFERS} underline="hover" color="inherit">
          Offers
        </Link>
        <Typography color="text.primary">
          {mode === "create" ? "Create Offer" : "Update Offer"}
        </Typography>
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
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
              <Button
                variant="text"
                startIcon={<BackIcon />}
                onClick={() =>
                  router.push(mode === "edit" && id ? `${ROUTES.OFFERS}/${id}` : ROUTES.OFFERS)
                }
              >
                Back
              </Button>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <OfferIcon sx={{ color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {mode === "create" ? "Create Offer" : "Update Offer"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {applicationLabel ?? "Select an eligible application to continue."}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        {mode === "create" ? (
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Select Application
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Only applications with a Selected or Offer in progress decision are shown.
              </Typography>
              <Autocomplete
                options={applicationOptions}
                value={selectedOption}
                onChange={(_event, value) => {
                  const nextId = value?.applicationId ?? "";
                  setSelectedApplicationId(nextId);
                  router.replace(
                    nextId
                      ? `${ROUTES.OFFERS}/create?applicationId=${nextId}`
                      : `${ROUTES.OFFERS}/create`,
                  );
                }}
                loading={eligibleDecisionQueries.some((query) => query.isLoading)}
                getOptionLabel={(option) =>
                  `${option.candidateName} • ${option.jobOpeningTitle} • ${option.decisionStatus.replaceAll("_", " ")}`
                }
                isOptionEqualToValue={(option, value) =>
                  option.applicationId === value.applicationId
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Application"
                    placeholder="Search eligible applications"
                    helperText={
                      applicationOptions.length === 0
                        ? "No eligible applications are currently available for offers."
                        : "The list is derived from final decisions already recorded in the system."
                    }
                  />
                )}
              />
            </Stack>
          </Paper>
        ) : null}

        {mode === "create" && !selectedApplicationId ? (
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 4, textAlign: "center" }}
          >
            <Stack spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Choose an Application to Continue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620 }}>
                Once you pick an application, we’ll prefill the offered role and validate the offer prerequisites.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <OfferForm
            key={`offer-form-${mode}-${selectedApplicationRouteId || "empty"}-${id ?? "new"}`}
            title={mode === "create" ? "Offer Form" : "Update Offer"}
            subtitle="Capture compensation details and choose whether to keep the offer as draft or send it immediately."
            applicationLabel={applicationLabel}
            defaultValues={defaultValues}
            isSubmitting={isSubmitting}
            disableSubmit={!selectedApplicationRouteId || !!prerequisiteWarning || isReadOnly}
            readOnly={isReadOnly}
            prerequisiteWarning={prerequisiteWarning}
            existingOfferWarning={
              mode === "edit" && existingOffer?.offer_status === "ACCEPTED"
                ? "This offer has already been accepted. Editing is disabled."
                : mode === "edit" && existingOffer?.offer_status !== "DRAFT"
                  ? "Only draft offers can be updated."
                  : null
            }
            onCancel={() =>
              router.push(mode === "edit" && id ? `${ROUTES.OFFERS}/${id}` : ROUTES.OFFERS)
            }
            onSubmit={handlePersistOffer}
          />
        )}

        {(createOfferMutation.isError ||
          updateOfferMutation.isError ||
          sendOfferMutation.isError) ? (
          <Alert severity="error">
            {getApiErrorMessage(
              createOfferMutation.error ??
                updateOfferMutation.error ??
                sendOfferMutation.error,
            )}
          </Alert>
        ) : null}
      </Stack>

      <ConfirmDialog
        open={!!pendingSendValues}
        title="Send Offer"
        description="This will save the offer details and move the offer from Draft to Sent."
        confirmLabel="Send Offer"
        confirmColor="info"
        loading={isSubmitting}
        onConfirm={handleConfirmSend}
        onCancel={() => setPendingSendValues(null)}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
