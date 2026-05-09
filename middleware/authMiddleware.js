// middleware/authMiddleware.js — JWT auth + RBAC (C3, C5, H8)
// NO fallback secret. JWT_SECRET must be set in .env or server won't start.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protects a route by requiring a valid JWT Bearer token.
 * Attaches the authenticated user to req.user (excluding password).
 */
export const protect = async (req, res, next) => {
    let token;

    // 1. Check Authorization Header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Check HttpOnly Cookie (auth_token)
    else if (req.cookies && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'], // Pin algorithm to prevent algorithm confusion attacks
        });

        // Only accept access tokens, not refresh tokens
        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired — please refresh' });
        }
        return res.status(401).json({ error: 'Not authorized — invalid token' });
    }
};

/**
 * Restricts access to admin users only.
 * Must be used AFTER the protect middleware.
 */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
