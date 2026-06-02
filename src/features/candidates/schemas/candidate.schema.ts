import { z } from "zod";

import {
  CANDIDATE_GENDERS,
  CANDIDATE_SKILL_PROFICIENCY_LEVELS,
  CANDIDATE_SOURCE_TYPES,
} from "@/features/candidates/types/candidates.types";

const emptyToNull = (v: unknown) => {
  if (v === "") return null;
  return v;
};

export const candidateSkillInputSchema = z.object({
  skill_id: z.string().uuid("Please select a valid skill"),
  years_of_experience: z
    .preprocess(emptyToNull, z.number().min(0).max(80).nullable())
    .optional(),
  proficiency_level: z
    .enum(CANDIDATE_SKILL_PROFICIENCY_LEVELS)
    .nullable()
    .optional(),
  is_primary: z.boolean().optional(),
});

export const candidateSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Enter a valid email").max(255),
  phone: z
    .preprocess(emptyToNull, z.string().max(30).nullable())
    .optional(),
  date_of_birth: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  gender: z.enum(CANDIDATE_GENDERS).nullable().optional(),
  total_experience_years: z
    .preprocess(emptyToNull, z.number().min(0).max(80).nullable())
    .optional(),
  current_company: z
    .preprocess(emptyToNull, z.string().max(200).nullable())
    .optional(),
  current_job_title: z
    .preprocess(emptyToNull, z.string().max(200).nullable())
    .optional(),
  current_location: z
    .preprocess(emptyToNull, z.string().max(255).nullable())
    .optional(),
  notice_period_days: z
    .preprocess(emptyToNull, z.number().int().min(0).max(365).nullable())
    .optional(),
  current_salary: z
    .preprocess(emptyToNull, z.number().min(0).nullable())
    .optional(),
  expected_salary: z
    .preprocess(emptyToNull, z.number().min(0).nullable())
    .optional(),
  currency_code: z
    .preprocess(emptyToNull, z.string().min(3).max(10).nullable())
    .optional(),
  linkedin_url: z
    .preprocess(emptyToNull, z.string().max(500).nullable())
    .optional(),
  github_url: z.preprocess(emptyToNull, z.string().max(500).nullable()).optional(),
  portfolio_url: z
    .preprocess(emptyToNull, z.string().max(500).nullable())
    .optional(),
  resume_headline: z
    .preprocess(emptyToNull, z.string().max(250).nullable())
    .optional(),
  source_type: z.enum(CANDIDATE_SOURCE_TYPES).nullable().optional(),
  source_details: z
    .preprocess(emptyToNull, z.string().max(2000).nullable())
    .optional(),
  is_active: z.boolean().optional(),

  // Skills are managed via a separate endpoint, but we include them in the UI.
  skills: z.array(candidateSkillInputSchema).optional(),
});

export type CandidateFormValues = z.infer<typeof candidateSchema>;
