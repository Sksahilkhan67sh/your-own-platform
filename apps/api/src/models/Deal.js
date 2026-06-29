import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    land: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true, index: true },

    finalPrice: { type: Number, required: true, min: 0 },

    buyerName: { type: String, required: true, trim: true },
    buyerContact: { type: String, required: true, trim: true },
    sellerName: { type: String, required: true, trim: true },
    sellerContact: { type: String, required: true, trim: true },

    // Stored per-deal (not read from a global config) so historical deals
    // remain accurate even if the commission rate changes in the future.
    commissionRate: { type: Number, required: true, default: 2, min: 0, max: 100 },
    buyerCommissionAmount: { type: Number, required: true, min: 0 },
    sellerCommissionAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'cancelled'],
      default: 'pending_payment',
      index: true,
    },

    notes: { type: String, maxlength: 1000, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

dealSchema.index({ createdAt: -1 });

export const Deal = mongoose.model('Deal', dealSchema);
