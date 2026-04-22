import { Router } from 'express';
import { getSMS, receiveSMS } from '../controllers/smsController.js';

const router = Router();

router.get('/', getSMS);
router.post('/', receiveSMS);

export default router;
