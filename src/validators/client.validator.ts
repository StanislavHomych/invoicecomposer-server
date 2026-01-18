import { z } from 'zod';

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(200, 'Client name is too long')
    .trim(),
  email: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val === '' || (typeof val === 'string' && val.trim() === '')) {
        return; // Empty is valid
      }
      const trimmed = typeof val === 'string' ? val.trim() : String(val);
      if (trimmed === '') return; // Empty after trim is valid
      // Validate email format if provided
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid email address',
          path: ['email'],
        });
      }
    })
    .transform((val) => {
      if (!val || val === '' || (typeof val === 'string' && val.trim() === '')) {
        return undefined;
      }
      return typeof val === 'string' ? val.trim().toLowerCase() : undefined;
    }),
  addressLine1: z
    .string()
    .max(500, 'Address line 1 is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  addressLine2: z
    .string()
    .max(500, 'Address line 2 is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  city: z
    .string()
    .max(100, 'City name is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  state: z
    .string()
    .max(100, 'State name is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  postalCode: z
    .string()
    .max(20, 'Postal code is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  country: z
    .string()
    .max(100, 'Country name is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  taxIdLabel: z
    .string()
    .max(50, 'Tax ID label is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  taxIdValue: z
    .string()
    .max(100, 'Tax ID value is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  notes: z
    .string()
    .max(2000, 'Notes are too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
});
