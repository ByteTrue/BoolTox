/**
 * 简单的错误处理工具
 */

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function handleError(context: string, error: unknown): void {
  console.error(`[${context}]`, formatError(error));
}
