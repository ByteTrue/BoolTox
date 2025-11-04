import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { APP_VERSION } from '@/config/app-info';
import { checkForAppUpdate } from '@/lib/update-service';
import { useToast } from './toast-context';

type NativeUpdateStatus =
  | { state: 'idle' }
  | { state: 'downloading'; version: string; downloadedBytes: number; totalBytes?: number }
  | { state: 'ready'; version: string; filePath: string }
  | { state: 'error'; message: string };

type UpdateDetails = {
  version: string;
  notes?: string | null;
  downloadUrl: string;
  checksum?: string;
  sizeBytes?: number;
  mandatory?: boolean;
};

type UpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

type UpdateState = {
  phase: UpdatePhase;
  progress?: {
    downloadedBytes: number;
    totalBytes?: number;
  };
  error?: string;
  downloadPath?: string;
};

interface UpdateContextValue {
  state: UpdateState;
  details: UpdateDetails | null;
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
  const { showToast } = useToast();

  const ensureUpdateAvailable = useCallback(() => {
    if (!details) {
      throw new Error('当前没有可用的更新信息');
    }
    return details;
  }, [details]);

  const mapNativeStatus = useCallback(
    (status: NativeUpdateStatus): void => {
      setState((current) => {
        switch (status.state) {
          case 'idle':
            return details ? { phase: 'available' } : { phase: 'idle' };
          case 'downloading':
            return {
              phase: 'downloading',
              progress: {
                downloadedBytes: status.downloadedBytes,
                totalBytes: status.totalBytes,
              },
            };
          case 'ready':
            return {
              phase: 'downloaded',
              downloadPath: status.filePath,
            };
          case 'error':
            return {
              phase: 'error',
              error: status.message,
            };
          default:
            return current;
        }
      });
    },
    [details],
  );

  const performCheck = useCallback(async () => {
    setState({ phase: 'checking' });
    try {
      const info = await checkForAppUpdate(APP_VERSION);
      if (!info.updateAvailable || !info.version || !info.downloadUrl) {
        setDetails(null);
        setState({ phase: 'idle' });
        return;
      }

      const updateDetails: UpdateDetails = {
        version: info.version,
        notes: info.notes ?? null,
        downloadUrl: info.downloadUrl,
        checksum: info.checksum ?? undefined,
        sizeBytes: info.sizeBytes,
        mandatory: info.mandatory,
      };
      setDetails(updateDetails);
      setState({ phase: 'available' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ phase: 'error', error: message });
    }
  }, []);

  useEffect(() => {
    void performCheck();
  }, [performCheck]);

  useEffect(() => {
    if (!window.update?.getStatus) {
      return;
    }

    let mounted = true;

    const syncStatus = async () => {
      const nativeStatus = await window.update.getStatus();
      if (!mounted) return;
      mapNativeStatus(nativeStatus as NativeUpdateStatus);
    };

    void syncStatus();

    const unsubscribe = window.update.onStatus((status) => {
      mapNativeStatus(status as NativeUpdateStatus);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [mapNativeStatus]);

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
    const result = await window.update.download({
      version: info.version,
      downloadUrl: info.downloadUrl,
      checksum: info.checksum,
      sizeBytes: info.sizeBytes,
    });

    if (!result.success && !result.aborted) {
      setState({ phase: 'error', error: result.error ?? '下载失败，请稍后重试' });
      showToast({
        message: result.error ?? '下载更新时出现问题，请检查网络后重试。',
        type: 'error',
      });
    }
  }, [ensureUpdateAvailable, showToast]);

  const cancelDownload = useCallback(async () => {
    if (!window.update) return;
    const result = await window.update.cancel();
    if (!result.success && result.error !== 'no-download') {
      showToast({ message: result.error ?? '取消下载失败，请稍后重试。', type: 'error' });
      return;
    }
    if (details) {
      setState({ phase: 'available' });
    } else {
      setState({ phase: 'idle' });
    }
  }, [details, showToast]);

  const installUpdate = useCallback(async () => {
    if (!window.update) return;
    const result = await window.update.install();
    if (!result.success && result.error) {
      showToast({ message: result.error ?? '安装失败，请稍后重试。', type: 'error' });
      return;
    }
    showToast({ message: '安装包已打开，请按照安装程序指引完成更新。', type: 'success' });
  }, [showToast]);

  const dismissUpdate = useCallback(() => {
    if (details?.mandatory) {
      showToast({ message: '此更新为强制更新，请尽快完成升级。', type: 'default' });
      return;
    }
    setDetails(null);
    setState({ phase: 'idle' });
  }, [details, showToast]);

  const value = useMemo<UpdateContextValue>(() => ({
    state,
    details,
    downloadUpdate,
    cancelDownload,
    installUpdate,
    dismissUpdate,
    retryCheck: performCheck,
  }), [state, details, downloadUpdate, cancelDownload, installUpdate, dismissUpdate, performCheck]);

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdate(): UpdateContextValue {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}
