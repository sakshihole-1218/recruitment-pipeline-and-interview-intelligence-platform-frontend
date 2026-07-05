"use client";

import { Alert, Stack } from "@mui/material";

import { ResumeAnalysisActions } from "@/features/resumes/components/ResumeAnalysisActions";
import { ResumeAnalysisScoreCard } from "@/features/resumes/components/ResumeAnalysisScoreCard";
import { ExtractedSkillsCard } from "@/features/resumes/components/ExtractedSkillsCard";
import { ParsedResumeJsonViewer } from "@/features/resumes/components/ParsedResumeJsonViewer";
import { ResumeSummaryCards } from "@/features/resumes/components/ResumeSummaryCards";
import type {
  ResumeAiAnalysisResponse,
  ResumeRowStatus,
} from "@/features/resumes/types/resumeAnalysis.types";

export function ResumeAnalysisPanel({
  analysis,
  status,
  isFetching,
  isCreating,
  isRunning,
  isReanalyzing,
  isResumeMissing,
  isUnsupportedType,
  backendError,
  onAnalyze,
  onReanalyze,
  onRetry,
}: {
  analysis: ResumeAiAnalysisResponse | null;
  status: ResumeRowStatus;
  isFetching: boolean;
  isCreating: boolean;
  isRunning: boolean;
  isReanalyzing: boolean;
  isResumeMissing: boolean;
  isUnsupportedType: boolean;
  backendError: string;
  onAnalyze: () => void;
  onReanalyze: () => void;
  onRetry: () => void;
}) {
  const isBusy = isCreating || isRunning || isReanalyzing;
  const failureReason = analysis?.failure_reason ?? "";
  const isExtractedTextFailure =
    status === "FAILED" &&
    failureReason.toLowerCase().includes("extracted text");
  const runningLabel = isCreating
    ? "Creating analysis..."
    : isRunning
      ? "Analyzing resume..."
      : isReanalyzing
        ? "Re-analyzing..."
        : null;

  return (
    <Stack spacing={2.5}>
      <ResumeAnalysisScoreCard analysis={analysis} status={status} />

      {isFetching ? <Alert severity="info">Fetching existing analysis...</Alert> : null}
      {backendError ? <Alert severity="error">{backendError}</Alert> : null}
      {isResumeMissing ? (
        <Alert severity="error">
          Resume document missing. This record no longer has an accessible uploaded file.
        </Alert>
      ) : null}
      {isUnsupportedType ? (
        <Alert severity="warning">
          Unsupported document type. Upload a PDF, DOC, or DOCX resume to run AI analysis.
        </Alert>
      ) : null}

      {!isResumeMissing && !isUnsupportedType ? (
        <ResumeAnalysisActions
          canAnalyze={!analysis}
          canReanalyze={Boolean(analysis && status === "COMPLETED")}
          canRetry={Boolean(analysis && status === "FAILED")}
          runningLabel={runningLabel}
          isBusy={isBusy}
          onAnalyze={onAnalyze}
          onReanalyze={onReanalyze}
          onRetry={onRetry}
        />
      ) : null}

      {!analysis && !isBusy && !isResumeMissing && !isUnsupportedType ? (
        <Alert severity="info">
          No AI analysis exists for this resume yet. Start the analysis when you&apos;re ready.
        </Alert>
      ) : null}

      {status === "PENDING" || status === "PROCESSING" ? (
        <Alert severity="info">Analyzing resume...</Alert>
      ) : null}

      {status === "FAILED" && analysis?.failure_reason ? (
        <Alert severity="error">
          {isExtractedTextFailure
            ? "This resume cannot be analyzed yet because the backend AI flow requires extracted resume text, but the current system only stores the uploaded PDF/DOC/DOCX file. Resume text extraction needs to be added on the backend before Gemini analysis can succeed."
            : analysis.failure_reason}
        </Alert>
      ) : null}

      {analysis && status === "COMPLETED" ? (
        <>
          <ExtractedSkillsCard skills={analysis.skills_extracted} />
          <ResumeSummaryCards analysis={analysis} />
          {analysis.parsed_resume_json ? (
            <ParsedResumeJsonViewer data={analysis.parsed_resume_json} />
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
