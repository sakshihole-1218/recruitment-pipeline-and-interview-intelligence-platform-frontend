import { z } from "zod";

export const rescheduleInterviewSchema = z
  .object({
    scheduled_start_at_local: z.string().min(1, "Start time is required"),
    scheduled_end_at_local: z.string().min(1, "End time is required"),
    reschedule_reason: z
      .string()
      .min(3, "Reason must be at least 3 characters")
      .max(2000, "Reason must be at most 2000 characters"),
    meeting_link: z
      .string()
      .min(5, "Meeting link must be at least 5 characters")
      .max(2000, "Meeting link must be at most 2000 characters")
      .optional()
      .or(z.literal("")),
    location_details: z
      .string()
      .min(2, "Location details must be at least 2 characters")
      .max(2000, "Location details must be at most 2000 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (v) => {
      const start = new Date(v.scheduled_start_at_local);
      const end = new Date(v.scheduled_end_at_local);
      return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start;
    },
    {
      message: "End time must be after start time",
      path: ["scheduled_end_at_local"],
    },
  );

export type RescheduleInterviewFormValues = z.infer<typeof rescheduleInterviewSchema>;
