import { z } from "zod";

const phoneRegex = /^\+[1-9]\d{7,14}$/;

// ---------------------------------------------------------------------------
// Create user schema
// ---------------------------------------------------------------------------
export const createUserSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be at most 255 characters"),
  phone: z
    .string()
    .regex(phoneRegex, "Please include your country code (e.g. +919876543210)")
    .max(16)
    .optional()
    .or(z.literal(""))
  ,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  role_codes: z.array(z.string()).optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ---------------------------------------------------------------------------
// Edit user schema
// ---------------------------------------------------------------------------
export const editUserSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be at most 255 characters"),
  phone: z
    .string()
    .regex(phoneRegex, "Please include your country code (e.g. +919876543210)")
    .max(16)
    .optional()
    .or(z.literal(""))
    .nullable(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
