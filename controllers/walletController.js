// controllers/walletController.js — Uses req.user._id everywhere, no IDOR (C6)

import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

/**
 * GET /api/wallet — Returns the authenticated user's wallet and transactions.
 * userId comes from the JWT (req.user), NOT from query params.
 */
export const getWallet = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware — never from query

        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ wallet, transactions });
    } catch (error) {
        console.error('Wallet fetch error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/wallet/deposit — Initiates a deposit for the authenticated user.
 * Amount is validated by the validateDeposit middleware before reaching here.
 */
export const deposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id; // From auth middleware — never from body
        const { amount, paymentMethod = 'fiat' } = req.body;

        if (paymentMethod === 'bitcoin') {
            const transaction = await Transaction.create([{
                userId,
                type: 'deposit',
                amount,
                currency: 'USD',
                status: 'pending',
                description: `Bitcoin deposit request — $${amount} USD`,
            }], { session });

            await session.commitTransaction();
            return res.json({
                message: 'Bitcoin payment initiated',
                transactionId: transaction[0]._id,
                status: 'pending',
            });
        } else {
            const wallet = await Wallet.findOneAndUpdate(
                { userId },
                { $inc: { balance: amount } },
                { new: true, session }
            );

            if (!wallet) {
                await session.abortTransaction();
                return res.status(404).json({ error: 'Wallet not found' });
            }

            await Transaction.create([{
                userId,
                type: 'deposit',
                amount,
                currency: 'USD',
                status: 'completed',
                description: `Wallet deposit of $${amount}`,
            }], { session });

            await session.commitTransaction();
            return res.json(wallet);
        }
    } catch (error) {
        await session.abortTransaction();
        console.error('Wallet deposit error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
};
