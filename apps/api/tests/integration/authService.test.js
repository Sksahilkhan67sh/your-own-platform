import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFakeCollection } from './fakeCollection.js';

// Required env vars must exist before authService.js (via env.js) is imported.
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_ACCESS_SECRET ||= 'a'.repeat(64);
process.env.CORS_ALLOWED_ORIGINS ||= 'http://localhost:5173';
process.env.AWS_REGION ||= 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID ||= 'test';
process.env.AWS_SECRET_ACCESS_KEY ||= 'test';
process.env.S3_BUCKET_NAME ||= 'test-bucket';
process.env.S3_PUBLIC_BASE_URL ||= 'https://test-bucket.s3.amazonaws.com';
process.env.ACCOUNT_LOCK_THRESHOLD ||= '3';
process.env.ACCOUNT_LOCK_DURATION_MIN ||= '15';
process.env.JWT_REFRESH_EXPIRES_IN_DAYS ||= '30';

let authService;

const PLAIN_PASSWORD = 'CorrectPassword123!';
let passwordHash;

// node:test's mock.module() can only mock a given specifier ONCE per process
// (re-mocking throws ERR_INVALID_STATE). So instead of re-mocking per test,
// we mock User.js/RefreshToken.js a single time with collections whose
// underlying Map we clear and repopulate in beforeEach. authService.js is
// imported once, after the mocks are installed, and reused across all tests.

const fakeUsers = createFakeCollection([], {
  instanceMethods: {
    async comparePassword(candidate) {
      return bcrypt.compare(candidate, this.passwordHash);
    },
    isLocked() {
      return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
    },
  },
});

const fakeRefreshTokens = createFakeCollection([]);

mock.module('../../src/models/User.js', {
  namedExports: { User: fakeUsers },
});
mock.module('../../src/models/RefreshToken.js', {
  namedExports: { RefreshToken: fakeRefreshTokens },
});

before(async () => {
  passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
  authService = await import('../../src/services/authService.js');
});

beforeEach(async () => {
  fakeUsers._docs.clear();
  fakeRefreshTokens._docs.clear();

  await fakeUsers.create({
    _id: 'user-1',
    name: 'Test Admin',
    email: 'admin@test.com',
    passwordHash,
    role: 'admin',
    isActive: true,
    failedLoginAttempts: 0,
  });
});

test('login succeeds with correct credentials and issues access + refresh tokens', async () => {
  const result = await authService.login({
    email: 'admin@test.com',
    password: PLAIN_PASSWORD,
    userAgent: 'test-agent',
    ip: '127.0.0.1',
  });

  assert.ok(result.accessToken, 'access token should be issued');
  assert.ok(result.refreshToken, 'refresh token should be issued');
  assert.equal(result.user.email, 'admin@test.com');

  const storedTokens = [...fakeRefreshTokens._docs.values()];
  assert.equal(storedTokens.length, 1, 'exactly one refresh token record should be stored');
  assert.notEqual(storedTokens[0].tokenHash, result.refreshToken, 'raw token must never be stored, only its hash');
});

test('login fails with wrong password and increments failedLoginAttempts', async () => {
  await assert.rejects(
    () =>
      authService.login({
        email: 'admin@test.com',
        password: 'WrongPassword!',
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      }),
    /Invalid email or password/
  );

  const user = await fakeUsers.findById('user-1');
  assert.equal(user.failedLoginAttempts, 1);
});

test('login fails identically for non-existent email (no user enumeration)', async () => {
  let errorForMissingUser;
  let errorForWrongPassword;

  try {
    await authService.login({ email: 'nobody@test.com', password: 'whatever', ip: '1', userAgent: 'a' });
  } catch (e) {
    errorForMissingUser = e.message;
  }

  try {
    await authService.login({ email: 'admin@test.com', password: 'WrongPassword!', ip: '1', userAgent: 'a' });
  } catch (e) {
    errorForWrongPassword = e.message;
  }

  assert.equal(errorForMissingUser, errorForWrongPassword, 'error messages must be identical to prevent enumeration');
});

test('account locks after ACCOUNT_LOCK_THRESHOLD failed attempts, then rejects even correct password', async () => {
  for (let i = 0; i < 3; i += 1) {
    await assert.rejects(() =>
      authService.login({ email: 'admin@test.com', password: 'wrong', ip: '1', userAgent: 'a' })
    );
  }

  // Account should now be locked — even the CORRECT password must be rejected.
  await assert.rejects(
    () =>
      authService.login({
        email: 'admin@test.com',
        password: PLAIN_PASSWORD,
        ip: '1',
        userAgent: 'a',
      }),
    /locked/i
  );
});

test('refreshSession rotates the token: old hash is revoked, new hash is issued', async () => {
  const loginResult = await authService.login({
    email: 'admin@test.com',
    password: PLAIN_PASSWORD,
    ip: '1',
    userAgent: 'a',
  });

  const refreshResult = await authService.refreshSession({
    refreshToken: loginResult.refreshToken,
    ip: '1',
    userAgent: 'a',
  });

  assert.ok(refreshResult.accessToken);
  assert.notEqual(refreshResult.refreshToken, loginResult.refreshToken, 'a NEW refresh token must be issued');

  const allTokens = [...fakeRefreshTokens._docs.values()];
  assert.equal(allTokens.length, 2, 'old + new token records should both exist');

  const oldRecord = allTokens.find((t) => t._id === 'fake-id-1') || allTokens[0];
  assert.ok(oldRecord.revokedAt, 'the original token must be marked revoked after rotation');
});

test('CRITICAL: reusing an already-rotated (revoked) refresh token revokes the entire family and is rejected', async () => {
  const loginResult = await authService.login({
    email: 'admin@test.com',
    password: PLAIN_PASSWORD,
    ip: '1',
    userAgent: 'a',
  });

  // Legitimate rotation happens once.
  const firstRefresh = await authService.refreshSession({
    refreshToken: loginResult.refreshToken,
    ip: '1',
    userAgent: 'a',
  });

  // Attacker (or a buggy client) replays the ORIGINAL token, which is now revoked.
  await assert.rejects(
    () =>
      authService.refreshSession({
        refreshToken: loginResult.refreshToken, // the old, already-used token
        ip: 'attacker-ip',
        userAgent: 'attacker-agent',
      }),
    /Session invalid/i
  );

  // The legitimate, newly-rotated token must ALSO now be dead — this is the
  // theft-detection guarantee: reuse kills the whole family, not just the
  // reused token, because we can no longer trust which party is legitimate.
  await assert.rejects(
    () =>
      authService.refreshSession({
        refreshToken: firstRefresh.refreshToken,
        ip: '1',
        userAgent: 'a',
      }),
    /Session invalid|Invalid refresh token/i
  );
});

test('refreshSession rejects an unknown/garbage token', async () => {
  await assert.rejects(
    () => authService.refreshSession({ refreshToken: 'not-a-real-token', ip: '1', userAgent: 'a' }),
    /Invalid refresh token/
  );
});

test('logout revokes the active token family so it cannot be refreshed afterward', async () => {
  const loginResult = await authService.login({
    email: 'admin@test.com',
    password: PLAIN_PASSWORD,
    ip: '1',
    userAgent: 'a',
  });

  await authService.logout({ refreshToken: loginResult.refreshToken });

  await assert.rejects(() =>
    authService.refreshSession({ refreshToken: loginResult.refreshToken, ip: '1', userAgent: 'a' })
  );
});

test('login rejects a deactivated account even with correct password', async () => {
  await fakeUsers.updateMany({ _id: 'user-1' }, { $set: { isActive: false } });

  await assert.rejects(
    () =>
      authService.login({
        email: 'admin@test.com',
        password: PLAIN_PASSWORD,
        ip: '1',
        userAgent: 'a',
      }),
    /deactivated/i
  );
});
