import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_ACCESS_SECRET ||= 'b'.repeat(64);
process.env.CORS_ALLOWED_ORIGINS ||= 'http://localhost:5173';
process.env.AWS_REGION ||= 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID ||= 'test';
process.env.AWS_SECRET_ACCESS_KEY ||= 'test';
process.env.S3_BUCKET_NAME ||= 'test-bucket';
process.env.S3_PUBLIC_BASE_URL ||= 'https://test-bucket.s3.amazonaws.com';

import { mock } from 'node:test';

let app;

before(async () => {
  // Mock User.findById so requireAuth's "still active" re-check resolves
  // without a real DB connection.
  mock.module('../../src/models/User.js', {
    namedExports: {
      User: {
        async findById(id) {
          if (id === 'active-admin') {
            return { _id: 'active-admin', isActive: true, role: 'admin' };
          }
          if (id === 'inactive-admin') {
            return { _id: 'inactive-admin', isActive: false, role: 'admin' };
          }
          return null;
        },
      },
    },
  });

  const { requireAuth, requireRole } = await import('../../src/middlewares/auth.js');
  const { errorHandler } = await import('../../src/middlewares/errorHandler.js');

  app = express();
  app.use(express.json());

  app.get('/protected', requireAuth, (req, res) => res.json({ ok: true, user: req.user }));
  app.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => res.json({ ok: true }));
  app.get('/editor-only', requireAuth, requireRole('editor'), (req, res) => res.json({ ok: true }));

  app.use(errorHandler);
});

function signToken(sub, role = 'admin', secret = process.env.JWT_ACCESS_SECRET, expiresIn = '15m') {
  return jwt.sign({ sub, role }, secret, { expiresIn });
}

test('requireAuth rejects a request with no Authorization header', async () => {
  const res = await request(app).get('/protected');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('requireAuth rejects a malformed Authorization header (missing Bearer prefix)', async () => {
  const res = await request(app).get('/protected').set('Authorization', 'sometoken');
  assert.equal(res.status, 401);
});

test('requireAuth rejects an invalid/garbage token', async () => {
  const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-jwt');
  assert.equal(res.status, 401);
});

test('requireAuth rejects a token signed with the wrong secret', async () => {
  const token = signToken('active-admin', 'admin', 'wrong-secret-entirely');
  const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('requireAuth rejects an expired token', async () => {
  const token = signToken('active-admin', 'admin', process.env.JWT_ACCESS_SECRET, '-10s');
  const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('requireAuth accepts a valid token for an active user', async () => {
  const token = signToken('active-admin');
  const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, 'active-admin');
});

test('requireAuth rejects a valid token belonging to a deactivated user', async () => {
  const token = signToken('inactive-admin');
  const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('requireAuth rejects a token for a user that no longer exists', async () => {
  const token = signToken('deleted-user-id');
  const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('requireRole allows access when role matches', async () => {
  const token = signToken('active-admin', 'admin');
  const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
});

test('requireRole returns 403 (not 401) when authenticated but wrong role', async () => {
  const token = signToken('active-admin', 'admin'); // valid auth, but route requires 'editor'
  const res = await request(app).get('/editor-only').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403, 'an authenticated user with the wrong role must get 403, not 401');
});
