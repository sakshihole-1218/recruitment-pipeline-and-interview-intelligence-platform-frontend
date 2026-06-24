"use client";

import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Download as DownloadIcon, VisibilityOff as NoPreviewIcon } from "@mui/icons-material";

import { envConfig } from "@/config/env.config";
import { resolveAbsoluteUrl } from "@/utils/url";

function isPdf(fileName: string | null | undefined, mimeType: string | null | undefined) {
  const normalizedFileName = String(fileName ?? "").toLowerCase();
  const normalizedMimeType = String(mimeType ?? "").toLowerCase();

  return normalizedMimeType.includes("pdf") || normalizedFileName.endsWith(".pdf");
}

export function ResumeViewer({
  fileUrl,
  fileName,
  mimeType,
}: {
  fileUrl: string | null | undefined;
  fileName: string | null | undefined;
  mimeType: string | null | undefined;
}) {
  const resolvedUrl = resolveAbsoluteUrl(fileUrl, envConfig.apiBaseUrl);
  const previewable = isPdf(fileName, mimeType);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2.5 }}
        >
          <Stack spacing={0.3}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Resume Viewer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preview the uploaded resume when a PDF is available, or download the file directly.
            </Typography>
          </Stack>

          {resolvedUrl ? (
            <Button
              component="a"
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ fontWeight: 900, borderRadius: 2 }}
            >
              Download Resume
            </Button>
          ) : null}
        </Stack>

        {resolvedUrl && previewable ? (
          <iframe
            src={resolvedUrl}
            title={fileName ?? "Resume preview"}
            style={{
              width: "100%",
              minHeight: "720px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: "16px",
            }}
          />
        ) : (
          <Stack
            spacing={1}
            sx={{
              minHeight: 240,
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <NoPreviewIcon color="disabled" sx={{ fontSize: 36 }} />
            <Typography sx={{ fontWeight: 900 }}>
              {resolvedUrl
                ? "Preview unavailable for this file type"
                : "Resume preview unavailable"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {resolvedUrl
                ? "DOC and DOCX files can still be downloaded and opened locally."
                : "This resume does not have a viewable file URL yet."}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
