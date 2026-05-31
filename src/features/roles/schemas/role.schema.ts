import { z } from "zod";

const codeRegex = /^[A-Z][A-Z0-9_]{1,49}$/;

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be at most 100 characters"),
  code: z
    .string()
    .min(1, "Role code is required")
    .max(50, "Role code must be at most 50 characters")
    .regex(codeRegex, "Use uppercase letters, numbers, and underscores only"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

export type RoleFormSchemaValues = z.infer<typeof roleSchema>;
