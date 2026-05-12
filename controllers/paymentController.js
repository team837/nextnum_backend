// controllers/paymentController.js — Idempotency guard + IDOR fix (C2, C6)

import NowPayment from '../models/NowPayment.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { nowPayments } from '../services/nowpayments.js';
import mongoose from 'mongoose';

/**
 * POST /api/payments/nowpayments/invoice
 * Creates a NowPayments invoice for the authenticated user.
 * userId comes from req.user (JWT), NOT from req.body.
 */
export const createNowPaymentsInvoice = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware — never from body
        const { amount, currency = 'USD' } = req.body;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        const orderId = `DEP-${userId.toString().slice(-5)}-${Date.now()}`;

        const invoiceData = await nowPayments.createInvoice({
            price_amount: amount,
            price_currency: currency.toLowerCase(),
            order_id: orderId,
            order_description: `Wallet Deposit for User ${userId}`,
            ipn_callback_url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/nowpayments/webhook`,
            success_url: `${appUrl}/payment/success`,
            cancel_url: `${appUrl}/payment/failed`,
        });

        await NowPayment.create({
            paymentId: (invoiceData.id || invoiceData.invoice_id)?.toString(),
            userId,
            priceAmount: amount,
            priceCurrency: currency,
            paymentStatus: 'waiting',
            invoiceId: (invoiceData.id || invoiceData.invoice_id)?.toString(),
        });

        res.json({
            paymentId: invoiceData.id || invoiceData.invoice_id,
            checkoutUrl: invoiceData.invoice_url,
            status: 'waiting',
        });
    } catch (error) {
        console.error('NowPayments invoice error:', error.message);
        res.status(500).json({
            error: error.message.includes('NowPayments API Error')
                ? 'Payment provider error — please try again'
                : 'Failed to create payment invoice',
        });
    }
};

/**
 * POST /api/payments/nowpayments/webhook
 * Processes NowPayments IPN callbacks.
 * Protected by verifyNowPaymentsIPN middleware (HMAC-SHA512 verification).
 * Includes idempotency guard to prevent double-crediting (C2).
 */
export const nowPaymentsWebhook = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payload = req.body;
        const { payment_id, payment_status } = payload;

        if (!payment_id || !payment_status) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Missing payment_id or payment_status' });
        }

        const payment = await NowPayment.findOne({
            paymentId: payment_id.toString(),
        }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Payment not found' });
        }

        // ── IDEMPOTENCY GUARD (C2) ──────────────────────────────────────────
        // If this payment was already marked 'finished', don't credit again.
        if (payment.paymentStatus === 'finished') {
            await session.abortTransaction();
            console.info(`Duplicate webhook ignored for payment ${payment_id}`);
            return res.json({ received: true, message: 'Already processed' });
        }

        // Update payment status
        payment.paymentStatus = payment_status;
        payment.updatedAt = new Date();
        await payment.save({ session });

        // Handle terminal failed/expired statuses
        if (['failed', 'expired', 'partially_paid'].includes(payment_status)) {
            await Transaction.create([{
                userId: payment.userId,
                type: 'deposit',
                amount: payment.priceAmount,
                currency: payment.priceCurrency,
                status: 'failed',
                description: `Crypto deposit ${payment_status} — ID: ${payment_id}`,
            }], { session });
        }

        // Only credit wallet when payment is confirmed as finished
        if (payment_status === 'finished') {
            await Wallet.findOneAndUpdate(
                { userId: payment.userId },
                { $inc: { balance: payment.priceAmount } },
                { new: true, session }
            );

            await Transaction.create([{
                userId: payment.userId,
                type: 'deposit',
                amount: payment.priceAmount,
                currency: payment.priceCurrency,
                status: 'completed',
                description: `Crypto deposit via NowPayments — ID: ${payment_id}`,
            }], { session });

            console.info(`Wallet credited: user=${payment.userId} amount=${payment.priceAmount} paymentId=${payment_id}`);
        }

        await session.commitTransaction();
        res.json({ received: true });
    } catch (error) {
        await session.abortTransaction();
        console.error('Webhook processing error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
};
