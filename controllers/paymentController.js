import NowPayment from '../models/NowPayment.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { nowPayments } from '../services/nowpayments.js';
import mongoose from 'mongoose';

export const createNowPaymentsInvoice = async (req, res) => {
    try {
        const { userId, amount, currency = 'USD' } = req.body;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (!userId || !amount) {
            return res.status(400).json({ error: 'User ID and amount are required' });
        }

        const orderId = `DEP-${userId.slice(-5)}-${Date.now()}`;

        const invoiceData = await nowPayments.createInvoice({
            price_amount: amount,
            price_currency: currency.toLowerCase(),
            order_id: orderId,
            order_description: `Wallet Deposit for User ${userId}`,
            ipn_callback_url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/nowpayments/webhook`,
            success_url: `${appUrl}/dashboard/wallet?status=success`,
            cancel_url: `${appUrl}/dashboard/wallet?status=cancel`,
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
            status: 'waiting'
        });
    } catch (error) {
        console.error('NowPayments invoice error details:', {
            message: error.message,
            stack: error.stack,
            params: { amount, currency, userId }
        });
        res.status(500).json({ 
            error: error.message.includes('NowPayments API Error') 
                ? 'Payment provider error: ' + error.message 
                : 'Failed to create payment invoice' 
        });
    }
};

export const nowPaymentsWebhook = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payload = req.body;
        const { payment_id, payment_status } = payload;

        const payment = await NowPayment.findOne({ paymentId: payment_id.toString() }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Payment not found' });
        }

        payment.paymentStatus = payment_status;
        payment.updatedAt = new Date();
        await payment.save({ session });

        if (payment_status === 'finished') {
            const wallet = await Wallet.findOneAndUpdate(
                { userId: payment.userId },
                { $inc: { balance: payment.priceAmount } },
                { upsert: true, new: true, session }
            );

            await Transaction.create([{
                userId: payment.userId,
                type: 'deposit',
                amount: payment.priceAmount,
                currency: payment.priceCurrency,
                status: 'completed',
                description: `Crypto deposit via NowPayments - ID: ${payment_id}`
            }], { session });
        }

        await session.commitTransaction();
        res.json({ received: true });
    } catch (error) {
        await session.abortTransaction();
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
};
