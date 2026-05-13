// middleware/validators.js — Input validation for auth and financial endpoints (H4, M6)

const COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'password123', 'qwerty',
    'letmein', 'abc123', 'monkey', 'dragon', 'master',
    '1234567890', 'qwerty123', 'password1', 'iloveyou',
];

/**
 * Validates password strength.
 * Returns an error string or null if valid.
 */
export function checkPasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return 'Password is required';
    }
    if (password.length < 10) {
        return 'Password must be at least 10 characters';
    }
    if (password.length > 128) {
        return 'Password must not exceed 128 characters';
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        return 'This password is too common. Choose a stronger one.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    return null;
}

/**
 * Validates login request body: email + password presence.
 */
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
        return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 1) {
        return res.status(400).json({ error: 'Password is required' });
    }

    // Normalize email
    req.body.email = email.trim().toLowerCase();
    next();
};

/**
 * Validates signup request body: email + password complexity + name.
 */
export const validateSignup = (req, res, next) => {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
        return res.status(400).json({ error: 'A valid email address is required' });
    }

    const passwordError = checkPasswordStrength(password);
    if (passwordError) {
        return res.status(400).json({ error: passwordError });
    }

    if (name !== undefined && name !== null) {
        if (typeof name !== 'string' || name.length > 100) {
            return res.status(400).json({ error: 'Name must be a string under 100 characters' });
        }
    }

    // Normalize
    req.body.email = email.trim().toLowerCase();
    if (name) req.body.name = name.trim();
    next();
};

/**
 * Validates deposit/payment amount: positive number, max $10,000, 2 decimal places.
 */
export const validateDeposit = (req, res, next) => {
    const { amount } = req.body;
    console.info('validateDeposit Request Body:', JSON.stringify(req.body));
    const num = Number(amount);

    if (amount === undefined || amount === null || isNaN(num) || !isFinite(num)) {
        return res.status(400).json({ error: 'A valid numeric amount is required' });
    }
    if (num <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
    }
    if (num > 10000) {
        return res.status(400).json({ error: 'Maximum deposit is $10,000' });
    }

    // Round to 2 decimal places to prevent floating point shenanigans
    req.body.amount = Math.round(num * 100) / 100;
    next();
};

/**
 * Validates password update request: currentPassword + newPassword complexity.
 */
export const validatePasswordUpdate = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
        return res.status(400).json({ error: 'Current password is required' });
    }

    const passwordError = checkPasswordStrength(newPassword);
    if (passwordError) {
        return res.status(400).json({ error: passwordError });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
    }

    next();
};
