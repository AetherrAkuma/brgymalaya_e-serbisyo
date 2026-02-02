import { describe, it, expect } from 'vitest'; // <--- New Import
import request from 'supertest';
import app from './server.js';

describe('API Health Check', () => {
  it('GET /api/health should be active', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('active');
  });
});