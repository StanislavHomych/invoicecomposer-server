import prisma from '../utils/prisma';
import {
  Prisma,
  InvoiceActivityAction,
  InvoiceStatus,
  InvoiceTemplate,
  PaymentMethod,
  PaymentTerms,
  TaxMode,
  TaxScope,
} from '@prisma/client';

export interface InvoiceTotals {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
}

export interface InvoiceQueryFilters {
  status?: InvoiceStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  minTotal?: number;
  maxTotal?: number;
  sortBy?: 'issueDate' | 'dueDate' | 'total' | 'status' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

type InvoiceItemInput = {
  title: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  discountPercent?: number;
};

type InvoiceCreateInput = {
  companyId: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  paymentTerms?: PaymentTerms;
  paymentTermsCustomDays?: number | null;
  status?: InvoiceStatus;
  currency?: string;
  poNumber?: string | null;
  notes?: string | null;
  memo?: string | null;
  termsConditions?: string | null;
  lateFeePercent?: number | null;
  lateFeeFixed?: number | null;
  shippingAmount?: number;
  taxMode?: TaxMode;
  taxScope?: TaxScope;
  invoiceTaxPercent?: number;
  template?: InvoiceTemplate;
  achRouting?: string | null;
  achAccount?: string | null;
  wireIban?: string | null;
  wireSwift?: string | null;
  paymentLink?: string | null;
  checkPayableTo?: string | null;
  items: InvoiceItemInput[];
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateTotals(
  items: InvoiceItemInput[],
  options: {
    taxMode?: TaxMode;
    taxScope?: TaxScope;
    invoiceTaxPercent?: number;
    shippingAmount?: number;
    payments?: Array<{ amount: number }>;
  } = {}
): InvoiceTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableBase = 0;
  let lineTaxTotal = 0;

  const taxMode = options.taxMode || TaxMode.NONE;
  const taxScope = options.taxScope || TaxScope.LINE_ITEM;
  const invoiceTaxPercent = options.invoiceTaxPercent || 0;
  const shipping = options.shippingAmount || 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemSubtotal * (item.discountPercent || 0)) / 100;
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    const itemTax =
      taxMode !== TaxMode.NONE && taxScope === TaxScope.LINE_ITEM
        ? (itemAfterDiscount * (item.taxPercent || 0)) / 100
        : 0;

    subtotal += itemSubtotal;
    discountTotal += itemDiscount;
    taxableBase += itemAfterDiscount;
    lineTaxTotal += itemTax;
  }

  const taxTotal =
    taxMode === TaxMode.NONE
      ? 0
      : taxScope === TaxScope.INVOICE
      ? (taxableBase * invoiceTaxPercent) / 100
      : lineTaxTotal;

  const total = subtotal - discountTotal + taxTotal + shipping;
  const paidAmount = (options.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = Math.max(0, total - paidAmount);

  return {
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    discountTotal: round2(discountTotal),
    shippingTotal: round2(shipping),
    total: round2(total),
    paidAmount: round2(paidAmount),
    dueAmount: round2(dueAmount),
  };
}

function calculateTotalsFromInvoice(invoice: any): InvoiceTotals {
  return calculateTotals(invoice.items || [], {
    taxMode: invoice.taxMode,
    taxScope: invoice.taxScope,
    invoiceTaxPercent: invoice.invoiceTaxPercent,
    shippingAmount: invoice.shippingAmount,
    payments: invoice.payments || [],
  });
}

async function generateInvoiceNumberAtomic(tx: Prisma.TransactionClient, _userId: string) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const sequence = await tx.invoiceSequence.upsert({
    where: { year: currentYear },
    update: { lastNumber: { increment: 1 } },
    create: { year: currentYear, lastNumber: 1 },
  });

  return `${prefix}${sequence.lastNumber.toString().padStart(4, '0')}`;
}

export async function getInvoicesByUserId(userId: string, filters: InvoiceQueryFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 10));
  const skip = (page - 1) * pageSize;

  const where: any = { userId };

  if (filters.status) where.status = filters.status;
  if (filters.currency) where.currency = filters.currency;
  if (filters.minTotal || filters.maxTotal) {
    where.total = {};
    if (filters.minTotal) where.total.gte = filters.minTotal;
    if (filters.maxTotal) where.total.lte = filters.maxTotal;
  }
  if (filters.startDate || filters.endDate) {
    where.issueDate = {};
    if (filters.startDate) where.issueDate.gte = filters.startDate;
    if (filters.endDate) where.issueDate.lte = filters.endDate;
  }
  if (filters.search) {
    const search = filters.search;
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { memo: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const sortBy = filters.sortBy || 'createdAt';
  const sortDir = filters.sortDir || 'desc';

  const [invoices, totalItems, outstandingAgg, paidLast30DaysAgg, overdueCount, draftCount] =
    await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: { company: true, client: true, items: true, payments: true },
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where: { userId, dueAmount: { gt: 0 } },
        _sum: { dueAmount: true },
      }),
      prisma.invoicePayment.aggregate({
        where: { invoice: { userId }, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { userId, status: InvoiceStatus.OVERDUE } }),
      prisma.invoice.count({ where: { userId, status: InvoiceStatus.DRAFT } }),
    ]);

  const data = invoices.map((invoice) => ({
    ...invoice,
    totals: calculateTotalsFromInvoice(invoice),
  }));

  const meta = {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };

  const summary = {
    totalOutstanding: round2(outstandingAgg._sum.dueAmount || 0),
    paidLast30Days: round2(paidLast30DaysAgg._sum.amount || 0),
    overdueCount,
    draftCount,
  };

  return { data, meta, summary };
}

export async function getInvoiceById(id: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      company: true,
      client: true,
      items: true,
      payments: true,
      pdfs: true,
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    totals: calculateTotalsFromInvoice(invoice),
  };
}

export async function createInvoice(userId: string, data: InvoiceCreateInput) {
  return await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumberAtomic(tx, userId);
    const totals = calculateTotals(data.items, {
      taxMode: data.taxMode,
      taxScope: data.taxScope,
      invoiceTaxPercent: data.invoiceTaxPercent,
      shippingAmount: data.shippingAmount,
    });

    const invoice = await tx.invoice.create({
      data: {
        userId,
        invoiceNumber,
        paymentTerms: data.paymentTerms || PaymentTerms.NET_30,
        paymentTermsCustomDays:
          data.paymentTerms === PaymentTerms.CUSTOM ? data.paymentTermsCustomDays || 0 : null,
        status: data.status || InvoiceStatus.DRAFT,
        currency: data.currency || 'USD',
        shippingAmount: data.shippingAmount || 0,
        taxMode: data.taxMode || TaxMode.NONE,
        taxScope: data.taxScope || TaxScope.LINE_ITEM,
        invoiceTaxPercent: data.invoiceTaxPercent || 0,
        template: data.template || InvoiceTemplate.CLASSIC,
        ...data,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        paidAmount: totals.paidAmount,
        dueAmount: totals.dueAmount,
        items: { create: data.items },
      },
      include: { company: true, client: true, items: true, payments: true },
    });

    await tx.invoiceActivity.create({
      data: {
        invoiceId: invoice.id,
        userId,
        action: InvoiceActivityAction.CREATE,
        meta: { invoiceNumber },
      },
    });

    return { ...invoice, totals };
  });
}

export async function updateInvoice(id: string, userId: string, data: Partial<InvoiceCreateInput>) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.invoice.findFirst({
      where: { id, userId },
      include: { items: true, payments: true },
    });

    if (!existing) {
      return null;
    }

    if (data.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }

    const items = data.items ?? existing.items;
    const totals = calculateTotals(items as InvoiceItemInput[], {
      taxMode: data.taxMode ?? existing.taxMode,
      taxScope: data.taxScope ?? existing.taxScope,
      invoiceTaxPercent: data.invoiceTaxPercent ?? existing.invoiceTaxPercent,
      shippingAmount: data.shippingAmount ?? existing.shippingAmount,
      payments: existing.payments,
    });

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        ...data,
        paymentTerms: data.paymentTerms || existing.paymentTerms,
        paymentTermsCustomDays:
          (data.paymentTerms || existing.paymentTerms) === PaymentTerms.CUSTOM
            ? data.paymentTermsCustomDays ?? existing.paymentTermsCustomDays ?? 0
            : null,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        paidAmount: totals.paidAmount,
        dueAmount: totals.dueAmount,
        items: data.items ? { create: data.items } : undefined,
      },
      include: { company: true, client: true, items: true, payments: true },
    });

    await tx.invoiceActivity.create({
      data: {
        invoiceId: id,
        userId,
        action: InvoiceActivityAction.UPDATE,
        meta: { fields: Object.keys(data) },
      },
    });

    return { ...updated, totals };
  });
}

export async function updateInvoiceStatus(id: string, userId: string, status: InvoiceStatus) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, userId }, include: { payments: true, items: true } });
    if (!invoice) return null;

    const updated = await tx.invoice.update({
      where: { id },
      data: { status },
      include: { company: true, client: true, items: true, payments: true },
    });

    await tx.invoiceActivity.create({
      data: {
        invoiceId: id,
        userId,
        action: InvoiceActivityAction.STATUS_CHANGE,
        meta: { status },
      },
    });

    return { ...updated, totals: calculateTotalsFromInvoice(updated) };
  });
}

export async function recordPayment(
  id: string,
  userId: string,
  data: { amount: number; date: Date; method: PaymentMethod; note?: string }
) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id, userId },
      include: { items: true, payments: true },
    });
    if (!invoice) return null;

    const payment = await tx.invoicePayment.create({
      data: {
        invoiceId: id,
        amount: data.amount,
        date: data.date,
        method: data.method,
        note: data.note,
      },
    });

    const totals = calculateTotals(invoice.items, {
      taxMode: invoice.taxMode,
      taxScope: invoice.taxScope,
      invoiceTaxPercent: invoice.invoiceTaxPercent,
      shippingAmount: invoice.shippingAmount,
      payments: [...invoice.payments, payment],
    });

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        paidAmount: totals.paidAmount,
        dueAmount: totals.dueAmount,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: totals.dueAmount <= 0 ? InvoiceStatus.PAID : invoice.status,
      },
      include: { company: true, client: true, items: true, payments: true },
    });

    await tx.invoiceActivity.create({
      data: {
        invoiceId: id,
        userId,
        action: InvoiceActivityAction.PAYMENT_RECORDED,
        meta: { amount: data.amount, method: data.method, date: data.date },
      },
    });

    return { ...updated, totals };
  });
}

export function getInvoiceTotals(invoice: { items: InvoiceItemInput[]; payments?: Array<{ amount: number }> }): InvoiceTotals {
  return calculateTotalsFromInvoice(invoice);
}
