import mongoose from 'mongoose';

const nowPaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priceAmount: {
    type: Number,
    required: true
  },
  priceCurrency: {
    type: String,
    default: 'USD'
  },
  payAmount: {
    type: Number
  },
  payCurrency: {
    type: String
  },
  paymentStatus: {
    type: String,
    default: 'waiting',
    enum: ['waiting', 'confirming', 'confirmed', 'finished', 'failed', 'expired']
  },
  invoiceId: {
    type: String
  }
}, {
  timestamps: true
});

const NowPayment = mongoose.model('NowPayment', nowPaymentSchema);

export default NowPayment;
