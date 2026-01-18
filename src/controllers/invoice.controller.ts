import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';
import * as pdfService from '../services/pdf.service';
import {
  invoiceFiltersSchema,
  invoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  updateInvoiceStatusSchema,
} from '../validators/invoice.validator';
import { getFile } from '../utils/storage';

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = invoiceFiltersSchema.parse(req.query);
    const result = await invoiceService.getInvoicesByUserId(req.user!.id, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user!.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = invoiceSchema.parse(req.body);
    const invoice = await invoiceService.createInvoice(req.user!.id, data);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.updateInvoice(req.params.id, req.user!.id, data);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = updateInvoiceStatusSchema.parse(req.body);
    const result = await invoiceService.updateInvoiceStatus(req.params.id, req.user!.id, status);
    if (!result) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function generatePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { pdfUrl, invoice, totals } = await pdfService.generateInvoicePdf(req.params.id, req.user!.id);
    res.json({ ...invoice, totals, pdfUrl });
  } catch (error) {
    next(error);
  }
}

export async function downloadPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user!.id);
    if (!invoice || !invoice.latestPdfUrl) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Extract filename from URL
    const fileName = invoice.latestPdfUrl.split('/').pop() || 'invoice.pdf';
    const fileBuffer = await getFile(fileName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = recordPaymentSchema.parse(req.body);
    const invoice = await invoiceService.recordPayment(req.params.id, req.user!.id, data);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}
