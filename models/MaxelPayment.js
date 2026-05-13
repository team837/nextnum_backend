import mongoose from 'mongoose';

const maxelPaymentSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    enum: ['pending', 'paid', 'partial', 'overpaid', 'expired', 'failed']
  },
  paymentUrl: {
    type: String
  },
  txHash: {
    type: String
  },
  network: {
    type: String
  },
  tokenSymbol: {
    type: String
  }
}, {
  timestamps: true
});

const MaxelPayment = mongoose.model('MaxelPayment', maxelPaymentSchema);

export default MaxelPayment;
