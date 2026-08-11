"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  NavigateNext as NavigateNextIcon,
  Person as CandidateIcon,
  SmartToyOutlined as AiIcon,
  WorkOutlined as JobIcon,
  CalendarMonth as ScheduleIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { useSnackbar } from "@/hooks/use-snackbar";
import { AppSnackbar } from "@/components/app-snackbar";
import { useInterview, useCancelInterview } from "@/features/interviews/hooks/use-interviews";
import { useInterviewsPermissions } from "@/features/interviews/hooks/use-interviews-permissions";
import { InterviewModeChip } from "@/features/interviews/components/interview-mode-chip";
import { InterviewStatusChip } from "@/features/interviews/components/interview-status-chip";
import { CancelInterviewDialog } from "@/features/interviews/components/cancel-interview-dialog";
import { getInterviewDisplayStatus } from "@/features/interviews/types/interviews.types";
import type { CancelInterviewFormValues } from "@/features/interviews/schemas/interview-cancel.schema";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate, useCandidateDocuments } from "@/features/candidates/hooks/use-candidates";
import { CandidateDocumentsCard } from "@/features/candidates/components/candidate-documents-card";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import {
  useCandidateInterviewInvite,
  useCreateCandidateInterviewInvite,
  useRegenerateCandidateInterviewInvite,
  useRevokeCandidateInterviewInvite,
} from "@/features/candidate-interview/hooks/use-candidate-interview";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

export function InterviewDetailsView({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const { canRescheduleInterview, canCancelInterview } = useInterviewsPermissions();

  const interviewQuery = useInterview(id);
  const interview = interviewQuery.data?.data;

  const applicationQuery = useApplication(interview?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const docsQuery = useCandidateDocuments(application?.candidate_id ?? "");
  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const inviteQuery = useCandidateInterviewInvite(id);
  const invite = inviteQuery.data?.data;
  const createInviteMutation = useCreateCandidateInterviewInvite(id);
  const regenerateInviteMutation = useRegenerateCandidateInterviewInvite(id);
  const revokeInviteMutation = useRevokeCandidateInterviewInvite(id);

  const cancelMutation = useCancelInterview(id);
  const [cancelOpen, setCancelOpen] = useState(false);

  const onCancel = async (values: CancelInterviewFormValues) => {
    try {
      const res = await cancelMutation.mutateAsync({
        cancel_reason: values.cancel_reason.trim(),
      });
      showSuccess(res.message || "Interview cancelled successfully");
      setCancelOpen(false);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const title = useMemo(() => {
    const c = candidateQuery.data?.data;
    const jo = jobOpeningQuery.data?.data;
    if (!c || !jo) return "Interview Details";
    return `${c.first_name} ${c.last_name} • ${jo.title}`;
  }, [candidateQuery.data, jobOpeningQuery.data]);

  const errorMessage = interviewQuery.isError ? getApiErrorMessage(interviewQuery.error) : "";

  const copyInviteLink = async () => {
    const link = invite?.join_url;
    if (!link) {
      showError("Generate an invite first");
      return;
    }

    const absolute = typeof window !== "undefined" ? `${window.location.origin}${link}` : link;

    try {
      await navigator.clipboard.writeText(absolute);
      showSuccess("Candidate interview link copied");
    } catch {
      showError("Unable to copy interview link");
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Typography color="text.primary">Interview Details</Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3, gap: 2 }}
      >
        <Stack sx={{ minWidth: 0, flex: 1 }} spacing={0.75}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0, flexWrap: "wrap" }}>
            <Button
              variant="text"
              size="small"
              startIcon={<BackIcon />}
              onClick={() => router.push(ROUTES.INTERVIEWS)}
              sx={{ mr: 0.5, fontWeight: 900 }}
            >
              Back
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 900, minWidth: 0 }}>
              {title}
            </Typography>
          </Stack>

          {interview ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <InterviewStatusChip status={getInterviewDisplayStatus(interview)} />
              <InterviewModeChip mode={interview.interview_mode} />
            </Stack>
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", justifyContent: { xs: "flex-start", sm: "flex-end" }, flexWrap: "wrap" }}
        >
          {!interview?.is_ai_interview ? (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AiIcon />}
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room`)}
                disabled={interviewQuery.isLoading || !interview}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                AI Lobby
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AiIcon />}
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/session`)}
                disabled={interviewQuery.isLoading || !interview}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Join AI Interview
              </Button>
            </>
          ) : invite?.join_url ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AiIcon />}
              onClick={() => router.push(invite.join_url!)}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              Preview Candidate Flow
            </Button>
          ) : null}
          {canRescheduleInterview && interview && ["SCHEDULED", "RESCHEDULED"].includes(interview.interview_status) ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}/edit`)}
              disabled={interviewQuery.isLoading}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              Reschedule
            </Button>
          ) : null}
          {canCancelInterview && interview && ["SCHEDULED", "RESCHEDULED"].includes(interview.interview_status) ? (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => setCancelOpen(true)}
              disabled={interviewQuery.isLoading || cancelMutation.isPending}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              Cancel
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {interviewQuery.isLoading ? (
            <Typography>Loading...</Typography>
          ) : interviewQuery.isError ? (
            <Box sx={{ p: 3, border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900 }} color="error">
                Failed to load interview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {errorMessage}
              </Typography>
            </Box>
          ) : !interview ? (
            <Box sx={{ p: 3, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900 }}>Interview not found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                It may have been removed or you don’t have access.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <CandidateIcon color="primary" />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          Candidate
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {candidateQuery.isLoading
                            ? "Loading..."
                            : candidateQuery.data?.data
                              ? `${candidateQuery.data.data.first_name} ${candidateQuery.data.data.last_name}`
                              : "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <JobIcon color="primary" />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          Job Opening
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {jobOpeningQuery.isLoading
                            ? "Loading..."
                            : jobOpeningQuery.data?.data
                              ? `${jobOpeningQuery.data.data.title} (${jobOpeningQuery.data.data.code})`
                              : "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>

              {interview.is_ai_interview ? (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>Candidate Interview Invitation</Typography>
                        <Typography variant="body2" color="text.secondary">
                          The candidate should use a secure invitation link to complete this AI interview. Internal users review the transcript and AI feedback after completion.
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        <Chip
                          label={`Status: ${invite?.status ?? "NOT_GENERATED"}`}
                          color={invite?.status === "COMPLETED" ? "success" : invite?.status === "REVOKED" ? "error" : "primary"}
                          variant={invite ? "filled" : "outlined"}
                        />
                        {invite?.expires_at ? (
                          <Chip label={`Expires: ${formatDateTime(invite.expires_at)}`} variant="outlined" />
                        ) : null}
                        {invite?.last_accessed_at ? (
                          <Chip label={`Last accessed: ${formatDateTime(invite.last_accessed_at)}`} variant="outlined" />
                        ) : null}
                      </Stack>

                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {!invite ? (
                          <Button
                            variant="contained"
                            onClick={async () => {
                              try {
                                const response = await createInviteMutation.mutateAsync({ interview_id: id });
                                showSuccess(response.message || "Invite generated");
                              } catch (error) {
                                showError(getApiErrorMessage(error));
                              }
                            }}
                            disabled={createInviteMutation.isPending}
                            sx={{ borderRadius: 2, fontWeight: 900 }}
                          >
                            {createInviteMutation.isPending ? "Generating..." : "Generate Invite"}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              onClick={copyInviteLink}
                              sx={{ borderRadius: 2, fontWeight: 900 }}
                            >
                              Copy Interview Link
                            </Button>
                            <Button
                              variant="contained"
                              onClick={async () => {
                                try {
                                  const response = await regenerateInviteMutation.mutateAsync(invite.id);
                                  showSuccess(response.message || "Invite regenerated");
                                } catch (error) {
                                  showError(getApiErrorMessage(error));
                                }
                              }}
                              disabled={regenerateInviteMutation.isPending}
                              sx={{ borderRadius: 2, fontWeight: 900 }}
                            >
                              {regenerateInviteMutation.isPending ? "Regenerating..." : "Regenerate Link"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={async () => {
                                try {
                                  const response = await revokeInviteMutation.mutateAsync(invite.id);
                                  showSuccess(response.message || "Invite revoked");
                                } catch (error) {
                                  showError(getApiErrorMessage(error));
                                }
                              }}
                              disabled={revokeInviteMutation.isPending}
                              sx={{ borderRadius: 2, fontWeight: 900 }}
                            >
                              {revokeInviteMutation.isPending ? "Revoking..." : "Revoke Link"}
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <ScheduleIcon color="primary" />
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>Schedule</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Start: {formatDateTime(interview.scheduled_start_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        End: {formatDateTime(interview.scheduled_end_at)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={0.75}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Meeting link:</strong> {interview.meeting_link ?? "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Location:</strong> {interview.location_details ?? "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Reschedule reason:</strong> {interview.reschedule_reason ?? "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cancel reason:</strong> {interview.cancel_reason ?? "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Completed at:</strong> {formatDateTime(interview.completed_at)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              {candidateQuery.data?.data && (
                <CandidateDocumentsCard
                  documents={docsQuery.data?.data}
                  isLoading={docsQuery.isLoading}
                  canUpload={false}
                />
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      <CancelInterviewDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={onCancel}
        isSubmitting={cancelMutation.isPending}
      />

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
