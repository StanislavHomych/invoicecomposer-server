"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const client_2 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function calculateTotals(items, options = {}) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableBase = 0;
    let lineTaxTotal = 0;
    const taxMode = options.taxMode || client_2.TaxMode.NONE;
    const taxScope = options.taxScope || client_2.TaxScope.LINE_ITEM;
    const invoiceTaxPercent = options.invoiceTaxPercent || 0;
    const shipping = options.shippingAmount || 0;
    for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemDiscount = (itemSubtotal * (item.discountPercent || 0)) / 100;
        const itemAfterDiscount = itemSubtotal - itemDiscount;
        const itemTax = taxMode !== client_2.TaxMode.NONE && taxScope === client_2.TaxScope.LINE_ITEM
            ? (itemAfterDiscount * (item.taxPercent || 0)) / 100
            : 0;
        subtotal += itemSubtotal;
        discountTotal += itemDiscount;
        taxableBase += itemAfterDiscount;
        lineTaxTotal += itemTax;
    }
    const taxTotal = taxMode === client_2.TaxMode.NONE
        ? 0
        : taxScope === client_2.TaxScope.INVOICE
            ? (taxableBase * invoiceTaxPercent) / 100
            : lineTaxTotal;
    const total = subtotal - discountTotal + taxTotal + shipping;
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountTotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        shippingTotal: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
    };
}
async function main() {
    // Create user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
        },
    });
    // Create company
    const company = await prisma.company.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            name: 'Acme Corporation',
            addressLine1: '500 Market St',
            addressLine2: 'Suite 2100',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
            email: 'info@acme.com',
            phone: '+1-415-555-0101',
            taxIdLabel: 'EIN',
            taxIdValue: '12-3456789',
            bankDetails: 'Bank: First Federal, Routing: 011000015, Account: 7894561230',
            timeZone: 'America/Los_Angeles',
        },
    });
    // Create clients
    const client1 = await prisma.client.create({
        data: {
            userId: user.id,
            name: 'Tech Solutions Inc',
            email: 'contact@techsolutions.com',
            addressLine1: '123 Madison Ave',
            city: 'New York',
            state: 'NY',
            postalCode: '10016',
            country: 'US',
            taxIdLabel: 'EIN',
            taxIdValue: '98-7654321',
            notes: 'Regular customer, payment terms: Net 30',
        },
    });
    const client2 = await prisma.client.create({
        data: {
            userId: user.id,
            name: 'Digital Services Ltd',
            email: 'info@digitalservices.com',
            addressLine1: '200 Peachtree St NE',
            city: 'Atlanta',
            state: 'GA',
            postalCode: '30303',
            country: 'US',
            taxIdLabel: 'VAT',
            taxIdValue: 'GB999999973',
            notes: 'New client, preferred payment method: Bank transfer',
        },
    });
    // Create invoices
    const currentYear = new Date().getFullYear();
    const invoice1Items = [
        { title: 'Web Development Services', description: 'Custom website development', quantity: 40, unitPrice: 150, taxPercent: 8.25, discountPercent: 0 },
        { title: 'Consulting Hours', description: 'Technical consulting', quantity: 10, unitPrice: 200, taxPercent: 8.25, discountPercent: 5 },
    ];
    const invoice1Totals = calculateTotals(invoice1Items, { taxMode: client_2.TaxMode.SALES_TAX, taxScope: client_2.TaxScope.LINE_ITEM, invoiceTaxPercent: 0, shippingAmount: 75 });
    const invoice1 = await prisma.invoice.create({
        data: {
            userId: user.id,
            companyId: company.id,
            clientId: client1.id,
            invoiceNumber: `INV-${currentYear}-0001`,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'SENT',
            paymentTerms: client_2.PaymentTerms.NET_30,
            currency: 'USD',
            notes: 'Thank you for your business!',
            taxMode: client_2.TaxMode.SALES_TAX,
            taxScope: client_2.TaxScope.LINE_ITEM,
            invoiceTaxPercent: 0,
            shippingAmount: 75,
            subtotal: invoice1Totals.subtotal,
            discountTotal: invoice1Totals.discountTotal,
            taxTotal: invoice1Totals.taxTotal,
            total: invoice1Totals.total,
            paidAmount: 0,
            dueAmount: invoice1Totals.total,
            items: { create: invoice1Items },
        },
    });
    const invoice2Items = [
        { title: 'Mobile App Development', description: 'iOS and Android app', quantity: 80, unitPrice: 120, taxPercent: 0, discountPercent: 0 },
    ];
    const invoice2Totals = calculateTotals(invoice2Items, { taxMode: client_2.TaxMode.NONE, taxScope: client_2.TaxScope.LINE_ITEM, shippingAmount: 0 });
    const invoice2 = await prisma.invoice.create({
        data: {
            userId: user.id,
            companyId: company.id,
            clientId: client2.id,
            invoiceNumber: `INV-${currentYear}-0002`,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'DRAFT',
            paymentTerms: client_2.PaymentTerms.NET_45,
            currency: 'USD',
            taxMode: client_2.TaxMode.NONE,
            taxScope: client_2.TaxScope.LINE_ITEM,
            shippingAmount: 0,
            subtotal: invoice2Totals.subtotal,
            discountTotal: invoice2Totals.discountTotal,
            taxTotal: invoice2Totals.taxTotal,
            total: invoice2Totals.total,
            paidAmount: 0,
            dueAmount: invoice2Totals.total,
            items: { create: invoice2Items },
        },
    });
    await prisma.invoiceSequence.upsert({
        where: { year: currentYear },
        update: { lastNumber: 2 },
        create: { year: currentYear, lastNumber: 2 },
    });
    console.log('Seed data created:');
    console.log('- User:', user.email);
    console.log('- Company:', company.name);
    console.log('- Clients:', client1.name, client2.name);
    console.log('- Invoices:', invoice1.invoiceNumber, invoice2.invoiceNumber);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
