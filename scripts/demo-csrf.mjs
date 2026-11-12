import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server/src/app.js';
import { MaintenanceRequest } from '../server/src/models/MaintenanceRequest.js';

const secret = 'local-demo-only';
process.env.JWT_SECRET = secret;

let writes = 0;
MaintenanceRequest.create = async data => {
  writes += 1;
  return data;
};

const agent = request.agent(app);
const session = jwt.sign({ id: 'demo-student' }, secret, { jwtid: 'demo-session' });
const cookie = 'token=' + session;
const { body: { csrfToken } } = await agent.get('/api/auth/csrf-token')
  .set('Cookie', cookie).expect(200);
const data = { roomNumber: '42', category: 'other', description: 'Fix door' };

await agent.post('/api/maintenance').set('Cookie', cookie)
  .send(data).expect(403);
assert.equal(writes, 0);
console.log('PASS: Missing CSRF token returned 403 and no write occurred');

await agent.post('/api/maintenance').set('Cookie', cookie)
  .set('X-CSRF-Token', csrfToken).send(data).expect(201);
assert.equal(writes, 1);
console.log('PASS: Valid CSRF token returned 201 and one write occurred');
