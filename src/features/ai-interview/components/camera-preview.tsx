"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

export interface CameraPreviewStatus {
  camera: PermissionState;
  microphone: PermissionState;
  errorMessage: string;
}

interface CameraPreviewProps {
  onStatusChange?: (status: CameraPreviewStatus) => void;
}

function getStatusTone(status: PermissionState): "success" | "warning" | "default" {
  if (status === "granted") return "success";
  if (status === "denied" || status === "error") return "warning";
  return "default";
}

function getStatusLabel(label: string, status: PermissionState) {
  if (status === "granted") return `${label}: ready`;
  if (status === "requesting") return `${label}: requesting`;
  if (status === "denied") return `${label}: denied`;
  if (status === "error") return `${label}: unavailable`;
  return `${label}: pending`;
}

export function CameraPreview({ onStatusChange }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<CameraPreviewStatus>({
    camera: "idle",
    microphone: "idle",
    errorMessage: "",
  });

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    let active = true;

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const requestMedia = async () => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (!active) return;
        setStatus({
          camera: "error",
          microphone: "error",
          errorMessage: "Camera and microphone preview is not supported in this browser.",
        });
        return;
      }

      setStatus({
        camera: "requesting",
        microphone: "requesting",
        errorMessage: "",
      });

      stopStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus({
          camera: "granted",
          microphone: "granted",
          errorMessage: "",
        });
      } catch (error) {
        if (!active) return;

        const name = error instanceof DOMException ? error.name : "";
        const denied =
          name === "NotAllowedError" || name === "PermissionDeniedError";
        const message = denied
          ? "Camera and microphone permission was denied. Please allow access to continue."
          : "We couldn’t access your camera and microphone. Check your device settings and try again.";

        setStatus({
          camera: denied ? "denied" : "error",
          microphone: denied ? "denied" : "error",
          errorMessage: message,
        });
      }
    };

    void requestMedia();

    return () => {
      active = false;
      stopStream();
    };
  }, [retryKey]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 0, height: "100%" }}>
        <Box
          sx={{
            position: "relative",
            aspectRatio: "16 / 10",
            bgcolor: "#0F172A",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "inset 0 0 100px rgba(139, 92, 246, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            m: 2,
          }}
        >
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            sx={{
              position: "absolute",
              inset: 16,
              width: "calc(100% - 32px)",
              height: "calc(100% - 32px)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              objectFit: "cover",
              display:
                status.camera === "granted" && status.microphone === "granted"
                  ? "block"
                  : "none",
              transform: "scaleX(-1)",
            }}
          />

          {status.camera !== "granted" || status.microphone !== "granted" ? (
            <Stack spacing={1.5} sx={{ p: 3, alignItems: "center", textAlign: "center" }}>
              <VideocamOffIcon sx={{ fontSize: 40, color: "common.white" }} />
              <Typography variant="body1" sx={{ color: "common.white", fontWeight: 700 }}>
                Camera preview unavailable
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.300", maxWidth: 360 }}>
                Allow camera and microphone access to preview your setup before joining the interview.
              </Typography>
            </Stack>
          ) : null}
        </Box>

        <Stack spacing={2} sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip
              icon={status.camera === "granted" ? <VideocamIcon /> : <VideocamOffIcon />}
              label={getStatusLabel("Camera", status.camera)}
              color={getStatusTone(status.camera)}
              variant={status.camera === "granted" ? "filled" : "outlined"}
            />
            <Chip
              icon={status.microphone === "granted" ? <MicIcon /> : <MicOffIcon />}
              label={getStatusLabel("Microphone", status.microphone)}
              color={getStatusTone(status.microphone)}
              variant={status.microphone === "granted" ? "filled" : "outlined"}
            />
          </Stack>

          {status.errorMessage ? (
            <Alert
              severity={status.camera === "denied" ? "warning" : "error"}
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => setRetryKey((current) => current + 1)}
                >
                  Retry
                </Button>
              }
            >
              {status.errorMessage}
            </Alert>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Your preview stays local to this browser until you click Join Interview.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
