/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';

export type AutoUpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; info: UpdateInfo }
  | { state: 'not-available'; info?: UpdateInfo }
  | { state: 'downloading'; progress: ProgressInfo }
  | { state: 'downloaded'; info: UpdateInfo }
  | { state: 'error'; error: string };

export class AutoUpdateService {
  private status: AutoUpdateStatus = { state: 'idle' };

  constructor(private getWindow: () => BrowserWindow | null) {
    this.init();
  }

  private init() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      this.updateStatus({ state: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      this.updateStatus({ state: 'available', info });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.updateStatus({ state: 'not-available', info });
    });

    autoUpdater.on('error', (err) => {
      this.updateStatus({ state: 'error', error: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateStatus({ state: 'downloading', progress: progressObj });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.updateStatus({ state: 'downloaded', info });
    });

    ipcMain.handle('auto-update:check', async () => {
      return autoUpdater.checkForUpdates();
    });

    ipcMain.handle('auto-update:download', () => {
      return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('auto-update:get-status', () => {
      return this.status;
    });

    ipcMain.handle('auto-update:quit-and-install', () => {
      autoUpdater.quitAndInstall();
      return true;
    });
  }

  private updateStatus(status: AutoUpdateStatus) {
    this.status = status;
    this.sendToWindow('update:status', status);
  }

  private sendToWindow(channel: string, data: AutoUpdateStatus) {
    const win = this.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}
