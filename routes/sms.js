// routes/sms.js — GET requires auth, POST is provider webhook (C5)

import { Router } from 'express';
import { getSMS, receiveSMS } from '../controllers/smsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getSMS);   // Auth required — users read their own SMS
router.post('/', receiveSMS);       // SMS provider webhook — add API key auth in production

export default router;
