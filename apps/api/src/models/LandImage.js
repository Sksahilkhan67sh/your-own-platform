import mongoose from 'mongoose';

const landImageSchema = new mongoose.Schema(
  {
    land: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    imageUrl: { type: String, required: true },
    storageKey: { type: String, required: true }, // S3 object key, used to delete from S3 later
    altText: { type: String, maxlength: 150, default: '' },
    sortOrder: { type: Number, required: true, default: 0 },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: true }
);

landImageSchema.index({ land: 1, sortOrder: 1 });

export const LandImage = mongoose.model('LandImage', landImageSchema);
