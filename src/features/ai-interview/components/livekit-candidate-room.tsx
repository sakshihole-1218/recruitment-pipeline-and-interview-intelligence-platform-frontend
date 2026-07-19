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
        position: "relative",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.1)",
        bgcolor: "#0F172A",
        boxShadow: "inset 0 0 100px rgba(139, 92, 246, 0.1)",
      }}
    >
      {tracks[0] ? (
        <Box sx={{ position: "absolute", inset: 16 }}>
          <ParticipantTile
            trackRef={tracks[0]}
            style={{ 
              height: "100%", 
              width: "100%", 
              borderRadius: "16px", 
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.15)"
            }}
          />
        </Box>
      ) : (
        <Stack
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "center", height: "100%", color: "common.white", p: 3 }}
        >
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s infinite" }}>
            <CircularProgress size={32} sx={{ color: "primary.light" }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.5px" }}>Waiting for camera feed...</Typography>
          <Typography variant="body2" sx={{ color: "grey.400", textAlign: "center", maxWidth: 300 }}>
            Your local participant tile will float here once video is connected and available.
          </Typography>
        </Stack>
      )}
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
        p: 2.5,
        mt: 2,
        borderRadius: 4,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        bgcolor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(16px)",
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
        sx={{ 
          borderRadius: 3, 
          fontWeight: 700, 
          minWidth: 180,
          boxShadow: "0 4px 14px rgba(211, 47, 47, 0.4)",
          "&:hover": { boxShadow: "0 6px 20px rgba(211, 47, 47, 0.6)" }
        }}
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
