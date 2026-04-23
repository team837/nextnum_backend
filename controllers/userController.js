import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Use a secret from .env or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
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

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };

        res.json({ user: userResponse, token });
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };

        res.json({ user: userResponse, token });
    } catch (error) {
        console.error('Login error:', error);
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
