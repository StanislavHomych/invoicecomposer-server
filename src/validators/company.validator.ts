import { z } from 'zod';

export const companySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name is too long')
    .trim(),
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
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  phone: z
    .string()
    .max(50, 'Phone number is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  logoUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  bankDetails: z
    .string()
    .max(1000, 'Bank details are too long')
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
  timeZone: z
    .string()
    .max(100, 'Time zone is too long')
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
});
