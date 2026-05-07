import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for wallet
userSchema.virtual('wallet', {
  ref: 'Wallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual for transactions
userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId'
});

const User = mongoose.model('User', userSchema);

export default User;
