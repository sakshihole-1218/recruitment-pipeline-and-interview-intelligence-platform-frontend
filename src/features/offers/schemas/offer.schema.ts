import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");

const requiredMoneySchema = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return value;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    },
    z
      .number({ message: `${label} must be a number` })
      .min(0.01, `${label} must be greater than 0`),
  );

const optionalMoneySchema = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return undefined;
      if (value === null) return null;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    },
    z
      .number({ message: `${label} must be a number` })
      .min(0, `${label} cannot be negative`)
      .nullable()
      .optional(),
  );

const optionalIntSchema = (label: string, max: number) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) return undefined;
      if (value === null) return null;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    },
    z
      .number({ message: `${label} must be a number` })
      .int(`${label} must be an integer`)
      .min(0, `${label} cannot be negative`)
      .max(max, `${label} must be ${max} or less`)
      .nullable()
      .optional(),
  );

function isFutureDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return date.getTime() > today.getTime();
}

export const offerSchema = z.object({
  application_id: uuidSchema,
  offered_role_title: z
    .string()
    .trim()
    .min(3, "Offered role must be at least 3 characters")
    .max(200, "Offered role must be 200 characters or less"),
  offered_ctc: requiredMoneySchema("Offered CTC"),
  currency_code: z
    .string()
    .trim()
    .min(3, "Currency must be at least 3 characters")
    .max(10, "Currency must be 10 characters or less"),
  joining_bonus: optionalMoneySchema("Joining bonus"),
  probation_period_months: optionalIntSchema("Probation period", 60),
  expected_joining_date: z
    .string()
    .min(1, "Expected joining date is required")
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: "Expected joining date is invalid",
    })
    .refine(isFutureDate, {
      message: "Expected joining date must be in the future",
    }),
});

export type OfferSchemaValues = z.infer<typeof offerSchema>;
