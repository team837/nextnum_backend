// server.js — Hardened Express server (H1–H6)
// Includes: Helmet, rate limiting, CORS lockdown, NoSQL sanitize, body size limit

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend .env first, then root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from './config/db.js';
import userRoutes from './routes/users.js';
import numberRoutes from './routes/numbers.js';
import walletRoutes from './routes/wallet.js';
import smsRoutes from './routes/sms.js';
import paymentRoutes from './routes/payments.js';
import bitcoinRoutes from './routes/bitcoin.js';
import referralRoutes from './routes/referral.js';

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Trust Proxy (H1 - Rate Limiting) ──────────────────────────────────────
app.set('trust proxy', 1);

// ── Security Headers (H2) ───────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.disable('x-powered-by');

// ── CORS Configuration (H6) ─────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean); // Remove falsy values

app.use(cors({
    origin: function (origin, callback) {
        // Reject requests with no origin (Postman/curl) in production
        if (!origin) {
            if (process.env.NODE_ENV === 'production') {
                return callback(new Error('CORS: Origin header required'), false);
            }
            return callback(null, true); // Allow in development
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing (H5) ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));   // 10KB body size limit
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());                     // For refresh token cookies

// ── NoSQL Injection Protection (H3) ──────────────────────────────────────────
app.use(mongoSanitize());

// ── Content-Type Enforcement ─────────────────────────────────────────────────
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.path !== '/api/payments/nowpayments/webhook') {
        const ct = req.headers['content-type'];
        if (!ct || !ct.includes('application/json')) {
            return res.status(415).json({ error: 'Content-Type must be application/json' });
        }
    }
    next();
});

// ── Rate Limiting (H1) ──────────────────────────────────────────────────────

// Global: 100 requests per minute per IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please slow down' },
});
app.use(globalLimiter);

// Auth endpoints: stricter limits
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { error: 'Too many accounts created. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Too many payment requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply route-specific limiters
app.use('/api/users/login', loginLimiter);
app.use('/api/users/signup', signupLimiter);
app.use('/api/users/', signupLimiter); // Legacy signup route
app.use('/api/payments', paymentLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    const dbOk = mongoose.connection.readyState === 1;
    res.status(dbOk ? 200 : 503).json({
        status: dbOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/numbers', numberRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bitcoin', bitcoinRoutes);
app.use('/api/referrals', referralRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // CORS errors
    if (err.message?.includes('CORS')) {
        return res.status(403).json({ error: 'CORS policy violation' });
    }
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Standalone Backend (MVC) running at http://localhost:${PORT}`);
});
