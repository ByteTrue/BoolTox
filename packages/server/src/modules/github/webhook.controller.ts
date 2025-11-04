import crypto from 'crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { syncService } from './sync.service';
import { sendSuccess } from '../../common/response.util';
import { logger } from '../../common/logger.service';
import { env } from '../../config/env.config';
import { createError } from '../../common/error.handler';

/**
 * GitHub Webhook 事件类型
 */
interface GitHubWebhookPayload {
  action?: string;
  release?: {
    tag_name: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
  };
}

/**
 * 验证 GitHub Webhook 签名
 */
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature) {
    return false;
  }

  // GitHub 使用 sha256 签名
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  // 使用时间安全的比较函数
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * 注册 GitHub Webhook 路由
 */
export async function registerGitHubWebhookRoutes(app: FastifyInstance) {
  /**
   * POST /api/webhooks/github
   * 接收 GitHub Webhook 通知
   */
  app.post(
    '/github',
    {
      config: {
        // 禁用速率限制，因为 GitHub 可能会快速发送多个 webhook
        rateLimit: false,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 验证 Webhook 签名
      const signature = request.headers['x-hub-signature-256'] as string;
      const event = request.headers['x-github-event'] as string;
      
      // 如果配置了 GitHub Token，则需要验证签名
      if (env.GITHUB_TOKEN) {
        const payload = JSON.stringify(request.body);
        
        if (!verifyGitHubSignature(payload, signature, env.GITHUB_TOKEN)) {
          logger.warn({ event }, 'Invalid GitHub webhook signature');
          throw createError.unauthorized('Invalid webhook signature');
        }
      } else {
        logger.warn('GitHub webhook received but GITHUB_TOKEN not configured - skipping signature verification');
      }

      logger.info({ event }, 'Received GitHub webhook');

      // 只处理 release 事件
      if (event !== 'release') {
        logger.debug({ event }, 'Ignoring non-release webhook event');
        return sendSuccess(reply, { message: 'Event ignored' });
      }

      const body = request.body as GitHubWebhookPayload;

      // 只处理 published 和 edited 动作
      if (body.action !== 'published' && body.action !== 'edited') {
        logger.debug({ action: body.action }, 'Ignoring non-published/edited release event');
        return sendSuccess(reply, { message: 'Action ignored' });
      }

      // 跳过草稿版本
      if (body.release?.draft) {
        logger.debug({ tag: body.release.tag_name }, 'Ignoring draft release');
        return sendSuccess(reply, { message: 'Draft release ignored' });
      }

      // 异步同步 Release（不阻塞 webhook 响应）
      if (body.release?.tag_name) {
        const tag = body.release.tag_name;
        
        // 立即返回响应
        reply.send({
          success: true,
          data: {
            message: 'Release sync queued',
            tag,
          },
        });

        // 在后台同步
        syncService.syncReleaseByTag(tag).catch((error) => {
          logger.error({ error, tag }, 'Failed to sync release from webhook');
        });
      } else {
        return sendSuccess(reply, { message: 'No release tag found' });
      }
    }
  );

  /**
   * GET /api/webhooks/github/ping
   * 测试 Webhook 连接
   */
  app.get('/github/ping', async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      message: 'GitHub webhook endpoint is ready',
      timestamp: new Date().toISOString(),
    });
  });
}