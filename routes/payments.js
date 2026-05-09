// routes/payments.js — Webhook protected by HMAC verification (C1)

import { Router } from 'express';
import { createNowPaymentsInvoice, nowPaymentsWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { verifyNowPaymentsIPN } from '../middleware/webhookVerify.js';
import { validateDeposit } from '../middleware/validators.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Invoice creation requires auth + amount validation
router.post('/nowpayments/invoice', protect, paymentLimiter, validateDeposit, createNowPaymentsInvoice);

// Webhook is verified by HMAC signature, not JWT
router.post('/nowpayments/webhook', verifyNowPaymentsIPN, nowPaymentsWebhook);

export default router;
