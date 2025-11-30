const { BooltoxBackend } = require('booltox-backend');

const backend = new BooltoxBackend();

backend.method('hello', async (params) => {
  const name = params?.name ?? 'World';
  backend.emit('progress', { step: 'processing' });
  return { message: `Hello, ${name}!`, pid: process.pid };
});

backend.method('health', async () => ({ ok: true, timestamp: new Date().toISOString() }));

backend.run();
