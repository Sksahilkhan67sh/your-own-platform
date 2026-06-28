import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    land: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    source: { type: String, enum: ['whatsapp_cta'], default: 'whatsapp_cta' },
    contactMethod: { type: String, default: 'whatsapp' },
    messagePreview: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
