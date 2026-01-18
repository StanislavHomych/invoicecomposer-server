import { z } from 'zod';

const paymentTermsEnum = z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60', 'CUSTOM']);
const statusEnum = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED']);
const taxModeEnum = z.enum(['NONE', 'SALES_TAX', 'VAT']);
const taxScopeEnum = z.enum(['LINE_ITEM', 'INVOICE']);
const templateEnum = z.enum(['CLASSIC', 'MINIMAL']);
const paymentMethodEnum = z.enum(['ACH', 'WIRE', 'CARD', 'CHECK', 'CASH', 'OTHER']);
const sortByEnum = z.enum(['issueDate', 'dueDate', 'total', 'status', 'createdAt']).optional();
const sortDirEnum = z.enum(['asc', 'desc']).optional();

export const invoiceItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  taxPercent: z.number().min(0).max(100).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
});

const invoiceBaseSchema = z.object({
    companyId: z.string().min(1, 'Company ID is required'),
    clientId: z.string().min(1, 'Client ID is required'),
    issueDate: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    dueDate: z.union([z.string(), z.date()]).transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    status: statusEnum.default('DRAFT'),
    paymentTerms: paymentTermsEnum.default('NET_30'),
    paymentTermsCustomDays: z.number().int().min(1).max(365).optional(),
    currency: z.string().default('USD'),
    poNumber: z.string().optional(),
    notes: z.string().optional(),
    memo: z.string().optional(),
    termsConditions: z.string().optional(),
    lateFeePercent: z.number().min(0).optional(),
    lateFeeFixed: z.number().min(0).optional(),
    shippingAmount: z.number().min(0).default(0),
    taxMode: taxModeEnum.default('NONE'),
    taxScope: taxScopeEnum.default('LINE_ITEM'),
    invoiceTaxPercent: z.number().min(0).max(100).default(0),
    template: templateEnum.default('CLASSIC'),
    achRouting: z.string().optional(),
    achAccount: z.string().optional(),
    wireIban: z.string().optional(),
    wireSwift: z.string().optional(),
    paymentLink: z.string().url().optional(),
    checkPayableTo: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  });

export const invoiceSchema = invoiceBaseSchema.refine(
  (data) => (data.paymentTerms === 'CUSTOM' ? data.paymentTermsCustomDays !== undefined : true),
  { message: 'paymentTermsCustomDays is required when paymentTerms is CUSTOM', path: ['paymentTermsCustomDays'] }
);

export const updateInvoiceSchema = invoiceBaseSchema.partial().superRefine((data, ctx) => {
  if (data.paymentTerms === 'CUSTOM' && data.paymentTermsCustomDays === undefined) {
    ctx.addIssue({
      path: ['paymentTermsCustomDays'],
      code: z.ZodIssueCode.custom,
      message: 'paymentTermsCustomDays is required when paymentTerms is CUSTOM',
    });
  }
});

export const updateInvoiceStatusSchema = z.object({
  status: statusEnum,
});

export const invoiceFiltersSchema = z.object({
  status: statusEnum.optional(),
  search: z.string().optional(),
  startDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  endDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  currency: z.string().optional(),
  minTotal: z.coerce.number().optional(),
  maxTotal: z.coerce.number().optional(),
  sortBy: sortByEnum,
  sortDir: sortDirEnum,
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  date: z
    .union([z.string(), z.date()])
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  method: paymentMethodEnum,
  note: z.string().optional(),
});
