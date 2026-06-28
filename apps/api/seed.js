import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { logger } from './src/config/logger.js';
import { User } from './src/models/User.js';
import { Settings } from './src/models/Settings.js';
import { Land } from './src/models/Land.js';
import { LandImage } from './src/models/LandImage.js';
import { slugify } from '@your-own/shared';

const SAMPLE_LANDS = [
  {
    title: '2 Acre Riverside Farmland — Mysuru Road',
    description:
      'A quiet, well-irrigated 2-acre plot bordering a seasonal stream, twenty minutes off Mysuru Road. ' +
      'Clear title, fenced on three sides, with an existing borewell and easy tractor access from the main road. ' +
      'Suited for a farmhouse, orchard, or long-term land banking.',
    price: 8500000,
    areaValue: 2,
    areaUnit: 'acre',
    address: 'Survey No. 142, Off Mysuru Road',
    city: 'Mysuru',
    state: 'Karnataka',
    postalCode: '570001',
    latitude: 12.2958,
    longitude: 76.6394,
    status: 'available',
    featured: true,
    highlights: ['Borewell on site', 'Clear & marketable title', 'Fenced on three sides'],
    amenities: ['Borewell', 'Road access', 'Electricity nearby'],
  },
  {
    title: 'Residential Plot — Whitefield Extension',
    description:
      'A 2,400 sq. ft. BMRDA-approved residential plot in a developing layout near Whitefield, with tar road access ' +
      'and underground drainage already laid. Ten minutes from the upcoming metro extension.',
    price: 6200000,
    areaValue: 2400,
    areaUnit: 'sqft',
    address: 'Plot 18, Greenfield Layout, Whitefield Extension',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
    latitude: 12.9698,
    longitude: 77.7499,
    status: 'available',
    featured: true,
    highlights: ['BMRDA approved', 'Tar road access', 'Underground drainage laid'],
    amenities: ['Drainage', 'Street lighting', 'Gated layout'],
  },
  {
    title: 'Commercial Corner Plot — NH 48 Frontage',
    description:
      'A rare 6,000 sq. ft. corner plot with direct frontage on NH 48, suited for a fuel station, showroom, or ' +
      'warehousing use. High visibility, high daily traffic count, conversion-ready for commercial use.',
    price: 21000000,
    areaValue: 6000,
    areaUnit: 'sqft',
    address: 'NH 48 Service Road, near Toll Plaza',
    city: 'Tumakuru',
    state: 'Karnataka',
    postalCode: '572101',
    latitude: 13.3392,
    longitude: 77.1006,
    status: 'pending',
    featured: false,
    highlights: ['Highway frontage', 'High traffic visibility', 'Commercial conversion ready'],
    amenities: ['Highway access', 'Electricity', 'Water connection'],
  },
  {
    title: '1 Acre Orchard Plot — Kanakapura Road',
    description:
      'An established mango and coconut orchard plot, fully fruiting, with drip irrigation already installed. ' +
      'Income-generating from year one. Forty-five minutes from Bengaluru city limits.',
    price: 11000000,
    areaValue: 1,
    areaUnit: 'acre',
    address: 'Doddamaralavadi Village, Kanakapura Road',
    city: 'Bengaluru Rural',
    state: 'Karnataka',
    postalCode: '562112',
    latitude: 12.6814,
    longitude: 77.3933,
    status: 'available',
    featured: false,
    highlights: ['Fruiting orchard', 'Drip irrigation installed', 'Income from year one'],
    amenities: ['Drip irrigation', 'Borewell', 'Farmhouse foundation laid'],
  },
  {
    title: 'Sold — 5400 sq. ft. Plot, Hennur Road',
    description:
      'A well-located residential plot near Hennur Road, sold to a verified buyer through YOUR OWN in under three weeks.',
    price: 9800000,
    areaValue: 5400,
    areaUnit: 'sqft',
    address: 'Plot 7, Lakeview Layout, Hennur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560077',
    latitude: 13.0359,
    longitude: 77.6431,
    status: 'sold',
    featured: false,
    highlights: ['Lake-facing', 'Gated layout'],
    amenities: ['Drainage', 'Street lighting'],
  },
];

async function seed() {
  await connectDB();
  logger.info('Seeding database...');

  // ---- Admin user ----
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env to seed an admin user.');
  }

  let admin = await User.findOne({ email: env.SEED_ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    const passwordHash = await User.hashPassword(env.SEED_ADMIN_PASSWORD);
    admin = await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'admin',
    });
    logger.info(`Created admin user: ${admin.email}`);
  } else {
    logger.info(`Admin user already exists: ${admin.email}`);
  }

  // ---- Settings singleton ----
  const existingSettings = await Settings.findById('singleton');
  if (!existingSettings) {
    await Settings.create({
      _id: 'singleton',
      siteName: 'YOUR OWN',
      defaultWhatsappNumber: '919876543210', // placeholder — update via admin settings
      contactEmail: env.SEED_ADMIN_EMAIL.toLowerCase(),
      heroHeadline: 'Land worth owning.',
      heroSubheadline: 'Carefully verified plots, presented honestly, sold directly.',
    });
    logger.info('Created Settings singleton (update WhatsApp number via /admin/settings)');
  } else {
    logger.info('Settings singleton already exists');
  }

  // ---- Sample lands ----
  const existingLandCount = await Land.countDocuments();
  if (existingLandCount === 0) {
    for (const sample of SAMPLE_LANDS) {
      const slug = slugify(sample.title);
      const land = await Land.create({
        ...sample,
        slug,
        createdBy: admin._id,
        publishedAt: new Date(),
      });

      // Attach one placeholder image reference per listing so the gallery UI
      // has something real to render in Phase 3 without needing an actual
      // S3 upload during local seeding. Replace via admin panel for real listings.
      await LandImage.create({
        land: land._id,
        imageUrl: `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80`,
        storageKey: `seed/${land._id}/placeholder.jpg`,
        altText: `${land.title} — placeholder image`,
        sortOrder: 0,
      });

      logger.info(`Created sample land: ${land.title} (${land.slug})`);
    }
  } else {
    logger.info(`Lands collection already has ${existingLandCount} documents — skipping sample data`);
  }

  logger.info('Seeding complete.');
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});
