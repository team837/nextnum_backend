import mongoose from 'mongoose';

const bitcoinTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BitcoinWallet',
    required: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'failed']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const BitcoinTransaction = mongoose.model('BitcoinTransaction', bitcoinTransactionSchema);

export default BitcoinTransaction;
