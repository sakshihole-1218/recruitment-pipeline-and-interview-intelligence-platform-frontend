import { z } from "zod";

import { INTERVIEW_MODES } from "@/features/interviews/types/interviews.types";

const panelMemberSchema = z.object({
  user_id: z.string().uuid({ message: "User is required" }),
  role_in_panel: z.enum(["PRIMARY_INTERVIEWER", "PANELIST", "OBSERVER"] as const),
});

export const scheduleInterviewSchema = z
  .object({
    application_id: z.string().uuid({ message: "Application is required" }),
    interview_round_id: z.string().uuid({ message: "Interview round is required" }),

    // UI uses datetime-local string; converted to ISO8601 on submit
    scheduled_start_at_local: z.string().min(1, "Start time is required"),
    scheduled_end_at_local: z.string().min(1, "End time is required"),

    interview_mode: z.enum(INTERVIEW_MODES),
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
    members: z.array(panelMemberSchema).optional(),
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

export type ScheduleInterviewFormValues = z.infer<typeof scheduleInterviewSchema>;
