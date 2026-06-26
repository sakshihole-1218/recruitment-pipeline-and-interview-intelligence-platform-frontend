"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CheckCircleOutlined as AcceptIcon,
  CancelOutlined as CancelIcon,
  EditOutlined as EditIcon,
  LocalOfferOutlined as OfferIcon,
  NavigateNext as NavigateNextIcon,
  ScheduleOutlined as ExpireIcon,
  ThumbDownOutlined as DeclineIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useDecisionByApplication } from "@/features/decisions/hooks/use-decisions";
import { useDepartment } from "@/features/departments/hooks/use-departments";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { ConfirmDialog } from "@/features/offers/components/ConfirmDialog";
import { OfferStatusChip } from "@/features/offers/components/OfferStatusChip";
import {
  useAcceptOfferAction,
  useCancelOfferAction,
  useDeclineOfferAction,
  useExpireOfferAction,
  useOffer,
} from "@/features/offers/hooks/use-offers";
import { useOffersPermissions } from "@/features/offers/hooks/use-offers-permissions";
import { OFFER_STATUS_LABELS } from "@/features/offers/types/offer.types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function formatMoney(value: string | null | undefined, currency?: string | null) {
  if (!value) return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return [currency, value].filter(Boolean).join(" ");
  }
  return `${currency ?? ""} ${parsed.toLocaleString()}`.trim();
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 900, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Grid>
  );
}

type PendingAction = "accept" | "cancel" | "expire" | null;

export function OfferDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, showError, showSuccess, closeSnackbar } = useSnackbar();
  const {
    canEditOffer,
    canAcceptOffer,
    canDeclineOffer,
    canCancelOffer,
    canExpireOffer,
  } = useOffersPermissions();

  const offerQuery = useOffer(id);
  const offer = offerQuery.data?.data;

  const applicationQuery = useApplication(offer?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;

  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const departmentQuery = useDepartment(jobOpening?.department_id ?? "");
  const department = departmentQuery.data?.data;

  const decisionQuery = useDecisionByApplication(application?.id ?? "");
  const decision = decisionQuery.data?.data;

  const acceptOfferMutation = useAcceptOfferAction();
  const declineOfferMutation = useDeclineOfferAction();
  const cancelOfferMutation = useCancelOfferAction();
  const expireOfferMutation = useExpireOfferAction();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const candidateName = formatName(candidate?.first_name, candidate?.last_name);
  const pageError =
    (offerQuery.isError && getApiErrorMessage(offerQuery.error)) ||
    (applicationQuery.isError && getApiErrorMessage(applicationQuery.error)) ||
    "";

  const isMutating =
    acceptOfferMutation.isPending ||
    declineOfferMutation.isPending ||
    cancelOfferMutation.isPending ||
    expireOfferMutation.isPending;

  const handleConfirmAction = async () => {
    if (!offer || !pendingAction) return;

    try {
      if (pendingAction === "accept") {
        const response = await acceptOfferMutation.mutateAsync(offer.id);
        showSuccess(response.message || "Offer accepted successfully");
      }

      if (pendingAction === "cancel") {
        const response = await cancelOfferMutation.mutateAsync(offer.id);
        showSuccess(response.message || "Offer cancelled successfully");
      }

      if (pendingAction === "expire") {
        const response = await expireOfferMutation.mutateAsync(offer.id);
        showSuccess(response.message || "Offer expired successfully");
      }
    } catch (error) {
      showError(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDecline = async () => {
    if (!offer) return;

    try {
      const response = await declineOfferMutation.mutateAsync({
        id: offer.id,
        payload: { decline_reason: declineReason.trim() },
      });
      showSuccess(response.message || "Offer declined successfully");
      setDeclineDialogOpen(false);
      setDeclineReason("");
    } catch (error) {
      showError(getApiErrorMessage(error));
    }
  };

  if (offerQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load offer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(offerQuery.error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.OFFERS)}>
          Back to Offers
        </Button>
      </Box>
    );
  }

  const canEditDraft = canEditOffer && offer?.offer_status === "DRAFT";
  const canAcceptSent = canAcceptOffer && offer?.offer_status === "SENT";
  const canDeclineSent = canDeclineOffer && offer?.offer_status === "SENT";
  const canCancelCurrent =
    canCancelOffer &&
    (offer?.offer_status === "DRAFT" || offer?.offer_status === "SENT");
  const canExpireCurrent = canExpireOffer && offer?.offer_status === "SENT";

  const confirmMeta =
    pendingAction === "accept"
      ? {
          title: "Accept Offer",
          description: `Mark the offer for ${candidateName} as accepted?`,
          confirmLabel: "Accept Offer",
          confirmColor: "success" as const,
        }
      : pendingAction === "cancel"
        ? {
            title: "Cancel Offer",
            description: `Cancel the offer for ${candidateName}?`,
            confirmLabel: "Cancel Offer",
            confirmColor: "error" as const,
          }
        : pendingAction === "expire"
          ? {
              title: "Expire Offer",
              description: `Mark the offer for ${candidateName} as expired?`,
              confirmLabel: "Expire Offer",
              confirmColor: "warning" as const,
            }
          : null;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.OFFERS} underline="hover" color="inherit">
          Offers
        </Link>
        <Typography color="text.primary">{offer ? candidateName : "Offer Details"}</Typography>
      </Breadcrumbs>

      <Stack spacing={3}>
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4 },
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant="text"
                  startIcon={<BackIcon />}
                  onClick={() => router.push(ROUTES.OFFERS)}
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
                    {candidateName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobOpening?.title ?? "Job opening"}
                  </Typography>
                </Box>
              </Stack>

              {offer ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <OfferStatusChip status={offer.offer_status} />
                  {offer.offer_status === "ACCEPTED" ? (
                    <Chip
                      label={`Joining ${formatDate(offer.expected_joining_date)}`}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 800 }}
                    />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>

            {offer ? (
              <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.25 }}>
                {canAcceptSent ? (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<AcceptIcon />}
                    onClick={() => setPendingAction("accept")}
                  >
                    Accept
                  </Button>
                ) : null}

                {canDeclineSent ? (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<DeclineIcon />}
                    onClick={() => setDeclineDialogOpen(true)}
                  >
                    Decline
                  </Button>
                ) : null}

                {canExpireCurrent ? (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ExpireIcon />}
                    onClick={() => setPendingAction("expire")}
                  >
                    Expire
                  </Button>
                ) : null}

                {canCancelCurrent ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setPendingAction("cancel")}
                  >
                    Cancel
                  </Button>
                ) : null}

                {canEditDraft ? (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`${ROUTES.OFFERS}/${offer.id}/edit`)}
                    sx={{ fontWeight: 900 }}
                  >
                    Edit
                  </Button>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
        </Box>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        {(acceptOfferMutation.isError ||
          declineOfferMutation.isError ||
          cancelOfferMutation.isError ||
          expireOfferMutation.isError) ? (
          <Alert severity="error">
            {getApiErrorMessage(
              acceptOfferMutation.error ??
                declineOfferMutation.error ??
                cancelOfferMutation.error ??
                expireOfferMutation.error,
            )}
          </Alert>
        ) : null}

        {offer ? (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Candidate
                    </Typography>
                    <Grid container spacing={2}>
                      <DetailRow label="Name" value={candidateName} />
                      <DetailRow label="Email" value={candidate?.email ?? "—"} />
                      <DetailRow label="Phone" value={candidate?.phone ?? "—"} />
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Job
                    </Typography>
                    <Grid container spacing={2}>
                      <DetailRow label="Role" value={offer.offered_role_title} />
                      <DetailRow label="Department" value={department?.name ?? "—"} />
                      <DetailRow label="Location" value={jobOpening?.location ?? "—"} />
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Compensation
                    </Typography>
                    <Grid container spacing={2}>
                      <DetailRow
                        label="Offered CTC"
                        value={formatMoney(offer.offered_ctc, offer.currency_code)}
                      />
                      <DetailRow
                        label="Joining Bonus"
                        value={formatMoney(offer.joining_bonus, offer.currency_code)}
                      />
                      <DetailRow label="Currency" value={offer.currency_code ?? "—"} />
                      <DetailRow
                        label="Probation Period"
                        value={
                          offer.probation_period_months !== null
                            ? `${offer.probation_period_months} months`
                            : "—"
                        }
                      />
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Timeline
                    </Typography>
                    <Grid container spacing={2}>
                      <DetailRow label="Created At" value={formatDateTime(offer.created_at)} />
                      <DetailRow label="Offered At" value={formatDateTime(offer.offered_at)} />
                      <DetailRow label="Accepted At" value={formatDateTime(offer.accepted_at)} />
                      <DetailRow label="Declined At" value={formatDateTime(offer.declined_at)} />
                      <DetailRow
                        label="Expected Joining Date"
                        value={formatDate(offer.expected_joining_date)}
                      />
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Offer Status
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                      <OfferStatusChip status={offer.offer_status} />
                      <Typography variant="body2" color="text.secondary">
                        Current status: {OFFER_STATUS_LABELS[offer.offer_status]}
                      </Typography>
                      {decision ? (
                        <Chip
                          label={`Decision ${decision.decision_status.replaceAll("_", " ")}`}
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      ) : null}
                    </Stack>

                    {offer.offer_status === "DECLINED" && offer.decline_reason ? (
                      <Alert severity="warning">Decline reason: {offer.decline_reason}</Alert>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Typography>Loading offer details...</Typography>
        )}
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

      <Dialog
        open={declineDialogOpen}
        onClose={() => {
          if (!declineOfferMutation.isPending) {
            setDeclineDialogOpen(false);
            setDeclineReason("");
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Decline Offer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Add the reason for declining this offer.
            </Typography>
            <TextField
              label="Decline Reason"
              multiline
              minRows={4}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              disabled={declineOfferMutation.isPending}
              error={declineReason.trim().length > 0 && declineReason.trim().length < 2}
              helperText="At least 2 characters are required."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeclineDialogOpen(false);
              setDeclineReason("");
            }}
            disabled={declineOfferMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleDecline}
            disabled={declineOfferMutation.isPending || declineReason.trim().length < 2}
          >
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
