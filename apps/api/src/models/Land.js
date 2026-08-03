import mongoose from 'mongoose';
import { LAND_STATUS_VALUES, AREA_UNIT_VALUES } from '@your-own/shared';

const landSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    description: { type: String, required: true, maxlength: 5000 },

    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    areaValue: { type: Number, required: true, min: 0 },
    areaUnit: { type: String, enum: AREA_UNIT_VALUES, required: true },

    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    country: { type: String, default: 'India' },
    postalCode: { type: String, trim: true },

    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },

    // GeoJSON mirror of latitude/longitude, kept in sync via the pre-save
    // hook below. Lets analyticsRepository run real $geoNear/$near queries
    // ("nearby sold properties") instead of scanning every listing and
    // computing haversine distance in application code.
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat]
    },

    status: { type: String, enum: LAND_STATUS_VALUES, default: 'available', index: true },
    featured: { type: Boolean, default: false, index: true },

    // Optional override; falls back to Settings.defaultWhatsappNumber if unset.
    // Stored as E.164 digits only (validated in the Zod layer, not here).
    whatsappNumberOverride: { type: String, trim: true },

    highlights: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'A maximum of 20 highlights is allowed.',
      },
    },
    amenities: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'A maximum of 20 amenities is allowed.',
      },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Homepage / featured / status-filtered browse queries
landSchema.index({ status: 1, featured: -1, createdAt: -1 });
// Location filters
landSchema.index({ city: 1, state: 1 });
// Range filters
landSchema.index({ price: 1 });
landSchema.index({ areaValue: 1 });
// Free-text search box
landSchema.index({ title: 'text', description: 'text', city: 'text' });
// Nearby-sold / location analytics queries (Land Market Analytics feature)
landSchema.index({ location: '2dsphere' });

// Keeps the GeoJSON `location` field in sync whenever latitude/longitude
// are set or changed, so callers only ever need to think about lat/lng —
// the geospatial-query shape is an internal implementation detail.
landSchema.pre('save', function syncGeoLocation(next) {
  if (this.isModified('latitude') || this.isModified('longitude')) {
    if (typeof this.latitude === 'number' && typeof this.longitude === 'number') {
      this.location = { type: 'Point', coordinates: [this.longitude, this.latitude] };
    } else {
      this.location = undefined;
    }
  }
  next();
});

export const Land = mongoose.model('Land', landSchema);
