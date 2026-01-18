import puppeteer from 'puppeteer';
import { InvoiceActivityAction } from '@prisma/client';
import prisma from '../utils/prisma';
import { saveFile } from '../utils/storage';
import { getInvoiceTotals } from './invoice.service';

type PdfOptions = {
  pageSize?: 'LETTER' | 'A4';
};

export async function generateInvoicePdf(
  invoiceId: string,
  userId: string,
  options: PdfOptions = { pageSize: 'LETTER' }
): Promise<{ pdfUrl: string; invoice: any; totals: any }> {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { company: true, client: true, items: true, payments: true, pdfs: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const totals = getInvoiceTotals(invoice);
    const nextVersion = (invoice.pdfs?.reduce((max, pdf) => Math.max(max, pdf.version), 0) || 0) + 1;
    const html = generateInvoiceHtml(invoice, totals);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options.pageSize === 'A4' ? 'a4' : 'letter',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();

      const fileName = `invoice-${invoice.invoiceNumber}-v${nextVersion}-${Date.now()}.pdf`;
      const pdfUrl = await saveFile(fileName, pdfBuffer);

      await tx.invoicePdf.create({
        data: {
          invoiceId,
          version: nextVersion,
          pdfUrl,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { latestPdfUrl: pdfUrl },
        include: { company: true, client: true, items: true, payments: true, pdfs: true },
      });

      await tx.invoiceActivity.create({
        data: {
          invoiceId,
          userId,
          action: InvoiceActivityAction.PDF_GENERATED,
          meta: { version: nextVersion, pdfUrl },
        },
      });

      return { pdfUrl, invoice: updatedInvoice, totals };
    } catch (error) {
      await browser.close();
      throw error;
    }
  });
}

function formatAddress(entity: any) {
  const lines = [
    entity?.addressLine1,
    entity?.addressLine2,
    [entity?.city, entity?.state].filter(Boolean).join(', '),
    entity?.postalCode,
    entity?.country,
  ]
    .filter(Boolean)
    .join('<br/>');

  return lines || '';
}

function generateInvoiceHtml(invoice: any, totals: any): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount);
  };

  const paymentTerms =
    invoice.paymentTerms === 'CUSTOM'
      ? `Custom (${invoice.paymentTermsCustomDays} days)`
      : invoice.paymentTerms?.replace('_', ' ');

  const paymentInstructions = `
    ${invoice.paymentLink ? `<p><strong>Pay by card:</strong> ${invoice.paymentLink}</p>` : ''}
    ${
      invoice.achRouting || invoice.achAccount
        ? `<p><strong>ACH/Wire:</strong> Routing ${invoice.achRouting || '-'} Account ${invoice.achAccount || '-'}</p>`
        : ''
    }
    ${invoice.wireIban ? `<p><strong>IBAN:</strong> ${invoice.wireIban}</p>` : ''}
    ${invoice.wireSwift ? `<p><strong>SWIFT:</strong> ${invoice.wireSwift}</p>` : ''}
    ${invoice.checkPayableTo ? `<p><strong>Checks payable to:</strong> ${invoice.checkPayableTo}</p>` : ''}
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 2px solid #333;
    }
    .logo { max-width: 150px; max-height: 80px; }
    .company-info h1 { font-size: 22px; margin: 8px 0; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 26px; margin-bottom: 6px; color: #2c3e50; }
    .meta { margin-top: 6px; }
    .details { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 20px; }
    .detail-section { flex: 1; }
    .detail-section h3 {
      font-size: 13px;
      margin-bottom: 8px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-section p { margin: 4px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #2c3e50;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e5e7eb;
    }
    td {
      padding: 9px 10px;
      border: 1px solid #e5e7eb;
    }
    tr:nth-child(even) { background-color: #f9fafb; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 320px; }
    .totals td { border: none; padding: 6px 0; }
    .totals td:first-child { text-align: right; font-weight: 600; padding-right: 12px; }
    .totals .total-row {
      border-top: 2px solid #333;
      font-size: 15px;
      font-weight: 700;
    }
    .notes, .payments, .terms {
      margin-top: 16px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 6px;
    }
    .notes h3, .payments h3, .terms h3 { margin-bottom: 8px; color: #555; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #777;
      font-size: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .status-DRAFT { background-color: #95a5a6; color: white; }
    .status-SENT { background-color: #3498db; color: white; }
    .status-PAID { background-color: #27ae60; color: white; }
    .status-OVERDUE { background-color: #e74c3c; color: white; }
    .status-CANCELED { background-color: #7f8c8d; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${invoice.company.logoUrl ? `<img src="${invoice.company.logoUrl}" alt="Logo" class="logo" />` : ''}
      <h1>${invoice.company.name}</h1>
      ${formatAddress(invoice.company) ? `<p>${formatAddress(invoice.company)}</p>` : ''}
      ${invoice.company.email ? `<p>Email: ${invoice.company.email}</p>` : ''}
      ${invoice.company.phone ? `<p>Phone: ${invoice.company.phone}</p>` : ''}
      ${
        invoice.company.taxIdLabel && invoice.company.taxIdValue
          ? `<p>${invoice.company.taxIdLabel}: ${invoice.company.taxIdValue}</p>`
          : ''
      }
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      <div class="meta">
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        ${paymentTerms ? `<p><strong>Payment Terms:</strong> ${paymentTerms}</p>` : ''}
        ${invoice.poNumber ? `<p><strong>PO #:</strong> ${invoice.poNumber}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="details">
    <div class="detail-section">
      <h3>Bill From</h3>
      <p><strong>${invoice.company.name}</strong></p>
      ${formatAddress(invoice.company) ? `<p>${formatAddress(invoice.company)}</p>` : ''}
    </div>
    <div class="detail-section">
      <h3>Bill To</h3>
      <p><strong>${invoice.client.name}</strong></p>
      ${formatAddress(invoice.client) ? `<p>${formatAddress(invoice.client)}</p>` : ''}
      ${invoice.client.email ? `<p>Email: ${invoice.client.email}</p>` : ''}
      ${
        invoice.client.taxIdLabel && invoice.client.taxIdValue
          ? `<p>${invoice.client.taxIdLabel}: ${invoice.client.taxIdValue}</p>`
          : ''
      }
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Tax %</th>
        <th class="text-right">Discount %</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map((item: any) => {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemDiscount = (itemSubtotal * item.discountPercent) / 100;
          const itemAfterDiscount = itemSubtotal - itemDiscount;
          const itemTax =
            invoice.taxMode !== 'NONE' && invoice.taxScope === 'LINE_ITEM'
              ? (itemAfterDiscount * item.taxPercent) / 100
              : 0;
          const itemTotal = itemAfterDiscount + itemTax;
          return `
          <tr>
            <td>${item.title}</td>
            <td>${item.description || '-'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${item.taxPercent || 0}%</td>
            <td class="text-right">${item.discountPercent || 0}%</td>
            <td class="text-right">${formatCurrency(itemTotal)}</td>
          </tr>
        `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal:</td><td class="text-right">${formatCurrency(totals.subtotal)}</td></tr>
      <tr><td>Discount:</td><td class="text-right">-${formatCurrency(totals.discountTotal)}</td></tr>
      <tr><td>Tax:</td><td class="text-right">${formatCurrency(totals.taxTotal)}</td></tr>
      <tr><td>Shipping:</td><td class="text-right">${formatCurrency(totals.shippingTotal)}</td></tr>
      <tr class="total-row"><td>Total:</td><td class="text-right">${formatCurrency(totals.total)}</td></tr>
      ${
        totals.paidAmount > 0
          ? `<tr><td>Paid:</td><td class="text-right">${formatCurrency(totals.paidAmount)}</td></tr>
             <tr><td>Amount Due:</td><td class="text-right">${formatCurrency(totals.dueAmount)}</td></tr>`
          : `<tr><td>Amount Due:</td><td class="text-right">${formatCurrency(totals.dueAmount)}</td></tr>`
      }
    </table>
  </div>

  ${
    invoice.notes || invoice.memo
      ? `<div class="notes">
    <h3>Notes</h3>
    <p>${invoice.memo || invoice.notes}</p>
  </div>`
      : ''
  }

  ${
    paymentInstructions.trim()
      ? `<div class="payments">
    <h3>Payment Instructions</h3>
    ${paymentInstructions}
  </div>`
      : ''
  }

  ${
    invoice.termsConditions
      ? `<div class="terms">
    <h3>Terms & Conditions</h3>
    <p>${invoice.termsConditions}</p>
  </div>`
      : ''
  }

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `;
}
