"use client";

import { useMemo, useState } from "react";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type CandidateOption = {
  id: string;
  label: string;
  email: string;
};

type ApplicationOption = {
  id: string;
  label: string;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getFileValidationError(file: File | null) {
  if (!file) return "Choose a PDF, DOC, or DOCX file to upload.";

  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMimeType =
    !file.type || ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number]);

  if (!hasValidExtension && !hasValidMimeType) {
    return "Only PDF, DOC, and DOCX files are supported.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File size must be 10 MB or less.";
  }

  return "";
}

export function ResumeUploadDialog({
  open,
  loading,
  candidates,
  applications,
  onClose,
  onCandidateChange,
  onUpload,
}: {
  open: boolean;
  loading?: boolean;
  candidates: CandidateOption[];
  applications: ApplicationOption[];
  onClose: () => void;
  onCandidateChange: (candidateId: string | null) => void;
  onUpload: (payload: {
    candidateId: string;
    applicationId?: string;
    file: File;
  }) => Promise<void> | void;
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateOption | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationOption | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fileHelperText = useMemo(() => {
    const validationError = getFileValidationError(file);
    if (validationError) return validationError;

    if (!file) return "Choose a PDF, DOC, or DOCX file to upload.";

    return `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  }, [file]);

  const canSubmit =
    !!selectedCandidate && !!file && !getFileValidationError(file) && !loading;

  const handleClose = () => {
    setSelectedCandidate(null);
    setSelectedApplication(null);
    setFile(null);
    onCandidateChange(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Upload Resume</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Upload a new resume and optionally link it to a job application so AI analysis can use the right context.
          </Typography>

          <Autocomplete
            options={candidates}
            value={selectedCandidate}
            onChange={(_event, value) => {
              setSelectedCandidate(value);
              setSelectedApplication(null);
              onCandidateChange(value?.id ?? null);
            }}
            getOptionLabel={(option) => option.label}
            disabled={loading}
            renderInput={(params) => <TextField {...params} label="Candidate" required />}
          />

          <Autocomplete
            options={applications}
            value={selectedApplication}
            onChange={(_event, value) => setSelectedApplication(value)}
            getOptionLabel={(option) => option.label}
            disabled={loading || !selectedCandidate}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Job Application"
                helperText="Optional, but recommended for better fit analysis."
              />
            )}
          />

          <Button component="label" variant="outlined" disabled={loading} sx={{ fontWeight: 800 }}>
            Choose Resume File
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
              }}
            />
          </Button>

          <Typography
            variant="caption"
            color={getFileValidationError(file) ? "error.main" : "text.secondary"}
          >
            {fileHelperText}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() => {
            if (!selectedCandidate || !file) return;
            void onUpload({
              candidateId: selectedCandidate.id,
              applicationId: selectedApplication?.id,
              file,
            });
          }}
          sx={{ fontWeight: 900 }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
