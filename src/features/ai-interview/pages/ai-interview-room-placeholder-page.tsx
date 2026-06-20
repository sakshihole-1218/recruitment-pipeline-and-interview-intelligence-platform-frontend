"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  VideoCall as VideoCallIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import type { AiInterviewRoomLaunchContext } from "@/features/ai-interview/types/ai-interview.types";

const ROOM_SESSION_STORAGE_PREFIX = "ai-interview-room";

function readRoomLaunchContext(interviewId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(
    `${ROOM_SESSION_STORAGE_PREFIX}:${interviewId}`,
  );

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AiInterviewRoomLaunchContext;
  } catch {
    return null;
  }
}

export function AiInterviewRoomPlaceholderPage({ id }: { id: string }) {
  const [context] = useState<AiInterviewRoomLaunchContext | null>(() =>
    readRoomLaunchContext(id),
  );

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.INTERVIEWS} underline="hover" color="inherit">
          Interviews
        </Link>
        <Link component={NextLink} href={`${ROUTES.INTERVIEWS}/${id}/ai-room`} underline="hover" color="inherit">
          AI Interview Lobby
        </Link>
        <Typography color="text.primary">Interview Room</Typography>
      </Breadcrumbs>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <VideoCallIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  AI Interview Room Placeholder
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lobby handoff is complete. This screen is ready for the next room UI step.
                </Typography>
              </Box>
            </Stack>

            {!context ? (
              <Alert severity="warning">
                Room launch data was not found in this browser session. Return to the lobby and join again.
              </Alert>
            ) : (
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  Session ID: {context.sessionId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Room Name: {context.roomName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participant: {context.participantDisplayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  LiveKit URL: {context.livekitUrl}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Token prepared and stored for the upcoming room connection flow.
                </Typography>
              </Stack>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={NextLink}
                href={`${ROUTES.INTERVIEWS}/${id}/ai-room`}
                variant="outlined"
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                Back to Lobby
              </Button>
              <Button
                component={NextLink}
                href={`${ROUTES.INTERVIEWS}/${id}`}
                variant="contained"
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Interview Details
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
