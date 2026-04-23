import { Router } from 'express';
import { createUser, getAllUsers, loginUser } from '../controllers/userController.js';

const router = Router();

router.post('/signup', createUser);
router.post('/login', loginUser);
router.post('/', createUser); // Keeping old one for backward compatibility
router.get('/', getAllUsers);

export default router;
