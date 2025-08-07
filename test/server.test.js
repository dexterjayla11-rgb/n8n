import test from 'node:test';
import assert from 'node:assert';
import { createServer } from '../server.js';

test('create client, task, and collect ad analytics', async (t) => {
  const server = createServer().listen(0);
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}`;

  // Create client
  let res = await fetch(base + '/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Acme Corp' })
  });
  assert.equal(res.status, 201);
  const client = await res.json();
  assert.equal(client.name, 'Acme Corp');

  // Create task for client
  res = await fetch(`${base}/clients/${client.id}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Launch campaign' })
  });
  assert.equal(res.status, 201);
  const task = await res.json();
  assert.equal(task.status, 'todo');

  // Add ad metrics
  res = await fetch(base + '/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: client.id, impressions: 1000, clicks: 50 })
  });
  assert.equal(res.status, 201);

  // Get analytics
  res = await fetch(base + '/analytics/ads');
  assert.equal(res.status, 200);
  const analytics = await res.json();
  assert.deepStrictEqual(analytics[client.id], { impressions: 1000, clicks: 50 });
});
