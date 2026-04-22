import mongoose from 'mongoose';

const smsSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  virtualNumberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualNumber',
    required: true
  }
}, {
  timestamps: true
});

const SMS = mongoose.model('SMS', smsSchema);

export default SMS;
