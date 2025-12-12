#!/usr/bin/env python3
"""
系统信息监控后端 - HTTP 服务器版本
使用 FastAPI 提供 HTTP API 和 WebSocket 实时推送
完全独立运行，不依赖 BoolTox SDK
"""

from __future__ import annotations

import json
import sys
import time
import asyncio
from typing import Any, Dict, List, Optional
import platform
from pathlib import Path

try:
    import psutil
except ImportError:
    print("错误: psutil 库未安装，请运行: pip install psutil", file=sys.stderr)
    sys.exit(1)

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    import uvicorn
except ImportError:
    print("错误: fastapi 和 uvicorn 未安装，请运行: pip install fastapi uvicorn", file=sys.stderr)
    sys.exit(1)


class SystemMonitor:
    """系统监控类"""

    def __init__(self):
        self.monitoring_clients: List[WebSocket] = []

    def get_system_info(self) -> Dict[str, Any]:
        """获取静态系统信息"""
        try:
            boot_time = psutil.boot_time()
            boot_time_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(boot_time))

            return {
                "platform": platform.system(),
                "platform_release": platform.release(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "hostname": platform.node(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
                "cpu_count": psutil.cpu_count(logical=False),
                "cpu_count_logical": psutil.cpu_count(logical=True),
                "boot_time": boot_time_str,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_cpu_info(self) -> Dict[str, Any]:
        """获取 CPU 信息"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_percent_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
            cpu_freq = psutil.cpu_freq()

            return {
                "percent": cpu_percent,
                "percent_per_core": cpu_percent_per_core,
                "frequency": {
                    "current": cpu_freq.current if cpu_freq else 0,
                    "min": cpu_freq.min if cpu_freq else 0,
                    "max": cpu_freq.max if cpu_freq else 0,
                } if cpu_freq else None,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_memory_info(self) -> Dict[str, Any]:
        """获取内存信息"""
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()

            return {
                "total": mem.total,
                "available": mem.available,
                "used": mem.used,
                "percent": mem.percent,
                "swap_total": swap.total,
                "swap_used": swap.used,
                "swap_percent": swap.percent,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_disk_info(self) -> List[Dict[str, Any]]:
        """获取磁盘信息"""
        try:
            disks = []
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disks.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent,
                    })
                except PermissionError:
                    continue
            return disks
        except Exception as e:
            return [{"error": str(e)}]

    def get_network_info(self) -> Dict[str, Any]:
        """获取网络信息"""
        try:
            net_io = psutil.net_io_counters()
            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_processes(self, sort_by: str = "cpu", limit: int = 10) -> List[Dict[str, Any]]:
        """获取进程列表"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    pinfo = proc.info
                    processes.append({
                        "pid": pinfo['pid'],
                        "name": pinfo['name'],
                        "cpu_percent": pinfo['cpu_percent'] or 0,
                        "memory_percent": pinfo['memory_percent'] or 0,
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # 排序
            if sort_by == "cpu":
                processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
            elif sort_by == "memory":
                processes.sort(key=lambda x: x['memory_percent'], reverse=True)

            return processes[:limit]
        except Exception as e:
            return [{"error": str(e)}]

    async def monitor_loop(self, websocket: WebSocket) -> None:
        """监控循环，每秒推送一次数据到指定 WebSocket"""
        try:
            while True:
                data = {
                    "cpu": self.get_cpu_info(),
                    "memory": self.get_memory_info(),
                    "network": self.get_network_info(),
                    "timestamp": time.time(),
                }
                await websocket.send_json({"type": "monitor_data", "data": data})
                await asyncio.sleep(1)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"监控循环错误: {e}", file=sys.stderr)


# 创建 FastAPI 应用
app = FastAPI(title="系统信息监控", version="2.0.0")
monitor = SystemMonitor()

# 静态文件服务
dist_path = Path(__file__).parent.parent / "dist"
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")


@app.get("/")
async def index():
    """返回前端页面"""
    index_file = dist_path / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"error": "前端文件未找到，请先构建前端: pnpm build"}


@app.get("/api/system")
async def get_system_info():
    """获取系统信息"""
    return monitor.get_system_info()


@app.get("/api/cpu")
async def get_cpu_info():
    """获取 CPU 信息"""
    return monitor.get_cpu_info()


@app.get("/api/memory")
async def get_memory_info():
    """获取内存信息"""
    return monitor.get_memory_info()


@app.get("/api/disk")
async def get_disk_info():
    """获取磁盘信息"""
    return monitor.get_disk_info()


@app.get("/api/network")
async def get_network_info():
    """获取网络信息"""
    return monitor.get_network_info()


@app.get("/api/processes")
async def get_processes(sort_by: str = "cpu", limit: int = 10):
    """获取进程列表"""
    return monitor.get_processes(sort_by, limit)


@app.websocket("/ws/monitor")
async def websocket_monitor(websocket: WebSocket):
    """实时监控 WebSocket"""
    await websocket.accept()
    monitor.monitoring_clients.append(websocket)
    try:
        await monitor.monitor_loop(websocket)
    finally:
        if websocket in monitor.monitoring_clients:
            monitor.monitoring_clients.remove(websocket)


def main():
    """启动 HTTP 服务器"""
    port = 8001  # 默认端口
    print(f"启动系统信息监控服务: http://127.0.0.1:{port}", file=sys.stderr)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")


if __name__ == "__main__":
    main()
