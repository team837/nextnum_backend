// config/env.js — Validates all required environment variables on startup (C3)

const REQUIRED_ENV = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NOWPAYMENTS_IPN_SECRET',
    'NowPayments_API_Key',
];

export function validateEnv() {
    const missing = REQUIRED_ENV.filter(key => !process.env[key]?.trim());

    if (missing.length > 0) {
        console.error(`\n❌ FATAL: Missing required environment variables:\n`);
        missing.forEach(key => console.error(`   - ${key}`));
        console.error(`\nSet them in backend/.env and restart.\n`);
        process.exit(1);
    }

    // JWT_SECRET must be at least 256 bits (32 bytes = 64 hex chars)
    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ FATAL: JWT_SECRET must be at least 32 characters (256-bit minimum)');
        process.exit(1);
    }

    console.log('✅ Environment variables validated');
}
