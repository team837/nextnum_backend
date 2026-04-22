import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import bcrypt from 'bcryptjs';

export const createUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword,
            name
        });

        // Create wallet for user
        await Wallet.create({
            userId: user._id,
            balance: 0,
            currency: 'USD'
        });

        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };

        res.json(userResponse);
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'email name createdAt');
        res.json(users);
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
