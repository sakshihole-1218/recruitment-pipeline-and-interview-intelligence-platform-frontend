"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { TaskAlt as CompletedIcon } from "@mui/icons-material";

export function CandidateInterviewCompletedPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card elevation={0} sx={{ width: "100%", maxWidth: 760, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 5 }}>
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <CompletedIcon color="success" sx={{ fontSize: 56 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Interview Completed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thank you for completing your interview.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your responses have been submitted successfully. The recruitment team will review your interview and contact you regarding next steps.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
