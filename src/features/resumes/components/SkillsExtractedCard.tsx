"use client";

import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

function extractSkillLabels(skills: unknown): string[] {
  if (Array.isArray(skills)) {
    return skills
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  if (skills && typeof skills === "object") {
    const record = skills as Record<string, unknown>;

    if (Array.isArray(record.skills)) {
      return record.skills
        .map((value) => String(value).trim())
        .filter(Boolean);
    }

    return Object.values(record)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  return [];
}

export function SkillsExtractedCard({ skills }: { skills: unknown }) {
  const skillLabels = extractSkillLabels(skills);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.4}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Skills Extracted
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
