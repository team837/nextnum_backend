import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from './config/db.js';
import userRoutes from './routes/users.js';
import numberRoutes from './routes/numbers.js';
import walletRoutes from './routes/wallet.js';
import smsRoutes from './routes/sms.js';
import paymentRoutes from './routes/payments.js';
import bitcoinRoutes from './routes/bitcoin.js';

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), database: 'mongodb' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/numbers', numberRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bitcoin', bitcoinRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Standalone Backend (MVC) running at http://localhost:${PORT}`);
});
