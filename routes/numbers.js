import { Router } from 'express';
import { getNumbers, createNumber, purchaseNumber } from '../controllers/numberController.js';

const router = Router();

router.get('/', getNumbers);
router.post('/', createNumber);
router.post('/purchase', purchaseNumber);

export default router;
