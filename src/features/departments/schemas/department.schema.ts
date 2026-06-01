import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be 150 characters or less"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(30, "Code must be 30 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
