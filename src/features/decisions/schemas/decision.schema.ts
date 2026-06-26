import { z } from "zod";

import { DECISION_STATUSES } from "@/features/decisions/types/decision.types";

export const decisionSchema = z
  .object({
    application_id: z.string().uuid("Application is required"),
    decision_status: z.enum(DECISION_STATUSES),
    decision_reason: z.string().max(2000, "Reason is too long").default(""),
    decision_notes: z.string().max(5000, "Notes are too long").default(""),
  })
  .superRefine((value, ctx) => {
    const requiresReason =
      value.decision_status === "REJECTED" || value.decision_status === "HOLD";

    if (requiresReason && !value.decision_reason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Decision reason is required for rejected or hold decisions",
        path: ["decision_reason"],
      });
    }
  });

export type DecisionSchemaValues = z.infer<typeof decisionSchema>;
