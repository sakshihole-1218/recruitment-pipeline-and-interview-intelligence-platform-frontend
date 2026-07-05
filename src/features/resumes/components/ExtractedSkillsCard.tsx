"use client";

import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import { extractSkillLabels } from "@/features/resumes/types/resumeAnalysis.types";

export function ExtractedSkillsCard({ skills }: { skills: unknown }) {
  const skillLabels = extractSkillLabels(skills);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.4}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Extracted Skills
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-detected skills surfaced from the uploaded resume.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2.5, flexWrap: "wrap" }}>
          {skillLabels.length > 0 ? (
            skillLabels.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No extracted skills available yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
