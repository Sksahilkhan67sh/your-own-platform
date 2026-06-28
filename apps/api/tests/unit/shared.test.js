import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppLink, normalizePhoneForWhatsApp } from '@your-own/shared';
import { slugify, withUniqueSuffix } from '@your-own/shared';

test('buildWhatsAppLink produces a valid wa.me URL with correctly encoded message', () => {
  const link = buildWhatsAppLink({
    phone: '919876543210',
    title: '2 Acre Farmland',
    slug: '2-acre-farmland',
    location: 'Mysuru',
    price: 1000000,
  });

  assert.match(link, /^https:\/\/wa\.me\/919876543210\?text=/);

  const decoded = decodeURIComponent(link.split('?text=')[1]);
  assert.match(decoded, /2 Acre Farmland/);
  assert.match(decoded, /2-acre-farmland/);
  assert.match(decoded, /Mysuru/);
  assert.match(decoded, /YOUR OWN/);
});

test('buildWhatsAppLink rejects a phone number with non-digit characters', () => {
  assert.throws(() =>
    buildWhatsAppLink({
      phone: '+91 98765 43210', // not normalized — must be digits only
      title: 'X',
      slug: 'x',
      location: 'Y',
      price: 1,
    })
  );
});

test('buildWhatsAppLink rejects a missing required field', () => {
  assert.throws(() =>
    buildWhatsAppLink({ phone: '919876543210', title: '', slug: 'x', location: 'Y', price: 1 })
  );
});

test('buildWhatsAppLink never leaves raw quote characters unescaped in a way that breaks the URL', () => {
  const link = buildWhatsAppLink({
    phone: '919876543210',
    title: 'Plot with "great" views',
    slug: 'plot-great-views',
    location: 'Pune',
    price: 500000,
  });
  // The raw quote character must not appear unescaped in the URL itself.
  assert.ok(!link.includes('"'));
});

test('normalizePhoneForWhatsApp strips all non-digit characters', () => {
  assert.equal(normalizePhoneForWhatsApp('+91 98765-43210'), '919876543210');
  assert.equal(normalizePhoneForWhatsApp('(987) 654-3210'), '9876543210');
});

test('slugify converts spaces and punctuation into a clean, lowercase, hyphenated slug', () => {
  assert.equal(slugify('2 Acre Farmland — Riverside View!!'), '2-acre-farmland-riverside-view');
  assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
});

test('slugify throws on empty input', () => {
  assert.throws(() => slugify(''));
  assert.throws(() => slugify('   '));
});

test('withUniqueSuffix appends a suffix distinct from the base slug', () => {
  const base = slugify('Test Plot');
  const withSuffix = withUniqueSuffix(base);
  assert.notEqual(withSuffix, base);
  assert.match(withSuffix, new RegExp(`^${base}-[a-z0-9]{5}$`));
});
