"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  INTERVIEWER_RECOMMENDATIONS,
  INTERVIEWER_REVIEW_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  type InterviewerRecommendation,
  type InterviewerReviewResponse,
} from "@/features/feedback/types/feedback.types";

const reviewSchema = z.object({
  technical_score: z.number().min(0).max(100),
  communication_score: z.number().min(0).max(100),
  problem_solving_score: z.number().min(0).max(100),
  culture_fit_score: z.number().min(0).max(100),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  detailed_review: z.string().min(1, "Detailed review is required"),
  interviewer_recommendation: z.enum(INTERVIEWER_RECOMMENDATIONS),
});

export type InterviewerReviewFormValues = z.infer<typeof reviewSchema>;

export function InterviewerReviewForm({
  review,
  reviewerName,
  isCreating,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmitReview,
}: {
  review?: InterviewerReviewResponse | null;
  reviewerName?: string;
  isCreating?: boolean;
  isSavingDraft?: boolean;
  isSubmitting?: boolean;
  onSaveDraft: (values: Partial<InterviewerReviewFormValues>) => Promise<void> | void;
  onSubmitReview: (values: InterviewerReviewFormValues) => Promise<void> | void;
}) {
  const isSubmitted = review?.review_status === "SUBMITTED";

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<InterviewerReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    values: {
      technical_score: review?.technical_score ?? 0,
      communication_score: review?.communication_score ?? 0,
      problem_solving_score: review?.problem_solving_score ?? 0,
      culture_fit_score: review?.culture_fit_score ?? 0,
      strengths: review?.strengths ?? "",
      concerns: review?.concerns ?? "",
      detailed_review: review?.detailed_review ?? "",
      interviewer_recommendation: review?.interviewer_recommendation ?? "HOLD",
    },
    mode: "onTouched",
  });

  const scoreFields: Array<{
    name: keyof Pick<
      InterviewerReviewFormValues,
      | "technical_score"
      | "communication_score"
      | "problem_solving_score"
      | "culture_fit_score"
    >;
    label: string;
  }> = [
    { name: "technical_score", label: "Technical score" },
    { name: "communication_score", label: "Communication score" },
    { name: "problem_solving_score", label: "Problem solving score" },
    { name: "culture_fit_score", label: "Culture fit score" },
  ];

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Interviewer Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reviewerName
                ? `Reviewer: ${reviewerName}`
                : "Add your human review for this interview."}
            </Typography>
            {review ? (
              <Typography variant="caption" color="text.secondary">
                Status: {INTERVIEWER_REVIEW_STATUS_LABELS[review.review_status]}
              </Typography>
            ) : null}
          </Stack>

          {isSubmitted ? (
            <Alert severity="success">
              Your review has already been submitted and is now read-only.
            </Alert>
          ) : null}

          <Divider />

          <form onSubmit={handleSubmit((values) => onSubmitReview(values))} noValidate>
            <Grid container spacing={2.5}>
              {scoreFields.map((fieldConfig) => (
                <Grid key={fieldConfig.name} size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name={fieldConfig.name}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        label={fieldConfig.label}
                        fullWidth
                        type="number"
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                        error={!!errors[fieldConfig.name]}
                        helperText={errors[fieldConfig.name]?.message}
                        disabled={isSubmitted}
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            max: 100,
                            step: 0.1,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              ))}

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="interviewer_recommendation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Recommendation"
                      fullWidth
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value as InterviewerRecommendation,
                        )
                      }
                      error={!!errors.interviewer_recommendation}
                      helperText={errors.interviewer_recommendation?.message}
                      disabled={isSubmitted}
                    >
                      {INTERVIEWER_RECOMMENDATIONS.map((value) => (
                        <MenuItem key={value} value={value}>
                          {RECOMMENDATION_LABELS[value]}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Strengths"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("strengths")}
                  error={!!errors.strengths}
                  helperText={errors.strengths?.message}
                  disabled={isSubmitted}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Concerns"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("concerns")}
                  error={!!errors.concerns}
                  helperText={errors.concerns?.message}
                  disabled={isSubmitted}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Detailed review"
                  fullWidth
                  multiline
                  minRows={5}
                  {...register("detailed_review")}
                  error={!!errors.detailed_review}
                  helperText={errors.detailed_review?.message}
                  disabled={isSubmitted}
                />
              </Grid>

              {!isSubmitted ? (
                <Grid size={{ xs: 12 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={!!isCreating || !!isSavingDraft || !!isSubmitting}
                      onClick={() => onSaveDraft(getValues())}
                      startIcon={
                        isSavingDraft ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : undefined
                      }
                      sx={{ borderRadius: 2, fontWeight: 800 }}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!!isCreating || !!isSavingDraft || !!isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : undefined
                      }
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      Submit Review
                    </Button>
                  </Stack>
                </Grid>
              ) : null}
            </Grid>
          </form>
        </Stack>
      </CardContent>
    </Card>
  );
}
