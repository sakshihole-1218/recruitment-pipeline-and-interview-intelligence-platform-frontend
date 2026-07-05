"use client";

import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import type { ResumeAiAnalysisResponse } from "@/features/resumes/types/resumeAnalysis.types";

const SUMMARY_ITEMS: Array<{
  key: keyof Pick<
    ResumeAiAnalysisResponse,
    "experience_summary" | "education_summary" | "project_summary" | "certification_summary"
  >;
  title: string;
  description: string;
}> = [
  {
    key: "experience_summary",
    title: "Experience Summary",
    description: "AI-generated summary of the candidate's work experience.",
  },
  {
    key: "education_summary",
    title: "Education Summary",
    description: "AI-generated summary of the candidate's education background.",
  },
  {
    key: "project_summary",
    title: "Project Summary",
    description: "Highlights of notable projects detected in the resume.",
  },
  {
    key: "certification_summary",
    title: "Certification Summary",
    description: "Relevant certifications and credentials identified in the resume.",
  },
];

export function ResumeSummaryCards({
  analysis,
}: {
  analysis: ResumeAiAnalysisResponse;
}) {
  return (
    <Grid container spacing={2.5}>
      {SUMMARY_ITEMS.map((item) => (
        <Grid key={item.key} size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", height: "100%" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={1}>
                <Stack spacing={0.3}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Stack>
                <Typography variant="body2" color={analysis[item.key] ? "text.primary" : "text.secondary"}>
                  {analysis[item.key] || "No AI summary available yet."}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
