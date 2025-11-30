/**
 * BoolTox Backend SDK for Node.js/TypeScript
 *
 * This SDK provides a simple way to create JSON-RPC 2.0 based backend services
 * for BoolTox plugins.
 *
 * @example
 * ```typescript
 * import { BooltoxBackend } from 'booltox-backend';
 *
 * const backend = new BooltoxBackend();
 *
 * backend.method('hello', async (params) => {
 *   return { message: `Hello, ${params.name || 'World'}!` };
 * });
 *
 * backend.method('calculate', async (params) => {
 *   backend.emit('progress', { step: 1, total: 2 });
 *   const result = (params.a || 0) + (params.b || 0);
 *   backend.emit('progress', { step: 2, total: 2 });
 *   return { result };
 * });
 *
 * backend.run();
 * ```
 */

import * as readline from 'readline';

export const VERSION = '1.0.0';

// ============================================================================
// JSON-RPC 2.0 Types
// ============================================================================

export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: TParams;
}

export interface JsonRpcSuccessResponse<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result: TResult;
}

export interface JsonRpcError<TData = unknown> {
  code: number;
  message: string;
  data?: TData;
}

export interface JsonRpcErrorResponse<TData = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  error: JsonRpcError<TData>;
}

export type JsonRpcResponse<TResult = unknown, TErrorData = unknown> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse<TErrorData>;

export interface JsonRpcNotification<TParams = unknown> {
  jsonrpc: '2.0';
  method: string;
  params?: TParams;
}

// ============================================================================
// Error Codes
// ============================================================================

export const JsonRpcErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
  TIMEOUT_ERROR: -32001,
  BACKEND_NOT_READY: -32002,
  BACKEND_CRASHED: -32003,
} as const;

// ============================================================================
// Custom Error Class
// ============================================================================

export class RpcError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }

  toJsonRpcError(): JsonRpcError {
    const error: JsonRpcError = {
      code: this.code,
      message: this.message,
    };
    if (this.data !== undefined) {
      error.data = this.data;
    }
    return error;
  }
}

// ============================================================================
// Method Handler Type
// ============================================================================

export type MethodHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => TResult | Promise<TResult>;

// ============================================================================
// BooltoxBackend Class
// ============================================================================

export class BooltoxBackend {
  private methods: Map<string, MethodHandler> = new Map();
  private running = false;
  private rl: readline.Interface | null = null;
  private pluginId: string;

  constructor() {
    this.pluginId = process.env.BOOLTOX_PLUGIN_ID || 'unknown';

    // Register built-in methods
    this.method('$ping', async () => ({ pong: true }));
  }

  /**
   * Register an RPC method handler
   *
   * @param name - Method name
   * @param handler - Async function to handle the method call
   *
   * @example
   * ```typescript
   * backend.method('greet', async (params) => {
   *   return { message: `Hello, ${params.name}!` };
   * });
   * ```
   */
  method<TParams = unknown, TResult = unknown>(
    name: string,
    handler: MethodHandler<TParams, TResult>
  ): this {
    this.methods.set(name, handler as MethodHandler);
    return this;
  }

  /**
   * Emit an event notification to the frontend
   *
   * @param event - Event name
   * @param data - Event data (optional)
   *
   * @example
   * ```typescript
   * backend.emit('progress', { step: 1, total: 10 });
   * ```
   */
  emit(event: string, data?: unknown): void {
    this.writeMessage({
      jsonrpc: '2.0',
      method: '$event',
      params: { event, data },
    });
  }

  /**
   * Send a log message to the host
   *
   * @param level - Log level
   * @param message - Log message
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    this.writeMessage({
      jsonrpc: '2.0',
      method: '$log',
      params: { level, message, timestamp: new Date().toISOString() },
    });
  }

  /** Log a debug message */
  debug(message: string): void {
    this.log('debug', message);
  }

  /** Log an info message */
  info(message: string): void {
    this.log('info', message);
  }

  /** Log a warning message */
  warn(message: string): void {
    this.log('warn', message);
  }

  /** Log an error message */
  error(message: string): void {
    this.log('error', message);
  }

  /**
   * Write a JSON message to stdout
   */
  private writeMessage(message: object): void {
    try {
      const line = JSON.stringify(message) + '\n';
      process.stdout.write(line);
    } catch (e) {
      process.stderr.write(`Failed to write message: ${e}\n`);
    }
  }

  /**
   * Send ready notification to host
   */
  private sendReady(): void {
    const methods = Array.from(this.methods.keys()).filter(
      (name) => !name.startsWith('$')
    );
    this.writeMessage({
      jsonrpc: '2.0',
      method: '$ready',
      params: {
        version: VERSION,
        methods,
      },
    });
  }

  /**
   * Create a success response
   */
  private createResponse<TResult>(
    id: string | number,
    result: TResult
  ): JsonRpcSuccessResponse<TResult> {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  /**
   * Create an error response
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): JsonRpcErrorResponse {
    const error: JsonRpcError = { code, message };
    if (data !== undefined) {
      error.data = data;
    }
    return {
      jsonrpc: '2.0',
      id,
      error,
    };
  }

  /**
   * Handle a JSON-RPC request
   */
  private async handleRequest(
    request: unknown
  ): Promise<JsonRpcResponse | null> {
    // Validate request
    if (typeof request !== 'object' || request === null) {
      return this.createErrorResponse(
        null,
        JsonRpcErrorCodes.INVALID_REQUEST,
        'Invalid request: not an object'
      );
    }

    const req = request as Record<string, unknown>;

    if (req.jsonrpc !== '2.0') {
      return this.createErrorResponse(
        (req.id as string | number) ?? null,
        JsonRpcErrorCodes.INVALID_REQUEST,
        'Invalid request: missing or invalid jsonrpc version'
      );
    }

    const method = req.method;
    if (typeof method !== 'string') {
      return this.createErrorResponse(
        (req.id as string | number) ?? null,
        JsonRpcErrorCodes.INVALID_REQUEST,
        'Invalid request: method must be a string'
      );
    }

    const requestId = req.id as string | number | undefined;
    const params = req.params ?? {};
    const isNotification = requestId === undefined;

    // Find and call the method
    const handler = this.methods.get(method);
    if (!handler) {
      if (isNotification) return null;
      return this.createErrorResponse(
        requestId!,
        JsonRpcErrorCodes.METHOD_NOT_FOUND,
        `Method not found: ${method}`
      );
    }

    try {
      const result = await handler(params);
      if (isNotification) return null;
      return this.createResponse(requestId!, result);
    } catch (e) {
      if (isNotification) return null;

      if (e instanceof RpcError) {
        return this.createErrorResponse(
          requestId!,
          e.code,
          e.message,
          e.data
        );
      }

      const error = e as Error;
      this.error(`Error in method ${method}: ${error.stack || error.message}`);
      return this.createErrorResponse(
        requestId!,
        JsonRpcErrorCodes.INTERNAL_ERROR,
        error.message,
        { stack: error.stack }
      );
    }
  }

  /**
   * Process a single line of input
   */
  private async processLine(line: string): Promise<void> {
    line = line.trim();
    if (!line) return;

    let request: unknown;
    try {
      request = JSON.parse(line);
    } catch (e) {
      const response = this.createErrorResponse(
        null,
        JsonRpcErrorCodes.PARSE_ERROR,
        `Parse error: ${e}`
      );
      this.writeMessage(response);
      return;
    }

    const response = await this.handleRequest(request);
    if (response !== null) {
      this.writeMessage(response);
    }
  }

  /**
   * Start the backend event loop
   *
   * This method blocks until stdin closes or an error occurs.
   *
   * @example
   * ```typescript
   * const backend = new BooltoxBackend();
   *
   * backend.method('hello', async () => ({ message: 'Hello!' }));
   *
   * backend.run();
   * ```
   */
  run(): void {
    this.running = true;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // Send ready notification
    this.sendReady();

    this.rl.on('line', async (line) => {
      await this.processLine(line);
    });

    this.rl.on('close', () => {
      this.running = false;
      process.exit(0);
    });

    this.rl.on('error', (err) => {
      this.error(`Readline error: ${err.message}`);
      this.running = false;
      process.exit(1);
    });

    // Handle process signals
    process.on('SIGINT', () => {
      this.stop();
    });

    process.on('SIGTERM', () => {
      this.stop();
    });
  }

  /**
   * Stop the backend event loop
   */
  stop(): void {
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }
}

/**
 * Create a new BooltoxBackend instance
 */
export function createBackend(): BooltoxBackend {
  return new BooltoxBackend();
}

// Default export
export default BooltoxBackend;
