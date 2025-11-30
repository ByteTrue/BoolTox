const readline = require('readline');

class BooltoxBackend {
  constructor() {
    this.methods = new Map();
    this.running = false;
    this.rl = null;
    this.pluginId = process.env.BOOLTOX_PLUGIN_ID || 'unknown';
    this.method('$ping', async () => ({ pong: true }));
  }

  method(name, handler) {
    this.methods.set(name, handler);
    return this;
  }

  emit(event, data) {
    this.#write({ jsonrpc: '2.0', method: '$event', params: { event, data } });
  }

  log(level, message) {
    this.#write({ jsonrpc: '2.0', method: '$log', params: { level, message, timestamp: new Date().toISOString() } });
  }

  debug(msg) { this.log('debug', msg); }
  info(msg) { this.log('info', msg); }
  warn(msg) { this.log('warn', msg); }
  error(msg) { this.log('error', msg); }

  run() {
    this.running = true;
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    this.#sendReady();
    this.rl.on('line', (line) => this.#processLine(line.trim()));
    this.rl.on('close', () => process.exit(0));
    this.rl.on('error', (err) => {
      this.error(`Readline error: ${err.message}`);
      process.exit(1);
    });
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  async #processLine(line) {
    if (!line) return;
    let req;
    try {
      req = JSON.parse(line);
    } catch (e) {
      this.#write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      this.#write({ jsonrpc: '2.0', id: req?.id ?? null, error: { code: -32600, message: 'Invalid request' } });
      return;
    }
    await this.#handleRequest(req);
  }

  async #handleRequest(req) {
    const { id, method, params } = req;
    const handler = this.methods.get(method);
    if (!handler) {
      if (id !== undefined) {
        this.#write({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
      return;
    }
    try {
      const result = await handler(params);
      if (id !== undefined) {
        this.#write({ jsonrpc: '2.0', id, result });
      }
    } catch (err) {
      if (id !== undefined) {
        this.#write({ jsonrpc: '2.0', id, error: { code: -32603, message: err?.message || String(err) } });
      }
    }
  }

  #sendReady() {
    const methods = Array.from(this.methods.keys()).filter((name) => !name.startsWith('$'));
    this.#write({ jsonrpc: '2.0', method: '$ready', params: { version: '1.0.0', methods } });
  }

  #write(message) {
    try {
      process.stdout.write(JSON.stringify(message) + '\n');
    } catch (e) {
      process.stderr.write(`Failed to write message: ${e}\n`);
    }
  }
}

module.exports = { BooltoxBackend };
module.exports.default = BooltoxBackend;
