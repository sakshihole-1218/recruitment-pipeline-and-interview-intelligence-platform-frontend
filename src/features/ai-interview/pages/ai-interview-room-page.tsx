"use client";

import { useEffect, useMemo, useRef } from "react";
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
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Mic as MicIcon,
  NavigateNext as NavigateNextIcon,
  PsychologyAlt as AiIcon,
} from "@mui/icons-material";

import { AppSnackbar } from "@/components/app-snackbar";
import { ROUTES } from "@/constants/routes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { AiInterviewerPanel } from "@/features/ai-interview/components/ai-interviewer-panel";
import { CameraPreview } from "@/features/ai-interview/components/camera-preview";
import { CandidateVoiceAnswerBox } from "@/features/ai-interview/components/candidate-voice-answer-box";
import { CurrentQuestionPanel } from "@/features/ai-interview/components/current-question-panel";
import { InterviewEngineProvider } from "@/features/ai-interview/context/interview-engine-context";
import { useInterviewEngine } from "@/features/ai-interview/hooks/use-interview-engine";
import { InterviewProgressBar } from "@/features/ai-interview/components/interview-progress-bar";
import { QuestionContextCard } from "@/features/ai-interview/components/question-context-card";
import { TranscriptPanel } from "@/features/ai-interview/components/transcript-panel";
import {
  useEndAiInterviewSession,
  useEnsureAiInterviewSession,
  useStartAiInterviewSession,
} from "@/features/ai-interview/hooks/use-ai-interview";
import type { AiInterviewSessionResponse } from "@/features/ai-interview/types/ai-interview.types";
import { useCandidate } from "@/features/candidates/hooks/use-candidates";
import { useInterview } from "@/features/interviews/hooks/use-interviews";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { getApiErrorMessage } from "@/utils/api-error-handler";

function buildCandidateName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Candidate";
}

export function AiInterviewRoomPage({ id }: { id: string }) {
  const router = useRouter();
  const { snackbar, showError, closeSnackbar } = useSnackbar();
  const hasStartedSessionRef = useRef(false);

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

  const startSessionMutation = useStartAiInterviewSession(id);
  const endInterviewMutation = useEndAiInterviewSession(id);

  const candidateName = useMemo(
    () => buildCandidateName(candidate?.first_name, candidate?.last_name),
    [candidate?.first_name, candidate?.last_name],
  );

  useEffect(() => {
    if (!aiSession) {
      hasStartedSessionRef.current = false;
      return;
    }

    if (aiSession.session_status === "IN_PROGRESS") {
      return;
    }

    if (aiSession.session_status !== "READY") {
      return;
    }

    if (hasStartedSessionRef.current || startSessionMutation.isPending) {
      return;
    }

    hasStartedSessionRef.current = true;

    startSessionMutation.mutate(aiSession.id, {
      onError: (error) => {
        hasStartedSessionRef.current = false;
        showError(getApiErrorMessage(error));
      },
    });
  }, [aiSession, showError, startSessionMutation]);

  const handleEndInterview = async () => {
    const sessionId = aiSession?.id;

    if (!sessionId) {
      router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/completed`);
      return;
    }

    try {
      await endInterviewMutation.mutateAsync(sessionId);
    } catch (error) {
      showError(getApiErrorMessage(error));
      throw error;
    }

    router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room/completed`);
  };

  const pageError =
    (interviewQuery.isError && getApiErrorMessage(interviewQuery.error)) ||
    (aiSessionQuery.isError && getApiErrorMessage(aiSessionQuery.error)) ||
    (startSessionMutation.isError &&
      getApiErrorMessage(startSessionMutation.error)) ||
    "";

  const isPreparing =
    interviewQuery.isLoading ||
    aiSessionQuery.isLoading ||
    startSessionMutation.isPending ||
    !aiSession ||
    aiSession.session_status !== "IN_PROGRESS";

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", minHeight: "calc(100vh - 140px)" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}`} underline="hover" color="inherit">
          Interview Details
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}/ai-room`} underline="hover" color="inherit">
          AI Interview Lobby
        </Link>
        <Typography color="text.primary">AI Interview Session</Typography>
      </Breadcrumbs>

      {pageError ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Alert severity="error">{pageError}</Alert>
              <Button
                variant="outlined"
                onClick={() => router.push(`${ROUTES.INTERVIEWS}/${id}/ai-room`)}
                sx={{ alignSelf: "flex-start", borderRadius: 2, fontWeight: 800 }}
              >
                Back to Lobby
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : isPreparing ? (
        <InterviewRoomLoadingState />
      ) : aiSession ? (
        <InterviewEngineProvider sessionId={aiSession.id} onError={showError}>
          <AiInterviewRoomContent
            session={aiSession}
            candidateName={candidateName}
            candidateLoading={candidateQuery.isLoading}
            jobOpeningTitle={jobOpening?.title ?? "-"}
            jobOpeningLoading={jobOpeningQuery.isLoading}
            onEndInterview={handleEndInterview}
            endPending={endInterviewMutation.isPending}
          />
        </InterviewEngineProvider>
      ) : null}

      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
    </Box>
  );
}

function AiInterviewRoomContent({
  session,
  candidateName,
  candidateLoading,
  jobOpeningTitle,
  jobOpeningLoading,
  onEndInterview,
  endPending,
}: {
  session: AiInterviewSessionResponse;
  candidateName: string;
  candidateLoading: boolean;
  jobOpeningTitle: string;
  jobOpeningLoading: boolean;
  onEndInterview: () => Promise<void>;
  endPending: boolean;
}) {
  const engine = useInterviewEngine();

  if (engine.errorMessage) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Alert severity="error">{engine.errorMessage}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (engine.isLoading) {
    return (
      <InterviewRoomLoadingState
        title="Loading interview data..."
        description="We're fetching interview questions and transcripts for this session."
      />
    );
  }

  return (
    <Stack spacing={3} sx={{ minHeight: "calc(100vh - 220px)" }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Session Details
              </Typography>
              <Chip
                icon={<AiIcon />}
                label={`${session.session_code} • ${session.session_status}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${engine.answeredQuestions}/${engine.totalQuestions || 0} answered`}
                variant="outlined"
              />
              <Chip icon={<MicIcon />} label="Voice mode" variant="outlined" />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Candidate: {candidateLoading ? "Loading..." : candidateName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job Opening: {jobOpeningLoading ? "Loading..." : jobOpeningTitle}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <InterviewProgressBar
        questionLabel={engine.currentQuestionLabel}
        answeredQuestions={engine.answeredQuestions}
        totalQuestions={engine.totalQuestions}
        progressPercent={engine.progressPercent}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr 1fr" },
          gap: 3,
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <CameraPreview />
        </Box>

        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <CurrentQuestionPanel
            currentQuestion={engine.currentQuestion}
            currentQuestionIndex={engine.rootQuestionIndex}
            totalQuestions={engine.totalQuestions}
            currentQuestionLabel={engine.currentQuestionLabel}
            isFollowUp={engine.isCurrentQuestionFollowUp}
          />
          <QuestionContextCard
            currentQuestion={engine.currentQuestion}
            isFollowUp={engine.isCurrentQuestionFollowUp}
          />
          <AiInterviewerPanel />
        </Stack>

        <Box sx={{ minWidth: 0, minHeight: 0 }}>
          <TranscriptPanel transcriptEntries={engine.transcriptEntries} />
        </Box>
      </Box>

      <CandidateVoiceAnswerBox
        disabled={!engine.currentQuestion || engine.isBusy}
        submitPending={engine.isBusy}
        nextPending={engine.isBusy}
        canGoNext={engine.canAdvanceToNextQuestion}
        onSubmitManualAnswer={engine.submitAnswer}
        onSubmitAudioAnswer={engine.submitAudioAnswer}
        onNextQuestion={engine.advanceToNextQuestion}
      />

      <InterviewFooterControls
        onEndInterview={onEndInterview}
        endPending={endPending}
      />
    </Stack>
  );
}

function InterviewRoomLoadingState({
  title = "Preparing your interview session...",
  description = "We're getting the AI interview session ready without LiveKit.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: 420,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        p: 4,
      }}
    >
      <CircularProgress />
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
}

function InterviewFooterControls({
  onEndInterview,
  endPending,
}: {
  onEndInterview: () => Promise<void>;
  endPending: boolean;
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "flex-end",
        p: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={onEndInterview}
        disabled={endPending}
        sx={{ borderRadius: 2, fontWeight: 900, minWidth: 180 }}
      >
        {endPending ? "Ending..." : "End Interview"}
      </Button>
    </Stack>
  );
}
