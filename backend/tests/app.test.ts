import request from 'supertest';
import app from '../src/app';

describe('Backend app', () => {
  it('GET / returns ok json', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('app');
  });
});
