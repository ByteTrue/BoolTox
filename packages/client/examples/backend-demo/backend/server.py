#!/usr/bin/env python3
"""
系统信息监控后端
使用 psutil 库获取系统信息并通过 STDIO 与前端通信
"""

from __future__ import annotations

import json
import sys
import time
import threading
from typing import Any, Dict, List
import platform

# 使用标准SDK
try:
    from booltox_sdk import BoolToxBackend
except ImportError:
    print(json.dumps({
        "jsonrpc": "2.0",
        "method": "$log",
        "params": {"level": "error", "message": "booltox_sdk not found in PYTHONPATH"}
    }), flush=True)
    sys.exit(1)

try:
    import psutil
except ImportError:
    notification = {"jsonrpc": "2.0", "method": "$log", "params": {"level": "error", "message": "psutil 库未安装，请运行: pip install psutil"}}
    print(json.dumps(notification), flush=True)
    sys.exit(1)


class SystemMonitor:
    """系统监控类"""

    def __init__(self, backend=None):
        self.monitoring = False
        self.monitor_thread = None
        self.backend = backend  # 可选的backend引用，用于发送事件

    def send(self, method: str, params: Dict[str, Any] = None) -> None:
        """发送事件到前端（通过SDK）"""
        if self.backend:
            self.backend.emit(method, params or {})
        else:
            # 降级：直接发送JSON-RPC通知
            notification = {
                "jsonrpc": "2.0",
                "method": method,
                "params": params or {}
            }
            sys.stdout.write(json.dumps(notification, ensure_ascii=False) + "\n")
            sys.stdout.flush()

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

    def monitor_loop(self) -> None:
        """监控循环，每秒推送一次数据"""
        while self.monitoring:
            try:
                data = {
                    "cpu": self.get_cpu_info(),
                    "memory": self.get_memory_info(),
                    "network": self.get_network_info(),
                    "timestamp": time.time(),
                }
                self.send("monitor_data", {"data": data})
                time.sleep(1)
            except Exception as e:
                self.send("error", {"message": f"监控循环错误: {str(e)}"})
                break

    def start_monitor(self) -> None:
        """开始监控"""
        if self.monitoring:
            self.send("info", {"message": "监控已在运行"})
            return

        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()
        self.send("monitor_started", {"message": "实时监控已启动"})

    def stop_monitor(self) -> None:
        """停止监控"""
        if not self.monitoring:
            self.send("info", {"message": "监控未运行"})
            return

        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        self.send("monitor_stopped", {"message": "实时监控已停止"})


def main() -> None:
    """主函数"""
    # 使用标准SDK
    backend = BoolToxBackend()
    monitor = SystemMonitor(backend)  # 传入backend实例

    # 注册RPC方法
    @backend.method("get_system_info")
    async def get_system_info(params):
        return monitor.get_system_info()

    @backend.method("get_cpu_info")
    async def get_cpu_info(params):
        return monitor.get_cpu_info()

    @backend.method("get_memory_info")
    async def get_memory_info(params):
        return monitor.get_memory_info()

    @backend.method("get_disk_info")
    async def get_disk_info(params):
        return monitor.get_disk_info()

    @backend.method("get_network_info")
    async def get_network_info(params):
        return monitor.get_network_info()

    @backend.method("get_processes")
    async def get_processes(params):
        return monitor.get_processes()

    @backend.method("start_monitor")
    async def start_monitor(params):
        monitor.start_monitor()
        return {"success": True}

    @backend.method("stop_monitor")
    async def stop_monitor(params):
        monitor.stop_monitor()
        return {"success": True}

    # 启动后端（自动发送$ready信号）
    backend.run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        sys.stderr.write(f"Backend error: {str(e)}\n")
        sys.stderr.flush()
        sys.exit(1)
