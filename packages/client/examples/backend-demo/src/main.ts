/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 系统监控主应用 - HTTP Service 模式
 * 使用标准 WebSocket + fetch API 与后端通信
 */

import './style.css';
import type {
  SystemInfo,
  CPUInfo,
  MemoryInfo,
  DiskInfo,
  ProcessInfo,
  MonitorData,
} from './types';
import { formatBytes, getPercentColor, createCircularProgress } from './utils';

const logInfo = (...args: unknown[]): void => {
  console.warn('[SystemMonitor]', ...args);
};

// 后端 API 配置
const API_BASE = 'http://127.0.0.1:8001';
const WS_URL = 'ws://127.0.0.1:8001/ws/monitor';

// 应用状态
let ws: WebSocket | null = null;

// DOM 元素
const elements = {
  statusDot: document.getElementById('status-dot') as HTMLDivElement,
  statusLabel: document.getElementById('status-label') as HTMLSpanElement,
  startBtn: document.getElementById('start-btn') as HTMLButtonElement,
  stopBtn: document.getElementById('stop-btn') as HTMLButtonElement,
  refreshBtn: document.getElementById('refresh-btn') as HTMLButtonElement,

  systemInfo: document.getElementById('system-info') as HTMLDivElement,
  cpuInfo: document.getElementById('cpu-info') as HTMLDivElement,
  memoryInfo: document.getElementById('memory-info') as HTMLDivElement,
  diskInfo: document.getElementById('disk-info') as HTMLDivElement,
  processList: document.getElementById('process-list') as HTMLDivElement,
};

/**
 * 调用后端 HTTP API
 */
async function callAPI<T = unknown>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 更新状态指示器
 */
function updateStatus(text: string, ready: boolean): void {
  elements.statusLabel.textContent = text;
  if (ready) {
    elements.statusDot.classList.add('ready');
  } else {
    elements.statusDot.classList.remove('ready');
  }
}

/**
 * 渲染系统信息
 */
function renderSystemInfo(info: SystemInfo): void {
  elements.systemInfo.innerHTML = `
    <div class="info-item">
      <span class="info-label">操作系统</span>
      <span class="info-value">${info.platform} ${info.platform_release}</span>
    </div>
    <div class="info-item">
      <span class="info-label">主机名</span>
      <span class="info-value">${info.hostname}</span>
    </div>
    <div class="info-item">
      <span class="info-label">架构</span>
      <span class="info-value">${info.architecture}</span>
    </div>
    <div class="info-item">
      <span class="info-label">处理器</span>
      <span class="info-value">${info.processor || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">CPU 核心</span>
      <span class="info-value">${info.cpu_count} 物理 / ${info.cpu_count_logical} 逻辑</span>
    </div>
    <div class="info-item">
      <span class="info-label">Python 版本</span>
      <span class="info-value">${info.python_version}</span>
    </div>
    <div class="info-item">
      <span class="info-label">启动时间</span>
      <span class="info-value">${info.boot_time}</span>
    </div>
  `;
}

/**
 * 渲染 CPU 信息
 */
function renderCPUInfo(cpu: CPUInfo): void {
  const color = getPercentColor(cpu.percent);

  let html = `
    <div class="stat-card">
      <div class="stat-value" style="color: ${color}">${cpu.percent.toFixed(1)}%</div>
      <div class="stat-label">总体使用率</div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${cpu.percent}%; background: ${color}"></div>
    </div>
  `;

  if (cpu.frequency) {
    html += `
      <div class="info-item">
        <span class="info-label">当前频率</span>
        <span class="info-value">${cpu.frequency.current.toFixed(0)} MHz</span>
      </div>
    `;
  }

  // CPU 核心
  if (cpu.percent_per_core && cpu.percent_per_core.length > 0) {
    html += '<div class="cpu-cores">';
    cpu.percent_per_core.forEach((percent, index) => {
      const coreColor = getPercentColor(percent);
      html += `
        <div class="cpu-core">
          <div class="cpu-core-label">核心 ${index}</div>
          <div class="cpu-core-value" style="color: ${coreColor}">${percent.toFixed(1)}%</div>
        </div>
      `;
    });
    html += '</div>';
  }

  elements.cpuInfo.innerHTML = html;
}

/**
 * 渲染内存信息
 */
function renderMemoryInfo(memory: MemoryInfo): void {
  elements.memoryInfo.innerHTML = `
    <div class="circular-progress">
      ${createCircularProgress(memory.percent)}
    </div>
    <div style="margin-top: 16px;">
      <div class="info-item">
        <span class="info-label">总内存</span>
        <span class="info-value">${formatBytes(memory.total)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">已使用</span>
        <span class="info-value">${formatBytes(memory.used)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">可用</span>
        <span class="info-value">${formatBytes(memory.available)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">交换分区</span>
        <span class="info-value">${formatBytes(memory.swap_used)} / ${formatBytes(memory.swap_total)}</span>
      </div>
    </div>
  `;
}

/**
 * 渲染磁盘信息
 */
function renderDiskInfo(disks: DiskInfo[]): void {
  if (disks.length === 0) {
    elements.diskInfo.innerHTML = '<div class="empty-state">无磁盘信息</div>';
    return;
  }

  let html = '<div class="disk-list">';
  disks.forEach((disk) => {
    const color = getPercentColor(disk.percent);
    html += `
      <div class="disk-item">
        <div class="disk-header">
          <div class="disk-name">${disk.mountpoint}</div>
          <div class="disk-percent" style="color: ${color}">${disk.percent.toFixed(1)}%</div>
        </div>
        <div class="disk-info">${disk.device} (${disk.fstype})</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${disk.percent}%; background: ${color}"></div>
        </div>
        <div class="info-item">
          <span class="info-label">已使用 / 总容量</span>
          <span class="info-value">${formatBytes(disk.used)} / ${formatBytes(disk.total)}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';

  elements.diskInfo.innerHTML = html;
}

/**
 * 渲染进程列表
 */
function renderProcessList(processes: ProcessInfo[]): void {
  if (processes.length === 0) {
    elements.processList.innerHTML = '<div class="empty-state">无进程信息</div>';
    return;
  }

  let html = `
    <table class="process-table">
      <thead>
        <tr>
          <th>PID</th>
          <th>进程名</th>
          <th>CPU %</th>
          <th>内存 %</th>
        </tr>
      </thead>
      <tbody>
  `;

  processes.forEach((proc) => {
    html += `
      <tr>
        <td>${proc.pid}</td>
        <td>${proc.name}</td>
        <td>${proc.cpu_percent.toFixed(1)}%</td>
        <td>${proc.memory_percent.toFixed(1)}%</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  elements.processList.innerHTML = html;
}

/**
 * 处理 WebSocket 消息
 */
function handleWebSocketMessage(event: MessageEvent): void {
  try {
    const message = JSON.parse(event.data);

    if (message.type === 'monitor_data' && message.data) {
      const monitorData = message.data as MonitorData;
      renderCPUInfo(monitorData.cpu);
      renderMemoryInfo(monitorData.memory);
    }
  } catch (error) {
    console.error('处理 WebSocket 消息失败:', error);
  }
}

/**
 * 连接 WebSocket
 */
function connectWebSocket(): void {
  if (ws) {
    ws.close();
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    logInfo('WebSocket 已连接');
    updateStatus('监控运行中', true);
    elements.startBtn.disabled = true;
    elements.stopBtn.disabled = false;
  };

  ws.onmessage = handleWebSocketMessage;

  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
    updateStatus('连接错误', false);
  };

  ws.onclose = () => {
    logInfo('WebSocket 已断开');
    updateStatus('监控已停止', true);
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
    ws = null;
  };
}

/**
 * 断开 WebSocket
 */
function disconnectWebSocket(): void {
  if (ws) {
    ws.close();
    ws = null;
  }
}

/**
 * 开始监控
 */
function startMonitoring(): void {
  connectWebSocket();
}

/**
 * 停止监控
 */
function stopMonitoring(): void {
  disconnectWebSocket();
}

/**
 * 刷新数据
 */
async function refreshData(): Promise<void> {
  try {
    const [systemInfo, cpuInfo, memoryInfo, diskInfo, processes] = await Promise.all([
      callAPI<SystemInfo>('/api/system'),
      callAPI<CPUInfo>('/api/cpu'),
      callAPI<MemoryInfo>('/api/memory'),
      callAPI<DiskInfo[]>('/api/disk'),
      callAPI<ProcessInfo[]>('/api/processes?sort_by=cpu&limit=10'),
    ]);

    renderSystemInfo(systemInfo);
    renderCPUInfo(cpuInfo);
    renderMemoryInfo(memoryInfo);
    renderDiskInfo(diskInfo);
    renderProcessList(processes);
  } catch (error) {
    console.error('刷新数据失败:', error);
    alert(`刷新数据失败: ${error}`);
  }
}

/**
 * 初始化应用
 */
async function init(): Promise<void> {
  // 绑定按钮事件
  elements.startBtn.addEventListener('click', startMonitoring);
  elements.stopBtn.addEventListener('click', stopMonitoring);
  elements.refreshBtn.addEventListener('click', refreshData);

  // 加载初始数据
  try {
    updateStatus('加载中...', false);
    await refreshData();
    updateStatus('就绪', true);
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
    elements.refreshBtn.disabled = false;
  } catch (error) {
    console.error('初始化失败:', error);
    updateStatus('初始化失败', false);
    alert(`初始化失败: ${error}\n\n请确保后端服务正在运行（http://127.0.0.1:8001）`);
  }

  // 清理
  window.addEventListener('beforeunload', () => {
    disconnectWebSocket();
  });
}

// 启动应用
init();
