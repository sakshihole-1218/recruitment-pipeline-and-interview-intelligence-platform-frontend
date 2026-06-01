import { z } from "zod";

import { SKILL_CATEGORIES } from "@/features/skills/types/skills.types";

export const skillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must be 150 characters or less"),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be 50 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  category: z.enum(SKILL_CATEGORIES, {
    message: "Category is required",
  }),
  is_active: z.boolean().optional(),
});

export type SkillFormValues = z.infer<typeof skillSchema>;
