import { Router } from 'express';
import { getWallet, deposit } from '../controllers/walletController.js';

const router = Router();

router.get('/', getWallet);
router.post('/deposit', deposit);

export default router;
