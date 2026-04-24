import { Router } from 'express';
import { createUser, getAllUsers, loginUser, deleteUser, updateProfile, updatePassword } from '../controllers/userController.js';

const router = Router();

router.post('/signup', createUser);
router.post('/login', loginUser);
router.post('/', createUser); // Keeping old one for backward compatibility
router.get('/', getAllUsers);
router.delete('/', deleteUser);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router;
