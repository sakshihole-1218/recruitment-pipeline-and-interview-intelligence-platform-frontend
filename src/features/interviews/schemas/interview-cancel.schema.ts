import { z } from "zod";

export const cancelInterviewSchema = z.object({
  cancel_reason: z
    .string()
    .min(3, "Reason must be at least 3 characters")
    .max(2000, "Reason must be at most 2000 characters"),
});

export type CancelInterviewFormValues = z.infer<typeof cancelInterviewSchema>;
