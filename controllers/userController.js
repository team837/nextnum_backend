// controllers/userController.js — Hardened auth with short-lived JWTs,
// refresh token rotation, HttpOnly cookies, self-referral blocking (C3, C4, C7, H7)

import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Referral from '../models/Referral.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Token Helpers ───────────────────────────────────────────────────────────

const MAX_REFERRALS_PER_USER = 50;
const REFERRAL_REWARD = 2.00;

/**
 * Generates a short-lived access token (15min) and a long-lived refresh token (7d).
 */
function generateTokens(userId) {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m', algorithm: 'HS256' }
    );
    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
    );
    return { accessToken, refreshToken };
}

/**
 * Sets the access token as an HttpOnly, Secure, SameSite=Strict cookie.
 */
function setAuthCookie(res, accessToken) {
    res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
    });
}

/**
 * Sets the refresh token as an HttpOnly, Secure, SameSite=Strict cookie.
 */
function setRefreshCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/users/refresh',
    });
}

/**
 * Builds a safe user response object (no password, no internals).
 */
function safeUserResponse(user) {
    return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
    };
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

export const createUser = async (req, res) => {
    try {
        const { email, password, name, referredBy } = req.body;

        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            name: name?.trim() || undefined,
            referredBy: referredBy || null,
        });

        // Create wallet for user
        await Wallet.create({
            userId: user._id,
            balance: 0,
            currency: 'USD',
        });

        // Handle referral — with self-referral block and reward cap (H7)
        if (referredBy) {
            try {
                // Block self-referral
                if (referredBy === user._id.toString()) {
                    console.warn(`Self-referral attempt blocked for user ${user._id}`);
                } else {
                    // Verify referrer exists
                    const referrer = await User.findById(referredBy);
                    if (referrer) {
                        // Cap rewards per referrer
                        const existingCount = await Referral.countDocuments({ referrerId: referredBy });
                        if (existingCount < MAX_REFERRALS_PER_USER) {
                            await Referral.create({
                                referrerId: referredBy,
                                referredId: user._id,
                                status: 'active',
                                rewardAmount: REFERRAL_REWARD,
                            });

                            // Credit referrer's wallet (atomic update)
                            await Wallet.findOneAndUpdate(
                                { userId: referredBy },
                                { $inc: { balance: REFERRAL_REWARD } }
                            );
                        } else {
                            console.info(`Referral cap reached for referrer ${referredBy}`);
                        }
                    }
                }
            } catch (referralError) {
                // Don't fail signup if referral processing fails
                console.error('Referral processing error:', referralError.message);
            }
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        setAuthCookie(res, accessToken);
        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            user: safeUserResponse(user),
        });
    } catch (error) {
        console.error('User creation error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        setAuthCookie(res, accessToken);
        setRefreshCookie(res, refreshToken);

        res.json({
            user: safeUserResponse(user),
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Issues a new access token using the refresh token from the HttpOnly cookie.
 */
export const refreshAccessToken = async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Verify user still exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        // Rotate: issue new access + refresh tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        setAuthCookie(res, accessToken);
        setRefreshCookie(res, refreshToken);

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        // Clear invalid cookie
        res.clearCookie('refreshToken', { path: '/api/users/refresh' });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expired — please log in again' });
        }
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
};

/**
 * Logs out by clearing the refresh token cookie.
 */
export const logoutUser = async (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/users/refresh',
    });
    res.json({ message: 'Logged out successfully' });
};

/**
 * Admin-only: list users with pagination.
 */
export const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find({}, 'email name role createdAt')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            User.countDocuments(),
        ]);

        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Users fetch error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        // Uses req.user from protect middleware — user can only delete themselves
        const userId = req.user._id;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Wallet.findOneAndDelete({ userId });

        // Clear refresh cookie
        res.clearCookie('refreshToken', { path: '/api/users/refresh' });

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email } = req.body;

        // Only allow updating name and email
        const updateFields = {};
        if (name !== undefined) updateFields.name = name.trim();
        if (email !== undefined) updateFields.email = email.trim().toLowerCase();

        // If changing email, check for conflicts
        if (updateFields.email && updateFields.email !== req.user.email) {
            const existing = await User.findOne({ email: updateFields.email });
            if (existing) {
                return res.status(400).json({ error: 'This email is already in use' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: safeUserResponse(updatedUser),
        });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
