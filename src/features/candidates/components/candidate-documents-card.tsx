"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CheckCircle as LatestIcon,
  Download as DownloadIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";

import type { CandidateDocumentResponse } from "@/features/candidates/types/candidates.types";
import { CANDIDATE_DOCUMENT_TYPE_LABELS } from "@/features/candidates/types/candidates.types";
import { envConfig } from "@/config/env.config";
import { resolveAbsoluteUrl } from "@/utils/url";

type CandidateDocumentsCardProps = {
  documents?: CandidateDocumentResponse[];
  isLoading?: boolean;
  canUpload?: boolean;
  onUploadClick?: () => void;
  onMarkLatest?: (doc: CandidateDocumentResponse) => void;
  markingLatestId?: string | null;
};

export function CandidateDocumentsCard({
  documents,
  isLoading,
  canUpload,
  onUploadClick,
  onMarkLatest,
  markingLatestId,
}: CandidateDocumentsCardProps) {
  const sortedDocuments = (documents ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_latest && !b.is_latest) return -1;
      if (!a.is_latest && b.is_latest) return 1;
      return String(b.created_at).localeCompare(String(a.created_at));
    });

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resumes and supporting documents uploaded for this candidate.
            </Typography>
          </Box>

          {canUpload ? (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={onUploadClick}
              sx={{ fontWeight: 900, borderRadius: 2 }}
            >
              Upload
            </Button>
          ) : null}
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {isLoading ? (
          <Stack spacing={1.5}>
            <Skeleton height={42} />
            <Skeleton height={42} />
            <Skeleton height={42} />
          </Stack>
        ) : sortedDocuments.length > 0 ? (
          <Stack spacing={1.5}>
            {sortedDocuments.map((doc) => (
              <Card key={doc.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          {doc.file_name}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={CANDIDATE_DOCUMENT_TYPE_LABELS[doc.document_type]}
                        />
                        {doc.is_latest ? (
                          <Chip
                            size="small"
                            icon={<LatestIcon fontSize="small" />}
                            color="success"
                            label="Latest"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : null}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {doc.mime_type ?? "Unknown type"}
                        {doc.file_size ? ` • ${doc.file_size} bytes` : ""}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {doc.file_url ? (
                        <Tooltip title="Open / Download">
                          <Button
                            component="a"
                            href={resolveAbsoluteUrl(doc.file_url, envConfig.apiBaseUrl) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            sx={{ fontWeight: 800, borderRadius: 2 }}
                          >
                            View
                          </Button>
                        </Tooltip>
                      ) : null}

                      {onMarkLatest && doc.document_type === "RESUME" && !doc.is_latest ? (
                        <Button
                          onClick={() => onMarkLatest(doc)}
                          disabled={!!markingLatestId}
                          variant="contained"
                          color="success"
                          sx={{ fontWeight: 900, borderRadius: 2 }}
                        >
                          {markingLatestId === doc.id ? "Marking..." : "Mark Latest"}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 900 }}>No documents</Typography>
            <Typography variant="body2" color="text.secondary">
              {canUpload
                ? "Upload a resume or supporting document to get started."
                : "No documents have been uploaded yet."}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
