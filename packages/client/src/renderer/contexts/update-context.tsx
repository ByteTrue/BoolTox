/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AutoUpdateStatus } from '../../../electron/services/auto-update.service';
import type { UpdateInfo } from 'electron-updater';
import { useToast } from './toast-context';

type UpdateDetails = {
  version: string;
  notes?: string | null;
  sizeBytes?: number;
  mandatory?: boolean;
  date?: string;
  name?: string;
};

type UpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

type UpdateState = {
  phase: UpdatePhase;
  progress?: {
    downloadedBytes: number;
    totalBytes?: number;
    percent?: number;
  };
  error?: string;
};

interface UpdateContextValue {
  state: UpdateState;
  details: UpdateDetails | null;
  bannerDismissed: boolean;
  downloadUpdate: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  retryCheck: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [details, setDetails] = useState<UpdateDetails | null>(null);
  const [state, setState] = useState<UpdateState>({ phase: 'checking' });
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.phase === 'available' && details?.version && !details.notes) {
      const fetchNotes = async () => {
        try {
          // 这里的 owner/repo 暂时硬编码，后续可从配置读取
          const owner = 'ByteTrue';
          const repo = 'BoolTox';
          const tags = [`v${details.version}`, details.version];
          
          for (const tag of tags) {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`);
            if (res.ok) {
              const data = await res.json();
              if (data.body) {
                setDetails((prev) => {
                  if (!prev || prev.version !== details.version) return prev;
                  return {
                    ...prev,
                    notes: data.body,
                    name: data.name || prev.name,
                    date: data.published_at || prev.date,
                  };
                });
                break;
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch release notes from GitHub:', error);
        }
      };
      
      void fetchNotes();
    }
  }, [state.phase, details?.version, details?.notes]);

  const ensureUpdateAvailable = useCallback(() => {
    if (!details) {
      throw new Error('当前没有可用的更新信息');
    }
    return details;
  }, [details]);

  const extractDetails = useCallback((info?: UpdateInfo | null): UpdateDetails | null => {
    if (!info) return null;
    const releaseNotes = info.releaseNotes;
    let notes: string | null = null;
    if (typeof releaseNotes === 'string') {
      notes = releaseNotes;
    } else if (Array.isArray(releaseNotes)) {
      notes = releaseNotes
        .map((note) => {
          if (!note) return '';
          if (typeof note === 'string') return note;
          return note.note ?? '';
        })
        .filter(Boolean)
        .join('\n');
    }

    const sizeBytes = info.files?.find((file) => typeof file.size === 'number')?.size;

    return {
      version: info.version,
      notes,
      sizeBytes,
      mandatory: false,
      date: info.releaseDate,
      name: info.releaseName || undefined,
    };
  }, []);

  const handleStatus = useCallback(
    (status: AutoUpdateStatus): void => {
      switch (status.state) {
        case 'checking':
          setState((prev) => (prev.phase === 'available' || prev.phase === 'downloaded' ? prev : { phase: 'checking' }));
          break;
        case 'available': {
          setBannerDismissed(false);
          const info = extractDetails(status.info);
          setDetails(info);
          setState({ phase: 'available' });
          break;
        }
        case 'downloading': {
          setBannerDismissed(false);
          const { transferred, total, percent } = status.progress;
          const normalizedPercent = typeof percent === 'number'
            ? Math.max(0, Math.min(100, percent))
            : total && total > 0
              ? Math.max(0, Math.min(100, (transferred / total) * 100))
              : undefined;
          setState({
            phase: 'downloading',
            progress: {
              downloadedBytes: transferred,
              totalBytes: total,
              percent: normalizedPercent,
            },
          });
          break;
        }
        case 'downloaded': {
          setBannerDismissed(false);
          const info = extractDetails(status.info);
          setDetails(info);
          setState({ phase: 'downloaded' });
          break;
        }
        case 'not-available':
          setDetails(null);
          setState({ phase: 'idle' });
          break;
        case 'error':
          setBannerDismissed(false);
          setState({ phase: 'error', error: status.error });
          break;
        case 'idle':
        default:
          setState((prev) => (prev.phase === 'available' || prev.phase === 'downloaded' ? prev : { phase: 'idle' }));
          break;
      }
    },
    [extractDetails],
  );

  useEffect(() => {
    if (!window.update) {
      setState({ phase: 'idle' });
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        const status = (await window.update?.getStatus?.()) as AutoUpdateStatus | undefined;
        if (status && mounted) {
          handleStatus(status);
        }
      } catch (error) {
        console.error('获取自动更新状态失败:', error);
        if (mounted) {
          setState({ phase: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      unsubscribe = window.update?.onStatus?.((status) => {
        if (!mounted) return;
        handleStatus(status as AutoUpdateStatus);
      });

      try {
        await window.update.check();
      } catch (error) {
        console.error('自动更新检查失败:', error);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [handleStatus]);

  const downloadUpdate = useCallback(async () => {
    const info = ensureUpdateAvailable();
    if (!window.update) {
      showToast({
        message: '当前环境不支持自动更新，请手动下载最新版本。',
        type: 'error',
      });
      return;
    }

    setState({ phase: 'downloading', progress: { downloadedBytes: 0, totalBytes: info.sizeBytes } });
    try {
      await window.update.download();
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载失败，请稍后重试';
      setState({ phase: 'error', error: message });
      showToast({ message, type: 'error' });
    }
  }, [ensureUpdateAvailable, showToast]);

  const cancelDownload = useCallback(async () => {
    showToast({ message: '当前自动更新通道暂不支持取消下载，请耐心等待完成。', type: 'default' });
  }, [showToast]);

  const installUpdate = useCallback(async () => {
    if (!window.update) {
      showToast({ message: '当前环境不支持自动更新。', type: 'error' });
      return;
    }

    try {
      await window.update.install();
      showToast({ message: '安装程序已启动，请按指引完成更新。', type: 'success' });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : '安装失败，请稍后重试。', type: 'error' });
    }
  }, [showToast]);

  const dismissUpdate = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const retryCheck = useCallback(async () => {
    if (!window.update) {
      showToast({ message: '当前环境不支持自动更新。', type: 'error' });
      return;
    }

    setBannerDismissed(false);
    setState({ phase: 'checking' });
    try {
      await window.update.check();
    } catch (error) {
      const message = error instanceof Error ? error.message : '检查更新失败，请稍后重试。';
      setState({ phase: 'error', error: message });
      showToast({ message, type: 'error' });
    }
  }, [showToast]);

  const value = useMemo<UpdateContextValue>(() => ({
    state,
    details,
    bannerDismissed,
    downloadUpdate,
    cancelDownload,
    installUpdate,
    dismissUpdate,
    retryCheck,
  }), [state, details, bannerDismissed, downloadUpdate, cancelDownload, installUpdate, dismissUpdate, retryCheck]);

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdate(): UpdateContextValue {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}
