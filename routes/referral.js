import { Router } from 'express';
import { getReferralStats, getRecentReferrals } from '../controllers/referralController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', protect, getReferralStats);
router.get('/recent', protect, getRecentReferrals);

export default router;
