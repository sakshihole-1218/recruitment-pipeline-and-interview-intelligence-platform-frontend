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
  ArrowForward as NextIcon,
  KeyboardVoice as VoiceIcon,
  Send as SubmitIcon,
} from "@mui/icons-material";

import {
  AudioRecorder,
  type RecordedAudio,
} from "@/features/ai-interview/components/audio-recorder";

interface CandidateVoiceAnswerBoxProps {
  disabled?: boolean;
  submitPending?: boolean;
  nextPending?: boolean;
  canGoNext?: boolean;
  onSubmitManualAnswer: (messageText: string) => Promise<void> | void;
  onSubmitAudioAnswer: (recording: RecordedAudio) => Promise<void> | void;
  onNextQuestion: () => Promise<void> | void;
}

export function CandidateVoiceAnswerBox({
  disabled,
  submitPending,
  nextPending,
  canGoNext,
  onSubmitManualAnswer,
  onSubmitAudioAnswer,
  onNextQuestion,
}: CandidateVoiceAnswerBoxProps) {
  const [messageText, setMessageText] = useState("");
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const [resetToken, setResetToken] = useState(0);

  const handleSubmitManual = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || disabled || submitPending || canGoNext) {
      return;
    }

    await onSubmitManualAnswer(trimmed);
    setMessageText("");
  };

  const handleSubmitAudio = async () => {
    if (!recording || disabled || submitPending || canGoNext) {
      return;
    }

    await onSubmitAudioAnswer(recording);
    setResetToken((current) => current + 1);
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

          <AudioRecorder
            key={resetToken}
            disabled={disabled || submitPending || Boolean(canGoNext)}
            onRecordingChange={setRecording}
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
              disabled={disabled || submitPending || !recording || Boolean(canGoNext)}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 200 }}
            >
              {submitPending ? "Submitting..." : "Submit Audio Answer"}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<NextIcon />}
              onClick={onNextQuestion}
              disabled={!canGoNext || nextPending}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 180 }}
            >
              {nextPending ? "Loading..." : "Next Question"}
            </Button>
          </Stack>

          {canGoNext ? (
            <Alert severity="success">
              Answer saved. The transcript has been refreshed and you can move to the next question.
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
              onChange={(event) => setMessageText(event.target.value)}
              disabled={disabled || submitPending || Boolean(canGoNext)}
            />

            <Button
              variant="outlined"
              startIcon={<SubmitIcon />}
              onClick={handleSubmitManual}
              disabled={
                disabled ||
                submitPending ||
                !messageText.trim() ||
                Boolean(canGoNext)
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
