import { app, BrowserWindow, shell } from 'electron';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

export type UpdateDownloadPayload = {
  version: string;
  downloadUrl: string;
  checksum?: string | null;
  sizeBytes?: number | null;
};

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'downloading'; version: string; downloadedBytes: number; totalBytes?: number }
  | { state: 'ready'; version: string; filePath: string }
  | { state: 'error'; message: string };

export type UpdateDownloadResult = { success: true; filePath: string } | { success: false; error?: string; aborted?: boolean };
export type UpdateOperationResult = { success: boolean; error?: string };

export class UpdateManager {
  private status: UpdateStatus = { state: 'idle' };
  private controller: AbortController | null = null;
  private tempFilePath: string | null = null;
  private finalFilePath: string | null = null;

  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  getStatus(): UpdateStatus {
    return this.status;
  }

  async download(payload: UpdateDownloadPayload): Promise<UpdateDownloadResult> {
    if (this.status.state === 'downloading') {
      return { success: false, error: 'download-in-progress' };
    }

    const { version, downloadUrl, checksum, sizeBytes } = payload;

    try {
      await fs.mkdir(this.ensureDownloadDir(), { recursive: true });

      this.controller = new AbortController();

      const response = await fetch(downloadUrl, { signal: this.controller.signal });
      if (!response.ok || !response.body) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      const totalBytes = Number(response.headers.get('content-length')) || sizeBytes || undefined;

      const url = new URL(downloadUrl);
      const extension = path.extname(url.pathname) || '.bin';
      const downloadDir = this.ensureDownloadDir();
      const filename = `${version}-${Date.now()}${extension}`;
      const tempFilename = `${filename}.download`;
      this.finalFilePath = path.join(downloadDir, filename);
      this.tempFilePath = path.join(downloadDir, tempFilename);

      const responseStream = response.body as NodeReadableStream<Uint8Array>;
      const nodeStream = Readable.fromWeb(responseStream);
      const fileStream = createWriteStream(this.tempFilePath);
      const hash = checksum ? createHash('sha256') : null;
      let downloadedBytes = 0;

      this.updateStatus({ state: 'downloading', version, downloadedBytes, totalBytes });

      const progressStream = new Transform({
        transform: (chunk, _encoding, callback) => {
          downloadedBytes += chunk.length;
          if (hash) {
            hash.update(chunk as Buffer);
          }
          this.updateStatus({ state: 'downloading', version, downloadedBytes, totalBytes });
          callback(null, chunk);
        },
      });

      await pipeline(nodeStream, progressStream, fileStream);

      if (hash && checksum) {
        const digest = hash.digest('hex');
        if (digest.toLowerCase() !== checksum.toLowerCase()) {
          throw new Error('校验和不匹配，下载内容可能已损坏');
        }
      }

      await fs.rename(this.tempFilePath, this.finalFilePath);

      this.updateStatus({ state: 'ready', version, filePath: this.finalFilePath });
      return { success: true, filePath: this.finalFilePath };
    } catch (error) {
      const aborted = !!this.controller?.signal.aborted;
      await this.cleanupPartial();
      this.controller = null;

      if (aborted) {
        this.updateStatus({ state: 'idle' });
        return { success: false, aborted: true };
      }

      const message = error instanceof Error ? error.message : String(error);
      this.updateStatus({ state: 'error', message });
      return { success: false, error: message };
    } finally {
      this.controller = null;
    }
  }

  async cancel(): Promise<UpdateOperationResult> {
    if (!this.controller) {
      return { success: false, error: 'no-download' };
    }

    this.controller.abort();
    await this.cleanupPartial();
    this.controller = null;
    this.updateStatus({ state: 'idle' });
    return { success: true };
  }

  async install(): Promise<UpdateOperationResult> {
    if (this.status.state !== 'ready') {
      return { success: false, error: 'not-ready' };
    }

    const result = await shell.openPath(this.status.filePath);
    if (result) {
      return { success: false, error: result };
    }

    return { success: true };
  }

  private ensureDownloadDir(): string {
    return path.join(app.getPath('temp'), 'booltox-updates');
  }

  private async cleanupPartial() {
    if (this.tempFilePath) {
      try {
        await fs.unlink(this.tempFilePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('[UpdateManager] 清理临时文件失败:', error);
        }
      }
    }
    this.tempFilePath = null;
    this.finalFilePath = null;
  }

  private updateStatus(status: UpdateStatus) {
    this.status = status;
    const window = this.getWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('update:status', status);
    }
  }
}
