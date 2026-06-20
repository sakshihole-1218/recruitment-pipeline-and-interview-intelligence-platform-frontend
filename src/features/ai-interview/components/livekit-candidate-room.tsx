"use client";

import { useMemo, useState } from "react";
import {
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Track, Room } from "livekit-client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { CallEnd as EndCallIcon } from "@mui/icons-material";
import { useEffect } from "react";

import type { LivekitAccessTokenResponse } from "@/features/ai-interview/types/ai-interview.types";

interface LiveKitCandidateRoomProps {
  tokenDetails: LivekitAccessTokenResponse;
  children: React.ReactNode;
}

interface LiveKitRoomControlsProps {
  onEndInterview: () => Promise<void> | void;
  endPending?: boolean;
}

export function LiveKitCandidateStage() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 420,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.950",
      }}
    >
      <Box sx={{ p: 2, height: "100%" }}>
        {tracks[0] ? (
          <ParticipantTile
            trackRef={tracks[0]}
            style={{ height: "100%", width: "100%", borderRadius: 16, overflow: "hidden" }}
          />
        ) : (
          <Stack
            spacing={1.5}
            sx={{ alignItems: "center", justifyContent: "center", height: "100%", color: "common.white" }}
          >
            <Typography sx={{ fontWeight: 800 }}>Waiting for camera feed...</Typography>
            <Typography variant="body2" sx={{ color: "grey.300" }}>
              Your local participant tile will appear here once video is available.
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export function LiveKitRoomControls({
  onEndInterview,
  endPending,
}: LiveKitRoomControlsProps) {
  const room = useRoomContext();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleEnd = async () => {
    if (disconnecting || endPending) return;
    setDisconnecting(true);

    try {
      room.disconnect();
      await onEndInterview();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        p: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <ControlBar
        variation="minimal"
        controls={{ screenShare: false, chat: false, leave: false, settings: false }}
      />

      <Button
        variant="contained"
        color="error"
        startIcon={<EndCallIcon />}
        onClick={handleEnd}
        disabled={disconnecting || endPending}
        sx={{ borderRadius: 2, fontWeight: 900, minWidth: 180 }}
      >
        {disconnecting || endPending ? "Ending..." : "End Interview"}
      </Button>
    </Stack>
  );
}

export function LiveKitCandidateRoom({
  tokenDetails,
  children,
}: LiveKitCandidateRoomProps) {
  const [roomError, setRoomError] = useState<string>("");
  const room = useMemo(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, [room]);

  return (
    <LiveKitRoom
      room={room}
      token={tokenDetails.token}
      serverUrl={tokenDetails.livekit_url}
      connect
      video
      audio
      onError={(error) => setRoomError(error.message || "Failed to connect to the LiveKit room.")}
      style={{ height: "100%" }}
    >
      <RoomAudioRenderer />

      <Box
        sx={{
          display: "flex",
          minHeight: 0,
          height: "100%",
        }}
      >
        {roomError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {roomError}
          </Alert>
        ) : null}

        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>{children}</Box>
      </Box>
    </LiveKitRoom>
  );
}

export function LiveKitRoomLoadingState() {
  return (
    <LiveKitRoomStatusCard
      title="Preparing your interview room..."
      description="We’re connecting your candidate session to LiveKit."
    />
  );
}

export function InterviewDataLoadingState() {
  return (
    <LiveKitRoomStatusCard
      title="Loading interview data..."
      description="We’re fetching interview questions and transcripts for this session."
    />
  );
}

function LiveKitRoomStatusCard({
  title,
  description,
}: {
  title: string;
  description: string;
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
