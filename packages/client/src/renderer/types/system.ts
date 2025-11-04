/**
 * 系统信息类型定义
 */

export interface SystemInfo {
  os: {
    platform: string;
    release: string;
    type: string;
    name: string; // 格式化后的操作系统名称
    arch?: string;
  };
  cpu: {
    model: string;
    cores: number;
    speed: number; // MHz
    usage: number; // CPU 使用率百分比 (0-100)
    architecture?: string;
  };
  memory: {
    total: number; // 字节
    free: number;
    used: number;
  };
  disks: Array<{
    name: string; // 磁盘名称/挂载点
    total: number; // 字节
    free: number;
    used: number;
  }>;
  uptime: number; // 应用运行时长（秒）
}
