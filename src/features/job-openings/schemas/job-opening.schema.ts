import { z } from "zod";

import {
  EMPLOYMENT_TYPES,
  JOB_OPENING_STATUSES,
  SKILL_PROFICIENCY_LEVELS,
  WORK_MODES,
} from "@/features/job-openings/types/job-openings.types";

const uuidSchema = z.string().uuid("Must be a valid UUID");

const optionalIntSchema = (opts: { min: number; max: number; label: string }) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return undefined;
      if (value === null) return null;
      const numberValue = typeof value === "number" ? value : Number(value);
      return Number.isNaN(numberValue) ? value : numberValue;
    },
    z
      .number({ message: `${opts.label} must be a number` })
      .int(`${opts.label} must be an integer`)
      .min(opts.min, `${opts.label} must be ${opts.min} or more`)
      .max(opts.max, `${opts.label} must be ${opts.max} or less`)
      .optional()
      .nullable(),
  );

const optionalNumberSchema = (opts: { min: number; label: string }) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return undefined;
      if (value === null) return null;
      const numberValue = typeof value === "number" ? value : Number(value);
      return Number.isNaN(numberValue) ? value : numberValue;
    },
    z
      .number({ message: `${opts.label} must be a number` })
      .min(opts.min, `${opts.label} must be ${opts.min} or more`)
      .optional()
      .nullable(),
  );

export const jobOpeningSkillInputSchema = z.object({
  skill_id: uuidSchema,
  proficiency_level: z.enum(SKILL_PROFICIENCY_LEVELS),
  is_mandatory: z.boolean().optional(),
  years_of_experience_required: optionalIntSchema({
    min: 0,
    max: 60,
    label: "Years of experience",
  }),
});

export const jobOpeningSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be 200 characters or less"),
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters")
      .max(50, "Code must be 50 characters or less"),

    department_id: uuidSchema,
    hiring_manager_user_id: uuidSchema,
    recruiter_user_id: uuidSchema,

    employment_type: z.enum(EMPLOYMENT_TYPES),
    work_mode: z.enum(WORK_MODES),

    experience_min_years: optionalIntSchema({
      min: 0,
      max: 60,
      label: "Minimum experience",
    }),
    experience_max_years: optionalIntSchema({
      min: 0,
      max: 60,
      label: "Maximum experience",
    }),

    min_salary: optionalNumberSchema({ min: 0, label: "Minimum salary" }),
    max_salary: optionalNumberSchema({ min: 0, label: "Maximum salary" }),
    currency_code: z
      .string()
      .trim()
      .min(3, "Currency code must be at least 3 characters")
      .max(10, "Currency code must be 10 characters or less")
      .optional()
      .nullable(),

    openings_count: z
      .preprocess(
        (value) => {
          if (value === "" || value === undefined) return value;
          const numberValue = typeof value === "number" ? value : Number(value);
          return Number.isNaN(numberValue) ? value : numberValue;
        },
        z
          .number({ message: "Openings count must be a number" })
          .int("Must be an integer")
          .min(1, "Must be at least 1")
          .max(999, "Must be 999 or less"),
      ),

    job_description: z.string().optional().nullable(),
    responsibilities: z.string().optional().nullable(),
    requirements: z.string().optional().nullable(),
    location: z.string().max(255, "Must be 255 characters or less").optional().nullable(),

    status: z.enum(JOB_OPENING_STATUSES).optional(),
    is_active: z.boolean().optional(),

    skills: z.array(jobOpeningSkillInputSchema).optional(),
  })
  .refine(
    (v) =>
      v.experience_min_years === null ||
      v.experience_max_years === null ||
      v.experience_min_years === undefined ||
      v.experience_max_years === undefined ||
      v.experience_min_years <= v.experience_max_years,
    {
      message: "Minimum experience must be less than or equal to maximum experience",
      path: ["experience_max_years"],
    },
  )
  .refine(
    (v) =>
      v.min_salary === null ||
      v.max_salary === null ||
      v.min_salary === undefined ||
      v.max_salary === undefined ||
      v.min_salary <= v.max_salary,
    {
      message: "Minimum salary must be less than or equal to maximum salary",
      path: ["max_salary"],
    },
  );

export type JobOpeningFormValues = z.infer<typeof jobOpeningSchema>;
