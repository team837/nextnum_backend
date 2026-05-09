// routes/wallet.js — All routes require authentication (C5)

import { Router } from 'express';
import { getWallet, deposit } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateDeposit } from '../middleware/validators.js';

const router = Router();

router.get('/', protect, getWallet);
router.post('/deposit', protect, validateDeposit, deposit);

export default router;
