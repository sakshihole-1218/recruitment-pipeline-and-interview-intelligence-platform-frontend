"use client";

import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import {
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Replay as ReplayIcon,
  Stop as StopIcon,
  VolumeUp as SpeakerIcon,
} from "@mui/icons-material";

interface AiQuestionSpeakerProps {
  questionId?: string | null;
  questionText?: string | null;
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onReplay: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function AiQuestionSpeaker({
  questionId,
  questionText,
  isSupported,
  isSpeaking,
  isPaused,
  onReplay,
  stop,
  pause,
  resume,
}: AiQuestionSpeakerProps) {
  const canReplay = Boolean(questionId && questionText?.trim()) && isSupported;

  return (
    <Stack spacing={1.25}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap" }}
      >
        <Chip
          icon={<SpeakerIcon />}
          label={
            !isSupported
              ? "Speech unavailable"
              : isPaused
                ? "Speech paused"
                : isSpeaking
                  ? "AI interviewer is speaking..."
                  : "Speech ready"
          }
          color={!isSupported ? "default" : isSpeaking ? "primary" : isPaused ? "warning" : "success"}
          variant={isSpeaking ? "filled" : "outlined"}
        />

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={onReplay}
            disabled={!canReplay}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Replay Question
          </Button>

          <Button
            variant="outlined"
            startIcon={isPaused ? <ResumeIcon /> : <PauseIcon />}
            onClick={isPaused ? resume : pause}
            disabled={!isSupported || (!isSpeaking && !isPaused)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={stop}
            disabled={!isSupported || (!isSpeaking && !isPaused)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Stop Speaking
          </Button>
        </Stack>
      </Stack>

      {!isSupported ? (
        <Alert severity="info">
          Browser speech playback is not supported here. The candidate can still read the question and continue the interview.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {isSpeaking
            ? "The interviewer prompt is being read aloud. Recording will unlock when playback finishes."
            : "Question playback uses the browser SpeechSynthesis voice. Main and follow-up questions both auto-play once, and replay stays available throughout the interview."}
        </Typography>
      )}
    </Stack>
  );
}
