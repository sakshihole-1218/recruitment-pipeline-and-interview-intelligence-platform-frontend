"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  CANDIDATE_DOCUMENT_TYPES,
  CANDIDATE_DOCUMENT_TYPE_LABELS,
  type CandidateDocumentType,
} from "@/features/candidates/types/candidates.types";

export interface CandidateDocumentUploaderProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onUpload: (payload: { document_type: CandidateDocumentType; is_latest?: boolean; file: File }) =>
    | void
    | Promise<void>;
}

export function CandidateDocumentUploader({
  open,
  loading,
  onClose,
  onUpload,
}: CandidateDocumentUploaderProps) {
  const [documentType, setDocumentType] = useState<CandidateDocumentType>("RESUME");
  const [isLatest, setIsLatest] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const helper = useMemo(() => {
    if (!file) return "Choose a file to upload.";
    const mb = file.size / (1024 * 1024);
    return `Selected: ${file.name} (${mb.toFixed(2)} MB)`;
  }, [file]);

  const canSubmit = !!file && !loading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>Upload Document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Upload resumes and other supporting documents to keep the profile complete.
          </Typography>

          <TextField
            select
            label="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as CandidateDocumentType)}
            disabled={loading}
          >
            {CANDIDATE_DOCUMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {CANDIDATE_DOCUMENT_TYPE_LABELS[t]}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={isLatest}
                onChange={(_e, checked) => setIsLatest(checked)}
                disabled={loading || documentType !== "RESUME"}
                color="success"
              />
            }
            label={
              <Typography sx={{ fontWeight: 700 }}>
                Mark as latest resume
              </Typography>
            }
          />

          <Button
            component="label"
            variant="outlined"
            disabled={loading}
            sx={{ justifyContent: "flex-start", fontWeight: 800 }}
          >
            Choose File
            <input
              type="file"
              hidden
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
              }}
            />
          </Button>

          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!file) return;
            void onUpload({
              document_type: documentType,
              is_latest: documentType === "RESUME" ? isLatest : undefined,
              file,
            });
          }}
          disabled={!canSubmit}
          variant="contained"
          sx={{ fontWeight: 900 }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
