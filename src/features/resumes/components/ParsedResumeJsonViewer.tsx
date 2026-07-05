"use client";

import type { ReactNode } from "react";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrimitive(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function renderNode(node: unknown, depth = 0): ReactNode {
  if (node === null || node === undefined) {
    return (
      <Typography variant="body2" color="text.secondary">
        No parsed data available.
      </Typography>
    );
  }

  if (Array.isArray(node)) {
    if (node.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No entries available.
        </Typography>
      );
    }

    return (
      <Stack spacing={1.2}>
        {node.map((item, index) => (
          <Stack
            key={`${depth}-${index}`}
            spacing={0.8}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Item {index + 1}
            </Typography>
            {renderNode(item, depth + 1)}
          </Stack>
        ))}
      </Stack>
    );
  }

  if (typeof node === "object") {
    // Filter out internal and redundant fields from being displayed
    const EXCLUDED_KEYS = new Set([
      "context",
      "extracted_text",
      "skills", // Rendered in ExtractedSkillsCard
      "ai_fit_score", // Rendered in ScoreCard
      "experience_summary", // Rendered in SummaryCards
      "education_summary", // Rendered in SummaryCards
      "project_summary", // Rendered in SummaryCards
      "certification_summary", // Rendered in SummaryCards
    ]);

    const entries = Object.entries(node as Record<string, unknown>).filter(
      ([key]) => !EXCLUDED_KEYS.has(key)
    );

    if (entries.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No parsed fields available.
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5}>
        {entries.map(([key, value]) => (
          <Stack key={`${depth}-${key}`} spacing={0.6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {toTitleCase(key)}
            </Typography>
            {typeof value === "object" && value !== null ? (
              <Stack
                spacing={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                {renderNode(value, depth + 1)}
              </Stack>
            ) : (
              <Typography variant="body2">{formatPrimitive(value)}</Typography>
            )}
          </Stack>
        ))}
      </Stack>
    );
  }

  return <Typography variant="body2">{formatPrimitive(node)}</Typography>;
}

export function ParsedResumeJsonViewer({ data }: { data: unknown }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={0.3}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Parsed Resume Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Structured fields extracted from the resume for recruiter review.
          </Typography>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {renderNode(data)}
      </CardContent>
    </Card>
  );
}
