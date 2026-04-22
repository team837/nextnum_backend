import mongoose from 'mongoose';

const bitcoinWalletSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for transactions
bitcoinWalletSchema.virtual('transactions', {
  ref: 'BitcoinTransaction',
  localField: '_id',
  foreignField: 'walletId'
});

const BitcoinWallet = mongoose.model('BitcoinWallet', bitcoinWalletSchema);

export default BitcoinWallet;
