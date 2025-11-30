/**
 * JSON-RPC 2.0 Protocol Types for BoolTox Plugin Backend Communication
 *
 * @see https://www.jsonrpc.org/specification
 */

// ============================================================================
// Core JSON-RPC 2.0 Types
// ============================================================================

/**
 * JSON-RPC 2.0 Request object
 */
export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: TParams;
}

/**
 * JSON-RPC 2.0 Response object (success)
 */
export interface JsonRpcSuccessResponse<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result: TResult;
}

/**
 * JSON-RPC 2.0 Error object
 */
export interface JsonRpcError<TData = unknown> {
  code: number;
  message: string;
  data?: TData;
}

/**
 * JSON-RPC 2.0 Response object (error)
 */
export interface JsonRpcErrorResponse<TData = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  error: JsonRpcError<TData>;
}

/**
 * JSON-RPC 2.0 Response (success or error)
 */
export type JsonRpcResponse<TResult = unknown, TErrorData = unknown> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse<TErrorData>;

/**
 * JSON-RPC 2.0 Notification (no id, no response expected)
 * Used for events and streaming data
 */
export interface JsonRpcNotification<TParams = unknown> {
  jsonrpc: '2.0';
  method: string;
  params?: TParams;
}

/**
 * Any JSON-RPC 2.0 message
 */
export type JsonRpcMessage<TParams = unknown, TResult = unknown> =
  | JsonRpcRequest<TParams>
  | JsonRpcResponse<TResult>
  | JsonRpcNotification<TParams>;

// ============================================================================
// Standard JSON-RPC 2.0 Error Codes
// ============================================================================

export const JsonRpcErrorCodes = {
  /** Invalid JSON was received by the server */
  PARSE_ERROR: -32700,
  /** The JSON sent is not a valid Request object */
  INVALID_REQUEST: -32600,
  /** The method does not exist / is not available */
  METHOD_NOT_FOUND: -32601,
  /** Invalid method parameter(s) */
  INVALID_PARAMS: -32602,
  /** Internal JSON-RPC error */
  INTERNAL_ERROR: -32603,
  // Server error range: -32000 to -32099
  /** Server error - generic */
  SERVER_ERROR: -32000,
  /** Server error - timeout */
  TIMEOUT_ERROR: -32001,
  /** Server error - backend not ready */
  BACKEND_NOT_READY: -32002,
  /** Server error - backend crashed */
  BACKEND_CRASHED: -32003,
} as const;

export type JsonRpcErrorCode =
  (typeof JsonRpcErrorCodes)[keyof typeof JsonRpcErrorCodes];

// ============================================================================
// BoolTox Backend-Specific Types
// ============================================================================

/**
 * Backend event notification params
 */
export interface BackendEventParams {
  event: string;
  data?: unknown;
}

/**
 * Backend ready notification params
 */
export interface BackendReadyParams {
  version?: string;
  methods?: string[];
}

/**
 * Backend log notification params
 */
export interface BackendLogParams {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp?: string;
}

/**
 * Reserved method names for backend lifecycle
 */
export const BackendReservedMethods = {
  /** Backend is ready to receive requests */
  READY: '$ready',
  /** Backend is shutting down */
  SHUTDOWN: '$shutdown',
  /** Backend emits an event */
  EVENT: '$event',
  /** Backend logs a message */
  LOG: '$log',
  /** Ping/pong for health check */
  PING: '$ping',
} as const;

// ============================================================================
// Helper Types for Type-Safe RPC
// ============================================================================

/**
 * Create a typed request
 */
export function createRequest<TParams>(
  id: string | number,
  method: string,
  params?: TParams
): JsonRpcRequest<TParams> {
  const request: JsonRpcRequest<TParams> = {
    jsonrpc: '2.0',
    id,
    method,
  };
  if (params !== undefined) {
    request.params = params;
  }
  return request;
}

/**
 * Create a typed success response
 */
export function createSuccessResponse<TResult>(
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
 * Create a typed error response
 */
export function createErrorResponse<TData = unknown>(
  id: string | number | null,
  code: number,
  message: string,
  data?: TData
): JsonRpcErrorResponse<TData> {
  const response: JsonRpcErrorResponse<TData> = {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
  if (data !== undefined) {
    response.error.data = data;
  }
  return response;
}

/**
 * Create a typed notification
 */
export function createNotification<TParams>(
  method: string,
  params?: TParams
): JsonRpcNotification<TParams> {
  const notification: JsonRpcNotification<TParams> = {
    jsonrpc: '2.0',
    method,
  };
  if (params !== undefined) {
    notification.params = params;
  }
  return notification;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a message is a JSON-RPC 2.0 request
 */
export function isJsonRpcRequest(msg: unknown): msg is JsonRpcRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as JsonRpcRequest).jsonrpc === '2.0' &&
    'id' in msg &&
    'method' in msg &&
    typeof (msg as JsonRpcRequest).method === 'string'
  );
}

/**
 * Check if a message is a JSON-RPC 2.0 response
 */
export function isJsonRpcResponse(msg: unknown): msg is JsonRpcResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as JsonRpcResponse).jsonrpc === '2.0' &&
    'id' in msg &&
    ('result' in msg || 'error' in msg)
  );
}

/**
 * Check if a message is a JSON-RPC 2.0 success response
 */
export function isJsonRpcSuccessResponse(
  msg: unknown
): msg is JsonRpcSuccessResponse {
  return isJsonRpcResponse(msg) && 'result' in msg;
}

/**
 * Check if a message is a JSON-RPC 2.0 error response
 */
export function isJsonRpcErrorResponse(
  msg: unknown
): msg is JsonRpcErrorResponse {
  return isJsonRpcResponse(msg) && 'error' in msg;
}

/**
 * Check if a message is a JSON-RPC 2.0 notification
 */
export function isJsonRpcNotification(
  msg: unknown
): msg is JsonRpcNotification {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as JsonRpcNotification).jsonrpc === '2.0' &&
    'method' in msg &&
    typeof (msg as JsonRpcNotification).method === 'string' &&
    !('id' in msg)
  );
}

// ============================================================================
// Enhanced Backend API Types (for preload)
// ============================================================================

/**
 * Pending request tracker
 */
export interface PendingRequest<TResult = unknown> {
  resolve: (result: TResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  method: string;
  startTime: number;
}

/**
 * Event listener type
 */
export type BackendEventListener = (data: unknown) => void;

/**
 * Enhanced Backend API with JSON-RPC support
 */
export interface JsonRpcBackendAPI {
  /**
   * Call a method on the backend and wait for response
   */
  call<TParams = unknown, TResult = unknown>(
    channelId: string,
    method: string,
    params?: TParams,
    timeoutMs?: number
  ): Promise<TResult>;

  /**
   * Send a notification to the backend (no response expected)
   */
  notify<TParams = unknown>(
    channelId: string,
    method: string,
    params?: TParams
  ): Promise<void>;

  /**
   * Subscribe to backend events
   */
  on(
    channelId: string,
    event: string,
    listener: BackendEventListener
  ): () => void;

  /**
   * Subscribe to backend events (once)
   */
  once(
    channelId: string,
    event: string,
    listener: BackendEventListener
  ): () => void;

  /**
   * Remove event listener
   */
  off(channelId: string, event: string, listener: BackendEventListener): void;

  /**
   * Register backend process (from manifest or custom)
   */
  register(
    definition?: import('./protocol').BooltoxBackendRegistration
  ): Promise<import('./protocol').BooltoxProcessHandle>;

  /**
   * Dispose backend process
   */
  dispose(channelId: string): Promise<void>;

  /**
   * Check if backend is ready
   */
  isReady(channelId: string): boolean;

  /**
   * Wait for backend to be ready
   */
  waitForReady(channelId: string, timeoutMs?: number): Promise<void>;
}
