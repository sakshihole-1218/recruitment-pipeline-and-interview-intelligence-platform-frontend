"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  KeyboardVoice as VoiceIcon,
  Send as SubmitIcon,
} from "@mui/icons-material";

import {
  AudioRecorder,
  type RecordedAudio,
} from "@/features/ai-interview/components/audio-recorder";
import type {
  AiInterviewAnswerSubmissionResult,
  AiInterviewRoomState,
} from "@/features/ai-interview/types/ai-interview.types";

interface CandidateVoiceAnswerBoxProps {
  disabled?: boolean;
  canRecord?: boolean;
  canSubmit?: boolean;
  interviewState: AiInterviewRoomState;
  statusMessage?: string;
  isAiSpeaking?: boolean;
  speechWarningMessage?: string;
  submitPending?: boolean;
  hasAnsweredCurrentQuestion?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onTranscriptionStart?: () => void;
  onTranscriptionSuccess?: (
    result: AiInterviewAnswerSubmissionResult,
  ) => void;
  onSubmitError?: () => void;
  onSubmitManualAnswer: (
    messageText: string,
  ) => Promise<AiInterviewAnswerSubmissionResult> | AiInterviewAnswerSubmissionResult;
  onSubmitAudioAnswer: (
    recording: RecordedAudio,
  ) => Promise<AiInterviewAnswerSubmissionResult> | AiInterviewAnswerSubmissionResult;
}

export function CandidateVoiceAnswerBox({
  disabled,
  canRecord = true,
  canSubmit = true,
  interviewState,
  statusMessage,
  isAiSpeaking,
  speechWarningMessage,
  submitPending,
  hasAnsweredCurrentQuestion,
  onRecordingStateChange,
  onTranscriptionStart,
  onTranscriptionSuccess,
  onSubmitError,
  onSubmitManualAnswer,
  onSubmitAudioAnswer,
}: CandidateVoiceAnswerBoxProps) {
  const [messageText, setMessageText] = useState("");
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");

  const activeSpeechWarningMessage =
    speechWarningMessage ||
    "Please wait until the AI interviewer finishes speaking before starting the recording.";

  const handleSubmitManual = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || disabled || submitPending || !canSubmit) {
      return;
    }

    onTranscriptionStart?.();

    try {
      const result = await onSubmitManualAnswer(trimmed);
      onTranscriptionSuccess?.(result);
      setMessageText("");
    } catch (error) {
      onSubmitError?.();
      throw error;
    }
  };

  const handleSubmitAudio = async () => {
    if (!recording || disabled || submitPending || !canSubmit) {
      return;
    }

    onTranscriptionStart?.();

    try {
      const result = await onSubmitAudioAnswer(recording);
      onTranscriptionSuccess?.(result);
      setResetToken((current) => current + 1);
      setRecording(null);
    } catch (error) {
      onSubmitError?.();
      throw error;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Candidate Answer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Record the spoken answer first. Manual text submission remains available as a development fallback.
            </Typography>
          </Box>

          {statusMessage ? <Alert severity="info">{statusMessage}</Alert> : null}

          <AudioRecorder
            key={resetToken}
            disabled={disabled || submitPending || !canRecord}
            recordingBlocked={Boolean(isAiSpeaking)}
            recordingBlockedMessage={activeSpeechWarningMessage}
            onRecordingChange={(nextRecording) => {
              setRecording(nextRecording);
              onRecordingStateChange?.(false);
            }}
            onRecordingBlocked={() => setWarningMessage(activeSpeechWarningMessage)}
            onRecordingStateChange={onRecordingStateChange}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { xs: "stretch", md: "center" }, flexWrap: "wrap" }}
          >
            <Button
              variant="contained"
              startIcon={<VoiceIcon />}
              onClick={handleSubmitAudio}
              disabled={disabled || submitPending || !recording || !canSubmit}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 200 }}
            >
              {submitPending ? "Uploading..." : "Submit Audio Answer"}
            </Button>
          </Stack>

          {hasAnsweredCurrentQuestion ? (
            <Alert severity="success">
              This question already has a candidate answer transcript. The interview will continue with the next unanswered question.
            </Alert>
          ) : null}

          {!hasAnsweredCurrentQuestion && warningMessage ? (
            <Alert severity="warning" onClose={() => setWarningMessage("")}>
              {warningMessage}
            </Alert>
          ) : null}

          <Divider />

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Manual Fallback
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Use this only for development or if microphone recording is unavailable.
              </Typography>
            </Box>

            <TextField
              multiline
              minRows={4}
              maxRows={8}
              fullWidth
              placeholder="Type the candidate answer here..."
              value={messageText}
              onChange={(event) => {
                if (warningMessage) {
                  setWarningMessage("");
                }
                setMessageText(event.target.value);
              }}
              disabled={disabled || submitPending || !canSubmit}
            />

            <Button
              variant="outlined"
              startIcon={<SubmitIcon />}
              onClick={handleSubmitManual}
              disabled={
                disabled ||
                submitPending ||
                !messageText.trim() ||
                !canSubmit ||
                interviewState === "RECORDING"
              }
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 180, alignSelf: "flex-start" }}
            >
              {submitPending ? "Submitting..." : "Submit Manual Answer"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
