import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface DiskInfo {
  name: string;
  total: number;
  free: number;
  used: number;
}

/**
 * 获取所有磁盘信息
 * 支持 Windows、macOS、Linux
 */
export async function getAllDisksInfo(): Promise<DiskInfo[]> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      return await getWindowsDisksInfo();
    } else if (platform === 'darwin') {
      return await getMacOSDisksInfo();
    } else if (platform === 'linux') {
      return await getLinuxDisksInfo();
    } else {
      return [];
    }
  } catch (error) {
    console.error('Failed to get disks info:', error);
    return [];
  }
}

/**
 * Windows 所有磁盘信息获取
 * 使用 PowerShell 命令获取所有固定磁盘
 */
async function getWindowsDisksInfo(): Promise<DiskInfo[]> {
  try {
    const { stdout } = await execAsync(
      'powershell -Command "Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Used -ne $null} | Select-Object Name, @{Name=\'Total\';Expression={$_.Used + $_.Free}}, Free | ConvertTo-Json"'
    );

    type PowerShellDrive = {
      Name?: string;
      Total?: string | number;
      Free?: string | number;
    };

    const parsed = stdout.trim() ? JSON.parse(stdout.trim()) as unknown : [];
    const drives = Array.isArray(parsed) ? parsed : [parsed];

    return drives
      .filter((drive): drive is PowerShellDrive => typeof drive === 'object' && drive !== null && 'Name' in drive)
      .map((drive) => {
        const totalValue = typeof drive.Total === 'number' ? drive.Total : parseInt(String(drive.Total ?? '0'), 10);
        const freeValue = typeof drive.Free === 'number' ? drive.Free : parseInt(String(drive.Free ?? '0'), 10);
        const total = Number.isFinite(totalValue) ? Number(totalValue) : 0;
        const free = Number.isFinite(freeValue) ? Number(freeValue) : 0;
        const used = Math.max(total - free, 0);

        return {
          name: `${drive.Name ?? 'Unknown'}:`,
          total,
          free,
          used,
        } satisfies DiskInfo;
      });
  } catch (error) {
    console.error('Windows disks info error:', error);
    return [];
  }
}

/**
 * macOS 所有磁盘信息获取
 * 使用 df 命令获取所有挂载点
 */
async function getMacOSDisksInfo(): Promise<DiskInfo[]> {
  try {
    const { stdout } = await execAsync('df -k');
    const lines = stdout.trim().split('\n').slice(1); // 跳过表头

    const disks: DiskInfo[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;

      const mountPoint = parts[8];
      
      // 只包含真实磁盘挂载点，过滤系统和虚拟文件系统
      if (
        !mountPoint.startsWith('/System') &&
        !mountPoint.startsWith('/private') &&
        !mountPoint.includes('/dev') &&
        !seen.has(mountPoint)
      ) {
        const total = parseInt(parts[1], 10) * 1024; // 转换为字节
        const used = parseInt(parts[2], 10) * 1024;
        const free = parseInt(parts[3], 10) * 1024;

        if (total > 0) {
          disks.push({
            name: mountPoint,
            total,
            free,
            used,
          });
          seen.add(mountPoint);
        }
      }
    }

    return disks;
  } catch (error) {
    console.error('macOS disks info error:', error);
    return [];
  }
}

/**
 * Linux 所有磁盘信息获取
 * 使用 df 命令获取所有挂载点
 */
async function getLinuxDisksInfo(): Promise<DiskInfo[]> {
  try {
    const { stdout } = await execAsync('df -k -x tmpfs -x devtmpfs');
    const lines = stdout.trim().split('\n').slice(1); // 跳过表头

    const disks: DiskInfo[] = [];

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 6) continue;

      const mountPoint = parts[5];
      const total = parseInt(parts[1], 10) * 1024; // 转换为字节
      const used = parseInt(parts[2], 10) * 1024;
      const free = parseInt(parts[3], 10) * 1024;

      if (total > 0) {
        disks.push({
          name: mountPoint,
          total,
          free,
          used,
        });
      }
    }

    return disks;
  } catch (error) {
    console.error('Linux disks info error:', error);
    return [];
  }
}

/**
 * 格式化操作系统名称（简化版）
 * 只显示主要系统类型：Windows、macOS 或 Linux
 */
export function formatOSName(): string {
  const platform = os.platform();

  switch (platform) {
    case 'win32':
      return 'Windows';

    case 'darwin':
      return 'macOS';

    case 'linux':
      return 'Linux';

    default:
      return platform;
  }
}
