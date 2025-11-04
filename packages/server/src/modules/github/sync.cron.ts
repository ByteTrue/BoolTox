import cron from 'node-cron';
import { syncService } from './sync.service';
import { logger } from '../../common/logger.service';

/**
 * 定时同步任务
 */
export class SyncCronService {
  private task: cron.ScheduledTask | null = null;

  /**
   * 启动定时同步任务
   * 每小时检查一次新 Release
   */
  start() {
    if (this.task) {
      logger.warn('Sync cron task is already running');
      return;
    }

    // 每小时的第 0 分钟执行
    // Cron 表达式: 分 时 日 月 周
    // '0 * * * *' = 每小时的第 0 分钟
    this.task = cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled GitHub release sync');
      
      try {
        await syncService.syncLatestRelease();
        logger.info('Scheduled GitHub release sync completed successfully');
      } catch (error) {
        logger.error({ error }, 'Scheduled GitHub release sync failed');
      }
    });

    logger.info('GitHub release sync cron task started (runs every hour)');
  }

  /**
   * 停止定时同步任务
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('GitHub release sync cron task stopped');
    }
  }

  /**
   * 立即执行一次同步（用于测试）
   */
  async runNow() {
    logger.info('Running manual GitHub release sync');
    
    try {
      await syncService.syncLatestRelease();
      logger.info('Manual GitHub release sync completed successfully');
    } catch (error) {
      logger.error({ error }, 'Manual GitHub release sync failed');
      throw error;
    }
  }
}

// 导出单例
export const syncCronService = new SyncCronService();