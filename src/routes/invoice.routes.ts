import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);
router.post('/:id/payments', invoiceController.recordPayment);
router.post('/:id/generate-pdf', invoiceController.generatePdf);
router.get('/:id/download-pdf', invoiceController.downloadPdf);

export default router;
