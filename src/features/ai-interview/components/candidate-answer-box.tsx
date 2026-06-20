"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Send as SubmitIcon,
} from "@mui/icons-material";

interface CandidateAnswerBoxProps {
  disabled?: boolean;
  submitPending?: boolean;
  onSubmitAnswer: (messageText: string) => Promise<void> | void;
}

export function CandidateAnswerBox({
  disabled,
  submitPending,
  onSubmitAnswer,
}: CandidateAnswerBoxProps) {
  const [messageText, setMessageText] = useState("");

  const handleSubmit = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || disabled || submitPending) return;

    await onSubmitAnswer(trimmed);
    setMessageText("");
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
              Candidate Answer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Temporary manual entry to simulate speech before STT is added.
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
            disabled={disabled || submitPending}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "flex-start", alignItems: { xs: "stretch", md: "center" } }}
          >
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={handleSubmit}
              disabled={disabled || submitPending || !messageText.trim()}
              sx={{ borderRadius: 2, fontWeight: 900, minWidth: 170 }}
            >
              {submitPending ? "Submitting..." : "Submit Answer"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
