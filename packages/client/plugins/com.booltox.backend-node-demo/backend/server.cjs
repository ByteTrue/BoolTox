// BoolTox Node.js backend demo (JSON-RPC)
// 通过 booltox-backend SDK 暴露 RPC 方法和事件

const { BooltoxBackend } = require('booltox-backend');

const backend = new BooltoxBackend();

backend.method('getData', async (params) => {
  const id = params?.id ?? 'demo';
  backend.emit('progress', { step: 'fetching', id });
  await new Promise((resolve) => setTimeout(resolve, 300));
  backend.emit('progress', { step: 'processing', id });
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    id,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };
});

backend.method('echo', async (params) => {
  return { echo: params ?? null };
});

backend.run();
