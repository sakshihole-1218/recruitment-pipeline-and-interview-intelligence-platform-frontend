import { z } from "zod";

import { INTERVIEW_ROUND_TYPES } from "@/features/interview-rounds/types/interview-rounds.types";

export const interviewRoundSchema = z.object({
  job_opening_id: z.string().uuid({ message: "Job opening is required" }),
  round_name: z
    .string()
    .min(2, "Round name must be at least 2 characters")
    .max(150, "Round name must be at most 150 characters"),
  round_type: z.enum(INTERVIEW_ROUND_TYPES),
  sequence_number: z
    .number({ message: "Sequence number is required" })
    .int("Sequence must be a whole number")
    .min(1, "Sequence must be at least 1")
    .max(50, "Sequence must be at most 50"),
  is_mandatory: z.boolean().optional().default(true),
  max_score: z
    .number()
    .int("Max score must be a whole number")
    .min(1, "Max score must be at least 1")
    .max(1000, "Max score must be at most 1000")
    .nullable()
    .optional(),
  description: z.string().max(2000, "Description must be at most 2000 characters").nullable().optional(),
});

export type InterviewRoundFormValues = z.infer<typeof interviewRoundSchema>;
