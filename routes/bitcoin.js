import { Router } from 'express';
import { getBitcoinWallets, createBitcoinWallet } from '../controllers/bitcoinController.js';

const router = Router();

router.get('/', getBitcoinWallets);
router.post('/', createBitcoinWallet);

export default router;
