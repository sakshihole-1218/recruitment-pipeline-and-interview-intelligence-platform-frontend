"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import { CameraPreview, type CameraPreviewStatus } from "@/features/ai-interview/components/camera-preview";
import { InterviewInstructionsCard } from "@/features/ai-interview/components/interview-instructions-card";
import {
  useCandidateInterviewAccess,
  useStartCandidateInterview,
} from "@/features/candidate-interview/hooks/use-candidate-interview";
import { getApiErrorMessage } from "@/utils/api-error-handler";

export function CandidateInterviewLobbyPage({ token }: { token: string }) {
  const router = useRouter();
  const [deviceStatus, setDeviceStatus] = useState<CameraPreviewStatus>({
    camera: "idle",
    microphone: "idle",
    errorMessage: "",
  });
  const accessQuery = useCandidateInterviewAccess(token);
  const startMutation = useStartCandidateInterview(token);
  const info = accessQuery.data?.data;

  const canStart =
    !!info &&
    deviceStatus.camera === "granted" &&
    deviceStatus.microphone === "granted" &&
    !startMutation.isPending;

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", p: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Interview Device Check
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Make sure your camera and microphone are ready before starting.
          </Typography>
        </Box>

        {accessQuery.isError ? (
          <Alert severity="error">{getApiErrorMessage(accessQuery.error)}</Alert>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.1fr) minmax(360px,0.9fr)" }, gap: 3 }}>
          <CameraPreview onStatusChange={setDeviceStatus} />

          <Stack spacing={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Readiness
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip label={`Camera ${deviceStatus.camera}`} color={deviceStatus.camera === "granted" ? "success" : "default"} />
                    <Chip label={`Microphone ${deviceStatus.microphone}`} color={deviceStatus.microphone === "granted" ? "success" : "default"} />
                    <Chip label={info ? `Session ${info.ai_interview_session.session_status.toLowerCase()}` : "Validating link"} color={info ? "primary" : "default"} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Start stays disabled until your invite is valid and both camera and microphone are available.
                  </Typography>
                  <Button
                    variant="contained"
                    disabled={!canStart}
                    onClick={async () => {
                      await startMutation.mutateAsync();
                      router.push(`/interview/join/${token}/session`);
                    }}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {startMutation.isPending ? "Starting..." : "Start Interview"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <InterviewInstructionsCard />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
