// routes/numbers.js — protect on purchase, adminOnly on creation (C5)

import { Router } from 'express';
import { getNumbers, createNumber, purchaseNumber } from '../controllers/numberController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getNumbers);                                  // Public — browse catalog
router.post('/', protect, adminOnly, createNumber);           // Admin only — add inventory
router.post('/purchase', protect, purchaseNumber);            // Auth required — buy number

export default router;
