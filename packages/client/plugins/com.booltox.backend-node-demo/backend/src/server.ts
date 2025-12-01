import path from 'path';
import { Worker } from 'worker_threads';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';
import { BooltoxBackend } from 'booltox-backend';

const backend = new BooltoxBackend();

const WORKER_TIMEOUT_MS = 800;
const MAX_TEXT_LENGTH = 120_000;
const MAX_MATCHES = 500;
const MAX_PREVIEW_LENGTH = 5_000;
const workerPath = path.join(__dirname, 'regex-worker.cjs');

type RegexTask = 'validate' | 'test' | 'replace';

type ValidatePayload = {
  pattern: string;
  flags: string;
};

type TestPayload = {
  pattern: string;
  flags: string;
  text: string;
  maxMatches: number;
};

type ReplacePayload = {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  maxPreviewLength: number;
};

type RegexTaskPayload = ValidatePayload | TestPayload | ReplacePayload;

type WorkerResult = {
  type: 'result';
  result: any;
} | {
  type: 'error';
  error?: string;
} | {
  type: 'progress';
  data: {
    processed: number;
    total: number;
    percent: number;
    batch: number;
    complete?: boolean;
  };
};

interface PatternTemplate {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  description: string;
  sample?: string;
}

const PATTERN_LIBRARY: PatternTemplate[] = [
  {
    id: 'email',
    label: '邮箱地址',
    pattern: '\\b[\\w.+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    flags: 'i',
    description: '匹配文本中的常见邮箱地址，自动忽略大小写。',
    sample: '联系邮箱: support@example.com'
  },
  {
    id: 'url',
    label: 'URL',
    pattern: '\\bhttps?:\\/\\/[^\\s/$.?#].[^\\s]*\\b',
    flags: 'i',
    description: '捕获文中的 HTTP/HTTPS 链接，允许路径/参数。',
    sample: '项目主页: https://booltox.dev/docs?lang=zh'
  },
  {
    id: 'mobile',
    label: '中国大陆手机号',
    pattern: '\\b(?:\\+?86)?1[3-9]\\d{9}\\b',
    flags: '',
    description: '兼容本地或 +86 前缀的 11 位手机号。',
    sample: '紧急联系人：+8613812345678'
  },
  {
    id: 'ipv4',
    label: 'IPv4 地址',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: '',
    description: '识别文本中的 IPv4 地址，限制 0-255。',
    sample: '服务器: 10.12.0.5/24'
  },
  {
    id: 'date',
    label: '日期 (YYYY-MM-DD)',
    pattern: '\\b(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
    flags: '',
    description: '匹配 1900-2099 年范围内的标准日期。',
    sample: '计划日期：2025-12-01'
  },
  {
    id: 'cn',
    label: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: '',
    description: '检测文本中的连续中文字符，可用于姓名/标签等。',
    sample: '项目代号：星火计划'
  }
];

function createRequestId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function assertPattern(pattern: unknown) {
  if (typeof pattern !== 'string' || !pattern.trim()) {
    throw new Error('[ERR_INVALID_PATTERN] 正则表达式不能为空');
  }
  if (pattern.length > 800) {
    throw new Error('[ERR_PATTERN_TOO_LONG] 正则长度超过 800 个字符');
  }
  return pattern;
}

function normalizeText(input: unknown = '') {
  const text = typeof input === 'string' ? input : String(input ?? '');
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`[ERR_TEXT_TOO_LONG] 待测文本超过 ${MAX_TEXT_LENGTH} 字符限制`);
  }
  return text;
}

function safeFlags(flags: unknown = '') {
  return typeof flags === 'string' ? flags : String(flags ?? '');
}

function runRegexTask(task: RegexTask, payload: RegexTaskPayload, { timeout = WORKER_TIMEOUT_MS, requestId }: { timeout?: number; requestId?: string } = {}) {
  return new Promise<any>((resolve, reject) => {
    const worker = new Worker(workerPath);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(new Error('[ERR_TIMEOUT] 正则执行超时，请优化表达式或缩短文本'));
    }, timeout);

    worker.on('message', (message: WorkerResult) => {
      if (message?.type === 'progress' && requestId) {
        backend.emit('matchProgress', { requestId, task, ...message.data });
      }
      if (settled || !message) {
        return;
      }
      if (message.type === 'result') {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve(message.result);
        return;
      }
      if (message.type === 'error') {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        reject(new Error(message.error || '正则执行失败'));
      }
    });

    worker.once('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      reject(err);
    });

    worker.postMessage({ task, payload: { ...payload, requestId } });
  });
}

backend.method('getPatterns', async () => ({
  items: PATTERN_LIBRARY,
  timestamp: new Date().toISOString()
}));

backend.method('validate', async (params: Partial<ValidatePayload> = {}) => {
  const pattern = assertPattern(params.pattern);
  const flags = safeFlags(params.flags);
  const started = performance.now();
  const result = await runRegexTask('validate', { pattern, flags });
  return {
    ...result,
    tookMs: Number((performance.now() - started).toFixed(2))
  };
});

backend.method('test', async (params: Partial<TestPayload> = {}) => {
  const pattern = assertPattern(params.pattern);
  const flags = safeFlags(params.flags);
  const text = normalizeText(params.text || '');
  const requestId = createRequestId('test');
  const started = performance.now();
  const result = await runRegexTask('test', {
    pattern,
    flags,
    text,
    maxMatches: MAX_MATCHES
  }, { requestId });
  return {
    requestId,
    ...result,
    tookMs: Number((performance.now() - started).toFixed(2)),
    limits: {
      maxTextLength: MAX_TEXT_LENGTH,
      maxMatches: MAX_MATCHES
    }
  };
});

backend.method('replace', async (params: Partial<ReplacePayload> = {}) => {
  const pattern = assertPattern(params.pattern);
  const flags = safeFlags(params.flags);
  const text = normalizeText(params.text || '');
  const replacement = typeof params.replacement === 'string' ? params.replacement : String(params.replacement ?? '');
  const requestId = createRequestId('replace');
  const started = performance.now();
  const result = await runRegexTask('replace', {
    pattern,
    flags,
    text,
    replacement,
    maxPreviewLength: MAX_PREVIEW_LENGTH
  }, { requestId });
  return {
    requestId,
    ...result,
    tookMs: Number((performance.now() - started).toFixed(2)),
    limits: {
      maxTextLength: MAX_TEXT_LENGTH,
      maxPreviewLength: MAX_PREVIEW_LENGTH
    }
  };
});

backend.run();
