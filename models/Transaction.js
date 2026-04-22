import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'purchase', 'refund']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed']
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
