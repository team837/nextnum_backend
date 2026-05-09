// routes/users.js — Hardened with protect middleware on all sensitive routes (C5)

import { Router } from 'express';
import {
    createUser,
    getAllUsers,
    loginUser,
    deleteUser,
    updateProfile,
    getUserProfile,
    updatePassword,
    refreshAccessToken,
    logoutUser,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { validateLogin, validateSignup, validatePasswordUpdate } from '../middleware/validators.js';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.post('/signup', validateSignup, createUser);
router.post('/login', validateLogin, loginUser);
router.post('/', validateSignup, createUser);            // Legacy compat
router.post('/refresh', refreshAccessToken);             // Refresh token rotation

// ── Protected routes (require JWT) ───────────────────────────────────────────
router.post('/logout', protect, logoutUser);
router.delete('/', protect, deleteUser);                 // User deletes own account
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, validatePasswordUpdate, updatePassword);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', protect, adminOnly, getAllUsers);         // No more public user listing

export default router;
