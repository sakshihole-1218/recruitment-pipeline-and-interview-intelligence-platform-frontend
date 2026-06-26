"use client";

import { Box, Tab, Tabs } from "@mui/material";

export const DECISION_TAB_VALUES = [
  "overview",
  "resume-analysis",
  "interview-feedback",
  "transcript",
  "interviewer-reviews",
  "decision",
] as const;

export type DecisionTabValue = (typeof DECISION_TAB_VALUES)[number];

export function DecisionTabs({
  value,
  onChange,
}: {
  value: DecisionTabValue;
  onChange: (value: DecisionTabValue) => void;
}) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 1,
      }}
    >
      <Tabs
        value={value}
        onChange={(_event, nextValue: DecisionTabValue) => onChange(nextValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 56,
          "& .MuiTab-root": {
            minHeight: 56,
            fontWeight: 800,
            textTransform: "none",
          },
        }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Resume Analysis" value="resume-analysis" />
        <Tab label="Interview Feedback" value="interview-feedback" />
        <Tab label="Transcript" value="transcript" />
        <Tab label="Interviewer Reviews" value="interviewer-reviews" />
        <Tab label="Decision" value="decision" />
      </Tabs>
    </Box>
  );
}
