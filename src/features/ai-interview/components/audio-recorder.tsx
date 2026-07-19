"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import {
  FiberManualRecord as RecordIcon,
  Replay as RerecordIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

export interface RecordedAudio {
  blob: Blob;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
}

interface AudioRecorderProps {
  disabled?: boolean;
  recordingBlocked?: boolean;
  recordingBlockedMessage?: string;
  onRecordingChange?: (recording: RecordedAudio | null) => void;
  onRecordingBlocked?: () => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function AudioRecorder({
  disabled,
  recordingBlocked,
  recordingBlockedMessage,
  onRecordingChange,
  onRecordingBlocked,
  onRecordingStateChange,
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [recording, setRecording] = useState<RecordedAudio | null>(null);

  const hasMediaRecorderSupport =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const timerLabel = useMemo(
    () => formatDuration(elapsedSeconds),
    [elapsedSeconds],
  );

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearRecordingState = () => {
    clearTimer();
    setIsRecording(false);
    setElapsedSeconds(0);
    setPermissionError("");
    setRecording(null);
    onRecordingChange?.(null);
    chunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleStartRecording = async () => {
    if (isRecording) {
      return;
    }

    if (recordingBlocked) {
      setPermissionError(
        recordingBlockedMessage ||
          "Recording is temporarily unavailable while the AI interviewer is speaking.",
      );
      onRecordingBlocked?.();
      return;
    }

    if (disabled) {
      return;
    }

    if (!hasMediaRecorderSupport) {
      setPermissionError(
        "Audio recording is not supported in this browser. Use the manual answer fallback instead.",
      );
      return;
    }

    clearRecordingState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedMimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedMimeType });
        const nextAudioUrl = URL.createObjectURL(blob);
        const nextRecording: RecordedAudio = {
          blob,
          mimeType: recordedMimeType,
          fileName: `candidate-answer-${Date.now()}.webm`,
          durationSeconds: elapsedSeconds,
        };

        setAudioUrl(nextAudioUrl);
        setRecording(nextRecording);
        onRecordingChange?.(nextRecording);
        stopTracks();
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      recorder.start();
    setPermissionError("");
    setElapsedSeconds(0);
    setIsRecording(true);
    onRecordingStateChange?.(true);
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    } catch (error) {
      const permissionDenied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError");

      setPermissionError(
        permissionDenied
          ? "Microphone permission was denied. Please allow microphone access and try again."
          : "We couldn't access your microphone. Check your device settings and try again.",
      );
      stopTracks();
      mediaRecorderRef.current = null;
    }
  };

  const handleStopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) {
      return;
    }

    clearTimer();
    setIsRecording(false);
    onRecordingStateChange?.(false);
    mediaRecorderRef.current.stop();
  };

  const handleRerecord = () => {
    if (disabled || isRecording) {
      return;
    }

    clearRecordingState();
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
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Voice Answer Recorder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Record the candidate answer with the browser microphone, then upload it for transcription.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap" }}
          >
            <Button
              variant="contained"
              color={isRecording ? "error" : "primary"}
              startIcon={<RecordIcon />}
              onClick={handleStartRecording}
              disabled={disabled || isRecording}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 170 }}
            >
              Start Recording
            </Button>

            <Button
              variant="outlined"
              startIcon={<StopIcon />}
              onClick={handleStopRecording}
              disabled={disabled || !isRecording}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 170 }}
            >
              Stop Recording
            </Button>

            <Button
              variant="outlined"
              startIcon={<RerecordIcon />}
              onClick={handleRerecord}
              disabled={disabled || isRecording || !recording}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 170 }}
            >
              Re-record
            </Button>
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isRecording 
                ? (t) => t.palette.mode === "dark" ? "rgba(211, 47, 47, 0.15)" : "error.50"
                : (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "grey.50",
              border: "1px solid",
              borderColor: isRecording ? "error.200" : "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Recording timer
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
              {timerLabel}
            </Typography>
          </Box>

          {permissionError ? <Alert severity="error">{permissionError}</Alert> : null}

          {recording && audioUrl ? (
            <Stack spacing={1.25}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Audio Preview
              </Typography>
              <Box
                component="audio"
                controls
                src={audioUrl}
                sx={{ width: "100%" }}
              />
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
