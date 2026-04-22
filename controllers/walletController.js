import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const getWallet = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const wallet = await Wallet.findOne({ userId }).populate('userId', 'email name');

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (error) {
        console.error('Wallet fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { userId, amount, paymentMethod = 'fiat' } = req.body;

        if (!userId || !amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Invalid request data' });
        }

        if (paymentMethod === 'bitcoin') {
            const transaction = await Transaction.create([{
                userId,
                type: 'deposit',
                amount,
                currency: 'USD',
                status: 'pending',
                description: `Bitcoin deposit request - ${amount} USD`
            }], { session });

            await session.commitTransaction();
            return res.json({
                message: 'Bitcoin payment initiated',
                transactionId: transaction[0]._id,
                status: 'pending'
            });
        } else {
            const wallet = await Wallet.findOneAndUpdate(
                { userId },
                { $inc: { balance: amount } },
                { new: true, session }
            );

            await Transaction.create([{
                userId,
                type: 'deposit',
                amount,
                currency: 'USD',
                status: 'completed',
                description: `Wallet deposit of $${amount}`
            }], { session });

            await session.commitTransaction();
            return res.json(wallet);
        }
    } catch (error) {
        await session.abortTransaction();
        console.error('Wallet deposit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
};
