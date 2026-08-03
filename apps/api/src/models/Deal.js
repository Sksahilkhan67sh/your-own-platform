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

    // Set automatically the first time a deal transitions to 'paid' (see
    // the pre-save hook below). This is the single source of truth for
    // "when did this land actually sell" — Land Market Analytics reads
    // paid deals as the historical sales record instead of a separate
    // sales table, since a Deal already *is* an immutable sale record
    // once paid (deals are never deleted after payment in normal use).
    soldDate: { type: Date },

    notes: { type: String, maxlength: 1000, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

dealSchema.index({ createdAt: -1 });
// Land Market Analytics: date-range and per-listing sales lookups.
dealSchema.index({ status: 1, soldDate: -1 });
dealSchema.index({ land: 1, status: 1 });

dealSchema.pre('save', function setSoldDateOnPaid(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.soldDate) {
    this.soldDate = new Date();
  }
  next();
});

export const Deal = mongoose.model('Deal', dealSchema);
