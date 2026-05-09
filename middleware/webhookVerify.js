// middleware/webhookVerify.js — NowPayments HMAC-SHA512 IPN signature verification (C1)

import crypto from 'crypto';

/**
 * Sorts an object's keys recursively (required by NowPayments HMAC spec).
 */
function sortObject(obj) {
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])
            ? sortObject(obj[key])
            : obj[key];
        return result;
    }, {});
}

/**
 * Express middleware that verifies the x-nowpayments-sig header against
 * the request body using HMAC-SHA512 with NOWPAYMENTS_IPN_SECRET.
 * Rejects the request if the signature is missing or invalid.
 */
export const verifyNowPaymentsIPN = (req, res, next) => {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    if (!ipnSecret) {
        console.error('CRITICAL: NOWPAYMENTS_IPN_SECRET is not configured');
        return res.status(500).json({ error: 'Webhook verification not configured' });
    }

    const signature = req.headers['x-nowpayments-sig'];

    if (!signature) {
        console.warn(`Webhook rejected — missing signature | IP: ${req.ip}`);
        return res.status(401).json({ error: 'Missing IPN signature' });
    }

    try {
        const sortedPayload = JSON.stringify(sortObject(req.body));
        const expectedSig = crypto
            .createHmac('sha512', ipnSecret)
            .update(sortedPayload)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');

        if (sigBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            console.warn(`Webhook rejected — signature mismatch | IP: ${req.ip}`);
            return res.status(401).json({ error: 'Invalid IPN signature' });
        }

        next();
    } catch (error) {
        console.error('Webhook signature verification error:', error.message);
        return res.status(401).json({ error: 'Signature verification failed' });
    }
};
