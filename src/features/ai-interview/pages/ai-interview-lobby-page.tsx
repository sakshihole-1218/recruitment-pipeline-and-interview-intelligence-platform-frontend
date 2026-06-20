"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
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
  CalendarMonth as CalendarIcon,
  Mic as MicIcon,
  NavigateNext as NavigateNextIcon,
  Person as PersonIcon,
  PsychologyAlt as AiIcon,
  Videocam as VideoIcon,
  WorkOutlined as JobIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { CameraPreview, type CameraPreviewStatus } from "@/features/ai-interview/components/camera-preview";
import { InterviewInstructionsCard } from "@/features/ai-interview/components/interview-instructions-card";
import { useEnsureAiInterviewSession } from "@/features/ai-interview/hooks/use-ai-interview";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useInterview } from "@/features/interviews/hooks/use-interviews";
import { InterviewModeChip } from "@/features/interviews/components/interview-mode-chip";
import { InterviewStatusChip } from "@/features/interviews/components/interview-status-chip";
import { getInterviewDisplayStatus } from "@/features/interviews/types/interviews.types";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { getApiErrorMessage } from "@/utils/api-error-handler";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString();
}

function buildCandidateName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Candidate";
}

export function AiInterviewLobbyPage({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, closeSnackbar } = useSnackbar();
  const [deviceStatus, setDeviceStatus] = useState<CameraPreviewStatus>({
    camera: "idle",
    microphone: "idle",
    errorMessage: "",
  });

  const interviewQuery = useInterview(id);
  const interview = interviewQuery.data?.data;

  const applicationQuery = useApplication(interview?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;

  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const aiSessionQuery = useEnsureAiInterviewSession(id);
  const aiSession = aiSessionQuery.data;

  const candidateName = useMemo(
    () => buildCandidateName(candidate?.first_name, candidate?.last_name),
    [candidate?.first_name, candidate?.last_name],
  );

  const joinDisabled =
    deviceStatus.camera !== "granted" ||
    deviceStatus.microphone !== "granted" ||
    !aiSession ||
    aiSessionQuery.isLoading;

  const detailsError = interviewQuery.isError ? getApiErrorMessage(interviewQuery.error) : "";
  const sessionError = aiSessionQuery.isError ? getApiErrorMessage(aiSessionQuery.error) : "";

  const handleJoinInterview = async () => {
    if (!aiSession) return;
    router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/session`);
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}`} underline="hover" color="inherit">
          Interview Details
        </Link>
        <Typography color="text.primary">AI Interview Lobby</Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            AI Interview Lobby
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            Check permissions, review instructions, and join when everything is ready.
          </Typography>
        </Box>

        {aiSession ? (
          <Chip
            icon={<AiIcon />}
            label={`Session ${aiSession.session_code} • ${aiSession.session_status}`}
            color="primary"
            variant="outlined"
          />
        ) : null}
      </Stack>

      {interviewQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load interview details. {detailsError}
        </Alert>
      ) : null}

      {aiSessionQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to prepare the AI interview session. {sessionError}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.15fr) minmax(360px, 0.85fr)" },
          gap: 3,
        }}
      >
        <CameraPreview onStatusChange={setDeviceStatus} />

        <Stack spacing={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Interview Overview
              </Typography>

              {interviewQuery.isLoading ? (
                <Typography color="text.secondary">Loading interview details...</Typography>
              ) : !interview ? (
                <Typography color="text.secondary">
                  Interview details are not available right now.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <InterviewStatusChip status={getInterviewDisplayStatus(interview)} />
                    <InterviewModeChip mode={interview.interview_mode} />
                    {application ? (
                      <Chip label={`Application ${application.application_number}`} variant="outlined" />
                    ) : null}
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <PersonIcon color="primary" sx={{ mt: 0.25 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>Candidate</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {candidateQuery.isLoading ? "Loading..." : candidateName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {candidate?.email ?? "—"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <JobIcon color="primary" sx={{ mt: 0.25 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>Job Opening</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {jobOpeningQuery.isLoading
                            ? "Loading..."
                            : jobOpening
                              ? `${jobOpening.title} (${jobOpening.code})`
                              : "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {jobOpening?.location ?? "Location not provided"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <CalendarIcon color="primary" sx={{ mt: 0.25 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>Schedule</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start: {formatDateTime(interview.scheduled_start_at)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          End: {formatDateTime(interview.scheduled_end_at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>

          <InterviewInstructionsCard />

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Readiness Check
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip
                    icon={<VideoIcon />}
                    label={`Camera ${deviceStatus.camera}`}
                    color={deviceStatus.camera === "granted" ? "success" : "default"}
                    variant={deviceStatus.camera === "granted" ? "filled" : "outlined"}
                  />
                  <Chip
                    icon={<MicIcon />}
                    label={`Microphone ${deviceStatus.microphone}`}
                    color={deviceStatus.microphone === "granted" ? "success" : "default"}
                    variant={deviceStatus.microphone === "granted" ? "filled" : "outlined"}
                  />
                  <Chip
                    icon={<AiIcon />}
                    label={
                      aiSessionQuery.isLoading
                        ? "Session preparing"
                        : aiSession
                          ? `Session ${aiSession.session_status.toLowerCase()}`
                          : "Session pending"
                    }
                    color={aiSession ? "primary" : "default"}
                    variant={aiSession ? "filled" : "outlined"}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Join stays disabled until camera, microphone, and session setup are all ready.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}`)}
                    sx={{ borderRadius: 2, fontWeight: 800 }}
                  >
                    Back to Interview
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleJoinInterview}
                    disabled={joinDisabled}
                    sx={{ borderRadius: 2, fontWeight: 900, minWidth: 190 }}
                  >
                    Join Interview
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}
