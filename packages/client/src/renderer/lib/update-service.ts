import { RELEASE_CHANNEL } from "@/config/api";
import { apiFetch } from "@/lib/backend-client";
import type { SystemInfo } from "@/types/system";

type ReleaseResponse = {
  data: {
    updateAvailable: boolean;
    release: {
      id: string;
      version: string;
      channel: string;
      notes: string | null;
      mandatory: boolean;
      rolloutPercent: number;
      publishedAt: string | null;
      asset: {
        id: string;
        downloadUrl: string;
        checksum: string;
        signature: string | null;
        sizeBytes: number;
        platform: string;
        architecture: string;
      };
    } | null;
  };
};

export type UpdateInfo = {
  updateAvailable: boolean;
  version?: string;
  notes?: string | null;
  downloadUrl?: string;
  checksum?: string;
  sizeBytes?: number;
  mandatory?: boolean;
};

const mapPlatform = (platform: string): string => {
  if (platform.startsWith("win")) return "WINDOWS";
  if (platform === "darwin") return "MACOS";
  return "LINUX";
};

const mapArchitecture = (arch: string): string => {
  if (arch.includes("arm")) return "ARM64";
  return "X64";
};

export async function detectSystemPlatform() {
  try {
    const sys = typeof window !== "undefined" && window.ipc?.invoke
      ? (await window.ipc.invoke("get-system-info")) as Partial<SystemInfo> | null
      : null;
    const platform = mapPlatform(String(sys?.os?.platform ?? navigator.platform).toLowerCase());
    const architecture = mapArchitecture(String(sys?.cpu?.architecture ?? navigator.userAgent).toLowerCase());
    return { platform, architecture };
  } catch (error) {
    console.error("detectSystemPlatform error", error);
    const fallbackPlatform = mapPlatform(navigator.platform.toLowerCase());
    return { platform: fallbackPlatform, architecture: "X64" };
  }
}

export async function checkForAppUpdate(currentVersion: string): Promise<UpdateInfo> {
  const { platform, architecture } = await detectSystemPlatform();
  const params = new URLSearchParams({
    version: currentVersion,
    platform,
    architecture,
    channel: RELEASE_CHANNEL,
  });

  const response = await apiFetch<ReleaseResponse>(`/api/public/releases/latest?${params.toString()}`);

  if (!response.data.updateAvailable || !response.data.release) {
    return { updateAvailable: false };
  }

  const { release } = response.data;

  return {
    updateAvailable: true,
    version: release.version,
    notes: release.notes,
    downloadUrl: release.asset.downloadUrl,
    checksum: release.asset.checksum,
    sizeBytes: release.asset.sizeBytes,
    mandatory: release.mandatory,
  };
}
