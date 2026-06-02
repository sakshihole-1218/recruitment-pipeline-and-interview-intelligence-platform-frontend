import { z } from "zod";

import {
  APPLICATION_CURRENT_STAGES,
  SCREENING_RESULTS,
} from "@/features/applications/types/applications.types";

const uuidSchema = z.string().uuid("Must be a valid UUID");

export const createApplicationSchema = z.object({
  candidate_id: uuidSchema,
  job_opening_id: uuidSchema,
  assigned_recruiter_user_id: uuidSchema.optional(),
  assigned_hiring_manager_user_id: uuidSchema.optional(),
  is_priority: z.boolean().optional(),
});

export type CreateApplicationFormValues = z.infer<typeof createApplicationSchema>;

export const rejectApplicationSchema = z.object({
  rejection_reason: z
    .string()
    .trim()
    .min(2, "Reason must be at least 2 characters")
    .max(2000, "Reason must be 2000 characters or less"),
});

export type RejectApplicationFormValues = z.infer<typeof rejectApplicationSchema>;

export const withdrawApplicationSchema = z.object({
  withdrawal_reason: z
    .string()
    .trim()
    .min(2, "Reason must be at least 2 characters")
    .max(2000, "Reason must be 2000 characters or less"),
});

export type WithdrawApplicationFormValues = z.infer<typeof withdrawApplicationSchema>;

export const holdApplicationSchema = z.object({
  change_reason: z
    .string()
    .trim()
    .max(2000, "Reason must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
});

export type HoldApplicationFormValues = z.infer<typeof holdApplicationSchema>;

const scoreSchema = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return value;
      const numberValue = typeof value === "number" ? value : Number(value);
      return Number.isNaN(numberValue) ? value : numberValue;
    },
    z
      .number({ message: `${label} must be a number` })
      .min(0, `${label} must be 0 or more`)
      .max(100, `${label} must be 100 or less`),
  );

export const completeScreeningSchema = z.object({
  screening_score: scoreSchema("Screening score"),
  fit_score: scoreSchema("Fit score"),
  screening_result: z.enum(SCREENING_RESULTS),
  screening_remarks: z
    .string()
    .trim()
    .max(2000, "Remarks must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
});

export type CompleteScreeningFormValues = z.infer<typeof completeScreeningSchema>;

export const assignRecruiterSchema = z.object({
  recruiter_user_id: uuidSchema,
});

export type AssignRecruiterFormValues = z.infer<typeof assignRecruiterSchema>;

export const assignHiringManagerSchema = z.object({
  hiring_manager_user_id: uuidSchema,
});

export type AssignHiringManagerFormValues = z.infer<typeof assignHiringManagerSchema>;

export const moveStageSchema = z.object({
  target_stage: z.enum(APPLICATION_CURRENT_STAGES),
  change_reason: z
    .string()
    .trim()
    .min(2, "Reason must be at least 2 characters")
    .max(2000, "Reason must be 2000 characters or less"),
});

export type MoveStageFormValues = z.infer<typeof moveStageSchema>;
