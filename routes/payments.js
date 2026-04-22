import { Router } from 'express';
import { createNowPaymentsInvoice, nowPaymentsWebhook } from '../controllers/paymentController.js';

const router = Router();

router.post('/nowpayments/invoice', createNowPaymentsInvoice);
router.post('/nowpayments/webhook', nowPaymentsWebhook);

export default router;
