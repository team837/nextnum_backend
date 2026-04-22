import mongoose from 'mongoose';

const virtualNumberSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  areaCode: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'available',
    enum: ['available', 'active', 'expired', 'suspended']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  activatedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for SMS messages
virtualNumberSchema.virtual('smsMessages', {
  ref: 'SMS',
  localField: '_id',
  foreignField: 'virtualNumberId'
});

const VirtualNumber = mongoose.model('VirtualNumber', virtualNumberSchema);

export default VirtualNumber;
