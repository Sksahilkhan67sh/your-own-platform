import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLandSchema, publicLandQuerySchema, presignImagesSchema } from '../../src/validators/landValidators.js';
import { loginSchema } from '../../src/validators/authValidators.js';

test('createLandSchema accepts a valid, complete payload', () => {
  const result = createLandSchema.safeParse({
    body: {
      title: 'Test Plot',
      description: 'A reasonably long description of the plot for sale.',
      price: 1000000,
      areaValue: 1200,
      areaUnit: 'sqft',
      address: '123 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  });
  assert.equal(result.success, true);
});

test('createLandSchema rejects a negative price', () => {
  const result = createLandSchema.safeParse({
    body: {
      title: 'Test Plot',
      description: 'A reasonably long description of the plot for sale.',
      price: -500,
      areaValue: 1200,
      areaUnit: 'sqft',
      address: '123 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  });
  assert.equal(result.success, false);
});

test('createLandSchema rejects an invalid areaUnit not in the shared enum', () => {
  const result = createLandSchema.safeParse({
    body: {
      title: 'Test Plot',
      description: 'A reasonably long description of the plot for sale.',
      price: 1000,
      areaValue: 10,
      areaUnit: 'square-furlongs', // not a real unit
      address: '123 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  });
  assert.equal(result.success, false);
});

test('createLandSchema rejects a whatsappNumberOverride containing non-digit characters', () => {
  const result = createLandSchema.safeParse({
    body: {
      title: 'Test Plot',
      description: 'A reasonably long description of the plot for sale.',
      price: 1000,
      areaValue: 10,
      areaUnit: 'sqft',
      address: '123 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      whatsappNumberOverride: '+91 98765-43210', // symbols not allowed — must be E.164 digits only
    },
  });
  assert.equal(result.success, false);
});

test('createLandSchema rejects more than 20 highlights', () => {
  const result = createLandSchema.safeParse({
    body: {
      title: 'Test Plot',
      description: 'A reasonably long description of the plot for sale.',
      price: 1000,
      areaValue: 10,
      areaUnit: 'sqft',
      address: '123 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      highlights: Array.from({ length: 21 }, (_, i) => `Highlight ${i}`),
    },
  });
  assert.equal(result.success, false);
});

test('publicLandQuerySchema applies default page=1 and limit=12 when omitted', () => {
  const result = publicLandQuerySchema.safeParse({ query: {} });
  assert.equal(result.success, true);
  assert.equal(result.data.query.page, 1);
  assert.equal(result.data.query.limit, 12);
});

test('publicLandQuerySchema rejects a limit above the 48 cap (prevents unrestricted resource consumption)', () => {
  const result = publicLandQuerySchema.safeParse({ query: { limit: '500' } });
  assert.equal(result.success, false);
});

test('publicLandQuerySchema coerces string query params to numbers', () => {
  const result = publicLandQuerySchema.safeParse({ query: { minPrice: '100000', page: '2' } });
  assert.equal(result.success, true);
  assert.equal(result.data.query.minPrice, 100000);
  assert.equal(typeof result.data.query.minPrice, 'number');
});

test('presignImagesSchema rejects more than 10 files in a single request', () => {
  const files = Array.from({ length: 11 }, (_, i) => ({
    fileName: `photo-${i}.jpg`,
    contentType: 'image/jpeg',
    fileSizeBytes: 1000,
  }));
  const result = presignImagesSchema.safeParse({ params: { id: 'abc' }, body: { files } });
  assert.equal(result.success, false);
});

test('presignImagesSchema rejects a disallowed content type', () => {
  const result = presignImagesSchema.safeParse({
    params: { id: 'abc' },
    body: { files: [{ fileName: 'a.gif', contentType: 'image/gif', fileSizeBytes: 1000 }] },
  });
  assert.equal(result.success, false);
});

test('presignImagesSchema rejects a file exceeding the 8MB size limit', () => {
  const result = presignImagesSchema.safeParse({
    params: { id: 'abc' },
    body: {
      files: [{ fileName: 'big.jpg', contentType: 'image/jpeg', fileSizeBytes: 9 * 1024 * 1024 }],
    },
  });
  assert.equal(result.success, false);
});

test('loginSchema lowercases and trims email', () => {
  const result = loginSchema.safeParse({
    body: { email: '  Admin@Test.COM  ', password: 'whatever' },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.email, 'admin@test.com');
});

test('loginSchema rejects a malformed email', () => {
  const result = loginSchema.safeParse({ body: { email: 'not-an-email', password: 'x' } });
  assert.equal(result.success, false);
});
