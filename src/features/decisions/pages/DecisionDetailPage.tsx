"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  EditOutlined as EditIcon,
  GavelOutlined as DecisionIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/api-error-handler";
import { resolveAbsoluteUrl } from "@/utils/url";
import { envConfig } from "@/config/env.config";
import { useDecision } from "@/features/decisions/hooks/use-decisions";
import { useDecisionsPermissions } from "@/features/decisions/hooks/use-decisions-permissions";
import { DecisionSummaryCards } from "@/features/decisions/components/DecisionSummaryCards";
import {
  DecisionTabs,
  type DecisionTabValue,
} from "@/features/decisions/components/DecisionTabs";
import {
  DECISION_STATUS_LABELS,
  type DecisionReadiness,
} from "@/features/decisions/types/decision.types";
import {
  APPLICATION_STAGE_LABELS,
  type ApplicationResponse,
} from "@/features/applications/types/applications.types";
import {
  RECOMMENDATION_LABELS,
  type AiInterviewRecommendation,
  type FeedbackResponse,
  type InterviewerRecommendation,
  type InterviewerReviewResponse,
} from "@/features/feedback/types/feedback.types";
import type { UserResponse } from "@/features/users/types/users.types";
import type { ResumeAiAnalysisResponse } from "@/features/resumes/types/resume.types";
import type {
  AiInterviewQuestionResponse,
  AiInterviewTranscriptEntryResponse,
} from "@/features/ai-interview/types/ai-interview.types";
import { useApplication } from "@/features/applications/hooks/use-applications";
import { useCandidate, useCandidateDocuments } from "@/features/candidates/hooks/use-candidates";
import { useJobOpening } from "@/features/job-openings/hooks/use-job-openings";
import { useFeedbackQuestions, useFeedbackSession, useFeedbackTranscripts } from "@/features/feedback/hooks/use-feedback";
import { feedbackService } from "@/features/feedback/services/feedback.service";
import { interviewerReviewService } from "@/features/feedback/services/interviewerReview.service";
import { resumeService } from "@/features/resumes/services/resume.service";
import { usersService } from "@/features/users/services/users.service";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

function extractSkillLabels(skills: unknown): string[] {
  if (Array.isArray(skills)) {
    return skills.map((item) => String(item).trim()).filter(Boolean);
  }

  if (skills && typeof skills === "object") {
    const record = skills as Record<string, unknown>;

    if (Array.isArray(record.skills)) {
      return record.skills.map((item) => String(item).trim()).filter(Boolean);
    }

    return Object.values(record)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [];
}

function averageReviewScore(review?: InterviewerReviewResponse) {
  if (!review) return null;

  const scores = [
    review.technical_score,
    review.communication_score,
    review.problem_solving_score,
    review.culture_fit_score,
  ].filter((value): value is number => value !== null && value !== undefined);

  if (scores.length === 0) return null;

  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function getRecommendationVote(
  reviews: InterviewerReviewResponse[],
): InterviewerRecommendation | null {
  const submitted = reviews.filter((review) => review.review_status === "SUBMITTED");
  const counts = new Map<InterviewerRecommendation, number>();

  for (const review of submitted) {
    if (!review.interviewer_recommendation) continue;

    const current = counts.get(review.interviewer_recommendation) ?? 0;
    counts.set(review.interviewer_recommendation, current + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
}

function getDecisionReadiness({
  application,
  feedback,
  interviewerReviews,
}: {
  application: ApplicationResponse | null | undefined;
  feedback: FeedbackResponse | null;
  interviewerReviews: InterviewerReviewResponse[];
}): DecisionReadiness {
  const missingItems: string[] = [];
  const eligibleStages = new Set(["DECISION", "OFFER", "HIRED", "REJECTED"]);

  if (!application || !eligibleStages.has(application.current_stage)) {
    missingItems.push("Application has not completed the interview process yet.");
  }

  if (!feedback || feedback.feedback_status !== "COMPLETED") {
    missingItems.push("Completed AI interview feedback is required.");
  }

  const submittedReviews = interviewerReviews.filter(
    (review) => review.review_status === "SUBMITTED",
  );

  if (submittedReviews.length === 0) {
    missingItems.push("At least one submitted interviewer review is required.");
  }

  return {
    canCreateOrUpdate: missingItems.length === 0,
    missingItems,
  };
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Grid>
  );
}

function buildQuestionGroups(questions: AiInterviewQuestionResponse[]) {
  const roots = questions.filter((question) => !question.is_follow_up);
  const followUpsByParent = new Map<string, AiInterviewQuestionResponse[]>();

  for (const question of questions) {
    if (!question.is_follow_up || !question.parent_question_id) continue;

    const list = followUpsByParent.get(question.parent_question_id) ?? [];
    list.push(question);
    followUpsByParent.set(question.parent_question_id, list);
  }

  return roots.map((root) => ({
    root,
    followUps: (followUpsByParent.get(root.id) ?? []).sort(
      (a, b) => a.sequence_number - b.sequence_number,
    ),
  }));
}

export function DecisionDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { canEditDecision } = useDecisionsPermissions();
  const [activeTab, setActiveTab] = useState<DecisionTabValue>("overview");

  const decisionQuery = useDecision(id);
  const decision = decisionQuery.data?.data;

  const applicationQuery = useApplication(decision?.application_id ?? "");
  const application = applicationQuery.data?.data;

  const candidateQuery = useCandidate(application?.candidate_id ?? "");
  const candidate = candidateQuery.data?.data;

  const jobOpeningQuery = useJobOpening(application?.job_opening_id ?? "");
  const jobOpening = jobOpeningQuery.data?.data;

  const candidateDocumentsQuery = useCandidateDocuments(candidate?.id ?? "");

  const supportingQueries = useQueries({
    queries: [
      {
        queryKey: ["decisions", "feedback-by-application", application?.id],
        queryFn: async () => {
          const response = await feedbackService.list({
            application_id: application!.id,
            page: 1,
            limit: 1,
            sort_by: "generated_at",
            sort_order: "desc",
          });

          const data = Array.isArray(response.data)
            ? response.data
            : response.data.data;

          return data[0] ?? null;
        },
        enabled: !!application?.id,
      },
      {
        queryKey: ["decisions", "reviews-by-application", application?.id],
        queryFn: async () => {
          const response = await interviewerReviewService.getByApplication(application!.id);
          return response.data;
        },
        enabled: !!application?.id,
      },
      {
        queryKey: ["decisions", "resume-by-application", application?.id, candidate?.id],
        queryFn: async () => {
          if (application?.id) {
            const response = await resumeService.listAnalyses({
              application_id: application.id,
              page: 1,
              limit: 1,
              sort_by: "analyzed_at",
              sort_order: "desc",
            });

            const analyses = Array.isArray(response.data)
              ? response.data
              : response.data.data;

            if (analyses[0]) return analyses[0];
          }

          if (candidate?.id) {
            const fallback = await resumeService.getLatestAnalysisByCandidate(candidate.id);
            return fallback.data;
          }

          return null;
        },
        enabled: !!application?.id || !!candidate?.id,
      },
      {
        queryKey: ["decisions", "decider", decision?.decided_by_user_id],
        queryFn: async () => {
          const response = await usersService.getById(decision!.decided_by_user_id);
          return response.data;
        },
        enabled: !!decision?.decided_by_user_id,
      },
    ],
  });

  const feedback = (supportingQueries[0]?.data ?? null) as FeedbackResponse | null;
  const interviewerReviews = (supportingQueries[1]?.data ??
    []) as InterviewerReviewResponse[];
  const resumeAnalysis = (supportingQueries[2]?.data ??
    null) as ResumeAiAnalysisResponse | null;
  const decider = (supportingQueries[3]?.data ?? null) as UserResponse | null;

  const sessionId =
    decision?.ai_interview_session_id ?? feedback?.ai_interview_session_id ?? "";

  const sessionQuery = useFeedbackSession(sessionId);
  const transcriptQuery = useFeedbackTranscripts(sessionId);
  const questionQuery = useFeedbackQuestions(sessionId);

  const currentResume =
    candidateDocumentsQuery.data?.data.find(
      (document) =>
        document.id === resumeAnalysis?.candidate_document_id ||
        (document.document_type === "RESUME" && document.is_latest),
    ) ?? null;

  const readiness = getDecisionReadiness({
    application,
    feedback,
    interviewerReviews,
  });

  const candidateName = formatName(candidate?.first_name, candidate?.last_name);
  const humanRecommendation = getRecommendationVote(interviewerReviews);
  const summaryMetrics = {
    candidateName,
    resumeScore: resumeAnalysis?.ai_fit_score
      ? `${Number(resumeAnalysis.ai_fit_score).toFixed(1)} / 100`
      : "—",
    interviewScore: feedback?.overall_score
      ? `${Number(feedback.overall_score).toFixed(1)} / 100`
      : "—",
    humanRecommendation: humanRecommendation
      ? RECOMMENDATION_LABELS[humanRecommendation]
      : "Pending",
    currentStage: application?.current_stage
      ? APPLICATION_STAGE_LABELS[application.current_stage]
      : "—",
  };

  const pageError =
    (decisionQuery.isError && getApiErrorMessage(decisionQuery.error)) ||
    (applicationQuery.isError && getApiErrorMessage(applicationQuery.error)) ||
    "";

  const questions = questionQuery.data ?? [];
  const questionGroups = buildQuestionGroups(questions);
  const transcripts = transcriptQuery.data ?? [];
  const skills = extractSkillLabels(resumeAnalysis?.skills_extracted);

  if (decisionQuery.isError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load decision
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getApiErrorMessage(decisionQuery.error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => router.push(ROUTES.DECISIONS)}>
          Back to Decisions
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={NextLink} href={ROUTES.DECISIONS} underline="hover" color="inherit">
          Decisions
        </Link>
        <Typography color="text.primary">
          {decision ? candidateName : <Skeleton width={180} />}
        </Typography>
      </Breadcrumbs>

      <Stack spacing={3}>
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4 },
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant="text"
                  startIcon={<BackIcon />}
                  onClick={() => router.push(ROUTES.DECISIONS)}
                >
                  Back
                </Button>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DecisionIcon sx={{ color: "white" }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {candidateName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobOpening?.title ?? "Job opening"}
                  </Typography>
                </Box>
              </Stack>

              {decision ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={DECISION_STATUS_LABELS[decision.decision_status]}
                    color={
                      decision.decision_status === "HIRED" ||
                      decision.decision_status === "SELECTED"
                        ? "success"
                        : decision.decision_status === "REJECTED"
                          ? "error"
                          : "primary"
                    }
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    label={`Decision at ${formatDateTime(decision.decision_at)}`}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>
              ) : null}
            </Stack>

            {decision && canEditDecision ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`${ROUTES.DECISIONS}/${decision.id}/edit`)}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                Edit Decision
              </Button>
            ) : null}
          </Stack>
        </Box>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        {!readiness.canCreateOrUpdate ? (
          <Alert severity="warning">
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
              Some decision inputs are still missing
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {readiness.missingItems.map((item) => (
                <li key={item}>
                  <Typography variant="body2">{item}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        ) : null}

        <DecisionSummaryCards metrics={summaryMetrics} />

        <DecisionTabs value={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <Stack spacing={2.5}>
            <DetailCard title="Candidate Summary">
              <Grid container spacing={2}>
                <InfoItem label="Candidate Name" value={candidateName} />
                <InfoItem label="Email" value={candidate?.email ?? "—"} />
                <InfoItem label="Phone" value={candidate?.phone ?? "—"} />
                <InfoItem
                  label="Experience"
                  value={
                    resumeAnalysis?.total_experience_years_detected
                      ? `${resumeAnalysis.total_experience_years_detected} years`
                      : candidate?.total_experience_years
                        ? `${candidate.total_experience_years} years`
                        : "—"
                  }
                />
                <InfoItem label="Applied Role" value={jobOpening?.title ?? "—"} />
                <InfoItem label="Current Stage" value={summaryMetrics.currentStage} />
              </Grid>
            </DetailCard>

            <DetailCard title="Resume Summary">
              <Grid container spacing={2}>
                <InfoItem
                  label="Resume AI Fit Score"
                  value={
                    resumeAnalysis?.ai_fit_score
                      ? `${Number(resumeAnalysis.ai_fit_score).toFixed(1)} / 100`
                      : "—"
                  }
                />
                <InfoItem
                  label="Experience Summary"
                  value={resumeAnalysis?.experience_summary ?? "No AI summary available."}
                />
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Skills
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }} useFlexGap>
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <Chip key={skill} label={skill} variant="outlined" color="primary" sx={{ fontWeight: 800 }} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No extracted skills found.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DetailCard>

            <DetailCard title="Interview Summary">
              <Grid container spacing={2}>
                <InfoItem label="Technical Score" value={feedback?.technical_score ?? "—"} />
                <InfoItem
                  label="Communication Score"
                  value={feedback?.communication_score ?? "—"}
                />
                <InfoItem
                  label="Problem Solving Score"
                  value={feedback?.problem_solving_score ?? "—"}
                />
                <InfoItem
                  label="Experience Relevance Score"
                  value={feedback?.experience_relevance_score ?? "—"}
                />
                <InfoItem label="Overall AI Score" value={feedback?.overall_score ?? "—"} />
              </Grid>
            </DetailCard>

            <DetailCard title="Human Interview Review">
              <Grid container spacing={2}>
                <InfoItem
                  label="Technical Rating"
                  value={
                    interviewerReviews[0]?.technical_score ??
                    averageReviewScore(interviewerReviews[0]) ??
                    "—"
                  }
                />
                <InfoItem
                  label="Communication Rating"
                  value={interviewerReviews[0]?.communication_score ?? "—"}
                />
                <InfoItem
                  label="Recommendation"
                  value={
                    humanRecommendation
                      ? RECOMMENDATION_LABELS[humanRecommendation]
                      : "Pending"
                  }
                />
                <InfoItem
                  label="Review Notes"
                  value={
                    interviewerReviews[0]?.detailed_review ??
                    interviewerReviews[0]?.strengths ??
                    "No notes submitted."
                  }
                />
              </Grid>
            </DetailCard>

            <DetailCard title="Decision">
              <Grid container spacing={2}>
                <InfoItem
                  label="Decision Status"
                  value={decision ? DECISION_STATUS_LABELS[decision.decision_status] : "—"}
                />
                <InfoItem label="Decision Reason" value={decision?.decision_reason ?? "—"} />
                <InfoItem
                  label="Decision By"
                  value={decider ? formatName(decider.first_name, decider.last_name) : "—"}
                />
                <InfoItem label="Decision Date" value={formatDateTime(decision?.decision_at)} />
              </Grid>
            </DetailCard>
          </Stack>
        ) : null}

        {activeTab === "resume-analysis" ? (
          <DetailCard title="Resume Analysis">
            {resumeAnalysis ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <InfoItem
                    label="Analysis Status"
                    value={resumeAnalysis.analysis_status}
                  />
                  <InfoItem
                    label="AI Fit Score"
                    value={
                      resumeAnalysis.ai_fit_score
                        ? `${Number(resumeAnalysis.ai_fit_score).toFixed(1)} / 100`
                        : "—"
                    }
                  />
                  <InfoItem
                    label="Analyzed At"
                    value={formatDateTime(resumeAnalysis.analyzed_at)}
                  />
                  <InfoItem
                    label="Detected Experience"
                    value={
                      resumeAnalysis.total_experience_years_detected
                        ? `${resumeAnalysis.total_experience_years_detected} years`
                        : "—"
                    }
                  />
                </Grid>

                <Divider />

                <Typography variant="body2">
                  {resumeAnalysis.experience_summary ?? "No experience summary available."}
                </Typography>

                {currentResume?.file_url ? (
                  <Button
                    component="a"
                    href={resolveAbsoluteUrl(currentResume.file_url, envConfig.apiBaseUrl) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", fontWeight: 800 }}
                  >
                    Open Resume
                  </Button>
                ) : null}
              </Stack>
            ) : (
              <Alert severity="info">No resume AI analysis found for this application.</Alert>
            )}
          </DetailCard>
        ) : null}

        {activeTab === "interview-feedback" ? (
          <DetailCard title="AI Interview Feedback">
            {feedback ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <InfoItem label="Feedback Status" value={feedback.feedback_status} />
                  <InfoItem
                    label="Recommendation"
                    value={
                      feedback.recommendation
                        ? RECOMMENDATION_LABELS[
                            feedback.recommendation as AiInterviewRecommendation
                          ]
                        : "—"
                    }
                  />
                  <InfoItem label="Overall Score" value={feedback.overall_score ?? "—"} />
                  <InfoItem label="Generated At" value={formatDateTime(feedback.generated_at)} />
                </Grid>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  Detailed Feedback
                </Typography>
                <Typography variant="body2">
                  {feedback.detailed_feedback ?? "No detailed AI feedback available."}
                </Typography>
              </Stack>
            ) : (
              <Alert severity="info">No AI interview feedback found for this application.</Alert>
            )}
          </DetailCard>
        ) : null}

        {activeTab === "transcript" ? (
          <Stack spacing={2.5}>
            <DetailCard title="Transcript">
              {sessionQuery.isLoading || transcriptQuery.isLoading ? (
                <Typography>Loading transcript...</Typography>
              ) : transcripts.length === 0 ? (
                <Alert severity="info">No transcript entries found for this interview session.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {transcripts.map((entry: AiInterviewTranscriptEntryResponse) => (
                    <Box
                      key={entry.id}
                      sx={{
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 2,
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                          {entry.speaker_type} • {formatDateTime(entry.created_at)}
                        </Typography>
                        <Typography variant="body2">
                          {entry.message_text || "No transcript text."}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </DetailCard>

            <DetailCard title="Question Flow">
              {questionGroups.length === 0 ? (
                <Alert severity="info">No interview questions found for this session.</Alert>
              ) : (
                <Stack spacing={2}>
                  {questionGroups.map(({ root, followUps }) => (
                    <Box
                      key={root.id}
                      sx={{
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={`Q${root.sequence_number}`} color="primary" />
                          <Chip size="small" label={root.question_type} variant="outlined" />
                        </Stack>
                        <Typography sx={{ fontWeight: 800 }}>{root.question_text}</Typography>
                        {followUps.map((followUp) => (
                          <Typography key={followUp.id} variant="body2" color="text.secondary">
                            Follow-up: {followUp.question_text}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </DetailCard>
          </Stack>
        ) : null}

        {activeTab === "interviewer-reviews" ? (
          <DetailCard title="Interviewer Reviews">
            {interviewerReviews.length === 0 ? (
              <Alert severity="info">No interviewer reviews found for this application.</Alert>
            ) : (
              <Grid container spacing={2}>
                {interviewerReviews.map((review) => {
                  const score = review.overall_score ?? averageReviewScore(review);

                  return (
                    <Grid key={review.id} size={{ xs: 12, lg: 6 }}>
                      <Box
                        sx={{
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                          p: 2.5,
                          height: "100%",
                        }}
                      >
                        <Stack spacing={1.25}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "space-between", flexWrap: "wrap" }}
                          >
                            <Typography sx={{ fontWeight: 900 }}>
                              Review {review.review_status.toLowerCase()}
                            </Typography>
                            <Chip
                              label={score ? `Overall ${score.toFixed(1)}` : "No score"}
                              variant="outlined"
                              color="primary"
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Recommendation:{" "}
                            {review.interviewer_recommendation
                              ? RECOMMENDATION_LABELS[review.interviewer_recommendation]
                              : "—"}
                          </Typography>
                          <Typography variant="body2">
                            {review.detailed_review || review.strengths || "No review notes provided."}
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </DetailCard>
        ) : null}

        {activeTab === "decision" ? (
          <DetailCard title="Decision Record">
            {decision ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <InfoItem
                    label="Decision Status"
                    value={DECISION_STATUS_LABELS[decision.decision_status]}
                  />
                  <InfoItem label="Decision Date" value={formatDateTime(decision.decision_at)} />
                  <InfoItem
                    label="Decision By"
                    value={decider ? formatName(decider.first_name, decider.last_name) : "—"}
                  />
                  <InfoItem
                    label="Decision Source"
                    value={decision.decision_source?.replaceAll("_", " ") ?? "—"}
                  />
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                    Decision Reason
                  </Typography>
                  <Typography variant="body2">
                    {decision.decision_reason ?? "No reason recorded."}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                    Decision Notes
                  </Typography>
                  <Typography variant="body2">
                    {decision.decision_notes ?? "No additional notes recorded."}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography>Loading decision...</Typography>
            )}
          </DetailCard>
        ) : null}
      </Stack>
    </Box>
  );
}
