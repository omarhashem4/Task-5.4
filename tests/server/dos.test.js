import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server/src/app.js';

let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CSRF_SECRET = 'test-csrf-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Maintenance requests — DoS / rate limiting', () => {
  test('allows maintenance reads up to the limit, then responds with 429', async () => {
    const first = await request(app).get('/api/maintenance').expect(200);
    expect(Array.isArray(first.body.requests)).toBe(true);

    const statuses = [first.status];
    for (let i = 1; i < 61; i++) {
      const res = await request(app).get('/api/maintenance');
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 60)).toEqual(Array(60).fill(200));
    expect(statuses[60]).toBe(429);
  });
});
