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

export const deleteUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Wallet.findOneAndDelete({ userId });

        res.json({ message: 'User and wallet deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { name, email } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userResponse = {
            id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            createdAt: updatedUser.createdAt
        };

        res.json({ message: 'Profile updated successfully', user: userResponse });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
