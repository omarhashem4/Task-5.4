import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server/src/app.js';
import { MaintenanceRequest } from '../server/src/models/MaintenanceRequest.js';

let reads = 0;
MaintenanceRequest.find = () => ({
  populate: () => ({
    sort: () => ({
      lean: async () => {
        reads += 1;
        return [];
      }
    })
  })
});

const client = request(app);
for (let count = 0; count < 60; count += 1) {
  await client.get('/api/maintenance').expect(200);
}

const response = await client.get('/api/maintenance').expect(429);
assert.equal(reads, 60);
assert.ok(Number(response.headers['retry-after']) > 0);
console.log('PASS: 60 reads succeeded. Request 61 returned 429 and skipped the database.');
