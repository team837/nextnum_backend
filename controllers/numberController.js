import VirtualNumber from '../models/VirtualNumber.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const getNumbers = async (req, res) => {
    try {
        const { country, status = 'available' } = req.query;

        const query = { status };
        if (country) query.country = country;

        const numbers = await VirtualNumber.find(query);
        res.json(numbers);
    } catch (error) {
        console.error('Numbers fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createNumber = async (req, res) => {
    try {
        const { number, country, areaCode, provider, price, duration } = req.body;

        const virtualNumber = await VirtualNumber.create({
            number,
            country,
            areaCode,
            provider,
            price,
            duration,
            status: 'available'
        });

        res.json(virtualNumber);
    } catch (error) {
        console.error('Number creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const purchaseNumber = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { numberId, userId } = req.body;

        if (!numberId || !userId) {
            return res.status(400).json({ error: 'Missing numberId or userId' });
        }

        const number = await VirtualNumber.findById(numberId).session(session);

        if (!number || number.status !== 'available') {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Number not available' });
        }

        const wallet = await Wallet.findOne({ userId }).session(session);

        if (!wallet || wallet.balance < number.price) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + number.duration);

        // Update number
        number.status = 'active';
        number.userId = userId;
        number.activatedAt = new Date();
        number.expiresAt = expiresAt;
        await number.save({ session });

        // Deduct balance
        wallet.balance -= number.price;
        await wallet.save({ session });

        // Create transaction
        await Transaction.create([{
            userId,
            type: 'purchase',
            amount: -number.price,
            currency: number.currency,
            status: 'completed',
            description: `Purchased virtual number ${number.number}`
        }], { session });

        await session.commitTransaction();
        res.json(number);
    } catch (error) {
        await session.abortTransaction();
        console.error('Purchase error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
};
