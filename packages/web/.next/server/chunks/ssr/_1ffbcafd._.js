module.exports = [
"[project]/packages/sdk/src/agent-detector.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Agent 自动探测模块
 * 检测本地 Agent 是否运行
 */ __turbopack_context__.s([
    "AgentDetector",
    ()=>AgentDetector,
    "detectAgent",
    ()=>detectAgent
]);
class AgentDetector {
    options;
    retryTimer;
    listeners = [];
    constructor(options = {}){
        this.options = {
            urls: options.urls || [
                'http://localhost:9527'
            ],
            timeout: options.timeout || 3000,
            autoRetry: options.autoRetry !== false,
            retryInterval: options.retryInterval || 5000
        };
    }
    /**
   * 检测 Agent 是否可用
   */ async detect() {
        // 尝试每个候选 URL
        for (const url of this.options.urls){
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(()=>controller.abort(), this.options.timeout);
                const response = await fetch(`${url}/api/health`, {
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    const info = {
                        available: true,
                        url,
                        version: data.version,
                        protocol: data.protocol
                    };
                    // 通知监听器
                    this.notifyListeners(info);
                    return info;
                }
            } catch (error) {
                continue;
            }
        }
        // 所有 URL 都失败
        const info = {
            available: false,
            url: this.options.urls[0]
        };
        this.notifyListeners(info);
        return info;
    }
    /**
   * 启动自动检测（轮询）
   */ startAutoDetect(callback) {
        if (callback) {
            this.on(callback);
        }
        // 立即检测一次
        this.detect();
        // 启动定时检测
        if (this.options.autoRetry && !this.retryTimer) {
            this.retryTimer = setInterval(()=>{
                this.detect();
            }, this.options.retryInterval);
        }
    }
    /**
   * 停止自动检测
   */ stopAutoDetect() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = undefined;
        }
    }
    /**
   * 监听 Agent 状态变化
   */ on(listener) {
        this.listeners.push(listener);
        return ()=>this.off(listener);
    }
    /**
   * 取消监听
   */ off(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
   * 通知所有监听器
   */ notifyListeners(info) {
        this.listeners.forEach((listener)=>{
            try {
                listener(info);
            } catch (error) {
                console.error('Error in AgentDetector listener:', error);
            }
        });
    }
    /**
   * 清理资源
   */ destroy() {
        this.stopAutoDetect();
        this.listeners = [];
    }
}
async function detectAgent(urls, timeout) {
    const detector = new AgentDetector({
        urls,
        timeout,
        autoRetry: false
    });
    return detector.detect();
}
}),
"[project]/packages/sdk/src/agent-client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Agent HTTP 客户端
 * 封装所有 Agent API 调用
 */ __turbopack_context__.s([
    "AgentClient",
    ()=>AgentClient,
    "createAgentClient",
    ()=>createAgentClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/index.js [app-ssr] (ecmascript) <locals>");
;
class AgentClient {
    client;
    baseUrl;
    constructor(options = {}){
        this.baseUrl = options.baseUrl || 'http://localhost:9527';
        this.client = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].create({
            prefixUrl: this.baseUrl,
            timeout: options.timeout || 30000,
            retry: {
                limit: 2,
                methods: [
                    'get',
                    'post',
                    'put',
                    'delete'
                ],
                statusCodes: [
                    408,
                    413,
                    429,
                    500,
                    502,
                    503,
                    504
                ]
            },
            hooks: {
                beforeRequest: [
                    (request)=>{
                    // TODO: 添加认证 token
                    // request.headers.set('Authorization', `Bearer ${token}`);
                    }
                ]
            },
            ...options.kyOptions
        });
    }
    // ==================== 健康检查 ====================
    /**
   * 检查 Agent 健康状态
   */ async health() {
        return this.client.get('api/health').json();
    }
    /**
   * 获取 Agent 信息
   */ async info() {
        return this.client.get('api/info').json();
    }
    // ==================== 插件管理 ====================
    /**
   * 获取所有插件列表
   */ async getPlugins() {
        return this.client.get('api/plugins').json();
    }
    /**
   * 获取单个插件信息
   */ async getPlugin(pluginId) {
        return this.client.get(`api/plugins/${pluginId}`).json();
    }
    /**
   * 安装插件
   */ async installPlugin(options) {
        return this.client.post('api/plugins/install', {
            json: options
        }).json();
    }
    /**
   * 卸载插件
   */ async uninstallPlugin(pluginId) {
        return this.client.delete(`api/plugins/${pluginId}`).json();
    }
    /**
   * 启动插件
   */ async startPlugin(pluginId) {
        return this.client.post(`api/plugins/${pluginId}/start`).json();
    }
    /**
   * 停止插件
   */ async stopPlugin(pluginId) {
        return this.client.post(`api/plugins/${pluginId}/stop`).json();
    }
    /**
   * 获取插件日志
   */ async getPluginLogs(pluginId, limit) {
        const searchParams = limit ? {
            limit: limit.toString()
        } : undefined;
        return this.client.get(`api/plugins/${pluginId}/logs`, {
            searchParams
        }).json();
    }
    // ==================== 插件市场 ====================
    /**
   * 从远程市场获取插件列表
   */ async getMarketPlugins(params) {
        return this.client.get('api/market/plugins', {
            searchParams: params
        }).json();
    }
    /**
   * 检查插件更新
   */ async checkUpdates(installed) {
        return this.client.post('api/plugins/check-updates', {
            json: {
                installed
            }
        }).json();
    }
    // ==================== WebSocket 连接 ====================
    /**
   * 创建 WebSocket 连接（用于实时日志流）
   */ createWebSocket(path) {
        const wsUrl = this.baseUrl.replace(/^http/, 'ws') + path;
        return new WebSocket(wsUrl);
    }
    /**
   * 监听插件日志流
   */ subscribePluginLogs(pluginId, callback) {
        const ws = this.createWebSocket(`/ws/plugins/${pluginId}/logs`);
        ws.onmessage = (event)=>{
            try {
                const log = JSON.parse(event.data);
                callback(log);
            } catch (error) {
                console.error('Failed to parse log message:', error);
            }
        };
        ws.onerror = (error)=>{
            console.error('WebSocket error:', error);
        };
        // 返回清理函数
        return ()=>{
            ws.close();
        };
    }
}
function createAgentClient(options) {
    return new AgentClient(options);
}
}),
"[project]/packages/sdk/src/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * @booltox/sdk
 *
 * BoolTox 前端 SDK
 * 用于 Web 前端连接和调用 Agent API
 */ // 导出类型
__turbopack_context__.s([
    "SDK_VERSION",
    ()=>SDK_VERSION
]);
// 导出核心功能
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$detector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/sdk/src/agent-detector.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/sdk/src/agent-client.ts [app-ssr] (ecmascript)");
;
;
const SDK_VERSION = '0.1.0';
}),
"[project]/packages/web/hooks/use-agent.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAgent",
    ()=>useAgent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/sdk/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$detector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/sdk/src/agent-detector.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/sdk/src/agent-client.ts [app-ssr] (ecmascript)");
'use client';
;
;
function useAgent() {
    const [agentInfo, setAgentInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        available: false,
        url: 'http://localhost:9527'
    });
    const [client, setClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isDetecting, setIsDetecting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // 创建探测器
        const detector = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$detector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AgentDetector"]({
            urls: [
                ("TURBOPACK compile-time value", "http://localhost:9527") || 'http://localhost:9527'
            ],
            timeout: 3000,
            autoRetry: true,
            retryInterval: 5000
        });
        // 监听状态变化
        detector.on((info)=>{
            setAgentInfo(info);
            setIsDetecting(false);
            // 创建或销毁客户端
            if (info.available && !client) {
                setClient(new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AgentClient"]({
                    baseUrl: info.url
                }));
            } else if (!info.available && client) {
                setClient(null);
            }
        });
        // 启动自动检测
        detector.startAutoDetect();
        // 清理
        return ()=>{
            detector.destroy();
        };
    }, []);
    // 手动重新检测
    const redetect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setIsDetecting(true);
        const detector = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$detector$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AgentDetector"]({
            autoRetry: false
        });
        const info = await detector.detect();
        setAgentInfo(info);
        setIsDetecting(false);
        if (info.available) {
            setClient(new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sdk$2f$src$2f$agent$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AgentClient"]({
                baseUrl: info.url
            }));
        }
    }, []);
    return {
        /** Agent 信息 */ agentInfo,
        /** 是否可用 */ isAvailable: agentInfo.available,
        /** 是否正在检测 */ isDetecting,
        /** API 客户端（仅当 Agent 可用时） */ client,
        /** 手动重新检测 */ redetect
    };
}
}),
"[project]/packages/web/hooks/use-plugins.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePlugins",
    ()=>usePlugins
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$agent$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/web/hooks/use-agent.ts [app-ssr] (ecmascript)");
'use client';
;
;
function usePlugins() {
    const { client, isAvailable } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$agent$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAgent"])();
    const [plugins, setPlugins] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState([]);
    const [isLoading, setIsLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState(true);
    const [error, setError] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState(null);
    // 加载插件列表
    const loadPlugins = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(async ()=>{
        if (!client) {
            setPlugins([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await client.getPlugins();
            setPlugins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load plugins');
            setPlugins([]);
        } finally{
            setIsLoading(false);
        }
    }, [
        client
    ]);
    // 安装插件
    const installPlugin = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(async (source, type, hash)=>{
        if (!client) {
            throw new Error('Agent not connected');
        }
        await client.installPlugin({
            source,
            type,
            hash
        });
        await loadPlugins();
    }, [
        client,
        loadPlugins
    ]);
    // 卸载插件
    const uninstallPlugin = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(async (pluginId)=>{
        if (!client) {
            throw new Error('Agent not connected');
        }
        await client.uninstallPlugin(pluginId);
        await loadPlugins();
    }, [
        client,
        loadPlugins
    ]);
    // 启动插件
    const startPlugin = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(async (pluginId)=>{
        if (!client) {
            throw new Error('Agent not connected');
        }
        await client.startPlugin(pluginId);
        await loadPlugins();
    }, [
        client,
        loadPlugins
    ]);
    // 停止插件
    const stopPlugin = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useCallback(async (pluginId)=>{
        if (!client) {
            throw new Error('Agent not connected');
        }
        await client.stopPlugin(pluginId);
        await loadPlugins();
    }, [
        client,
        loadPlugins
    ]);
    // 初始加载
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useEffect(()=>{
        loadPlugins();
    }, [
        loadPlugins
    ]);
    return {
        plugins,
        isLoading,
        error,
        loadPlugins,
        installPlugin,
        uninstallPlugin,
        startPlugin,
        stopPlugin
    };
}
}),
"[project]/packages/web/components/tools/agent-installer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AgentInstaller",
    ()=>AgentInstaller
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function AgentInstaller() {
    const [platform, setPlatform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('macos');
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const installScripts = {
        macos: `curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/install/macos.sh | bash`,
        windows: `irm https://raw.githubusercontent.com/ByteTrue/BoolTox/main/install/windows.ps1 | iex`,
        linux: `curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/install/linux.sh | bash`
    };
    const copyScript = async ()=>{
        await navigator.clipboard.writeText(installScripts[platform]);
        setCopied(true);
        setTimeout(()=>setCopied(false), 2000);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-2xl mx-auto p-6 border border-warning-200 rounded-2xl bg-warning-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-4 mb-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-6 h-6 text-warning-600",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 31,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-lg font-semibold text-neutral-900 mb-2",
                            children: "需要安装 BoolTox Agent"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-neutral-600 mb-4",
                            children: "此功能需要本地 Agent 提供系统权限支持。安装只需 30 秒，完全开源免费。"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2 mb-4",
                            children: [
                                'macos',
                                'windows',
                                'linux'
                            ].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setPlatform(p),
                                    className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${platform === p ? 'bg-primary-500 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`,
                                    children: p === 'macos' ? 'macOS' : p === 'windows' ? 'Windows' : 'Linux'
                                }, p, false, {
                                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                    lineNumber: 51,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                    className: "p-4 rounded-lg bg-neutral-900 text-neutral-100 text-sm overflow-x-auto font-mono",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        children: installScripts[platform]
                                    }, void 0, false, {
                                        fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                        lineNumber: 68,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                    lineNumber: 67,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: copyScript,
                                    className: "absolute top-2 right-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium transition-all",
                                    children: copied ? '✓ 已复制' : '复制'
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                    lineNumber: 70,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 space-y-2 text-sm text-neutral-600",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-medium",
                                    children: "安装步骤："
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                    lineNumber: 80,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                    className: "list-decimal list-inside space-y-1 ml-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "复制上方命令"
                                        }, void 0, false, {
                                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                            lineNumber: 82,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "打开终端（Terminal / PowerShell）"
                                        }, void 0, false, {
                                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                            lineNumber: 83,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "粘贴并运行命令"
                                        }, void 0, false, {
                                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                            lineNumber: 84,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "等待安装完成（约 30 秒）"
                                        }, void 0, false, {
                                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                            lineNumber: 85,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "刷新此页面"
                                        }, void 0, false, {
                                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                            lineNumber: 86,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                    lineNumber: 81,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 pt-4 border-t border-warning-200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-neutral-600 mb-2",
                                children: [
                                    "或者",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "https://github.com/ByteTrue/BoolTox/releases/latest",
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "text-primary-500 underline hover:text-primary-600",
                                        children: "手动下载安装包"
                                    }, void 0, false, {
                                        fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                        lineNumber: 94,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/packages/web/components/tools/agent-installer.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
"[project]/packages/web/components/tools/plugin-card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PluginCard",
    ()=>PluginCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/square.js [app-ssr] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript) <export default as Download>");
'use client';
;
;
function PluginCard({ plugin, onStart, onStop, onUninstall, isLoading = false }) {
    const isRunning = plugin.status === 'running';
    const isOfficial = plugin.manifest.id.startsWith('com.booltox.');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 border border-neutral-200 rounded-2xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-200 ease-apple",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold",
                                children: plugin.manifest.name[0]
                            }, void 0, false, {
                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                lineNumber: 31,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "font-semibold text-neutral-900 flex items-center gap-2",
                                        children: [
                                            plugin.manifest.name,
                                            plugin.isDev && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded",
                                                children: "开发中"
                                            }, void 0, false, {
                                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                                lineNumber: 40,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                        lineNumber: 37,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-neutral-500",
                                        children: [
                                            "v",
                                            plugin.version
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    isOfficial ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "px-2 py-1 text-xs font-medium bg-success-100 text-success-600 rounded-md",
                        children: "✓ 已验证"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 51,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "px-2 py-1 text-xs font-medium bg-warning-100 text-warning-600 rounded-md",
                        children: "⚠ 未验证"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 55,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-neutral-600 mb-4 line-clamp-2",
                children: plugin.manifest.description
            }, void 0, false, {
                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 mb-4 text-xs text-neutral-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: plugin.manifest.author
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "•"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: plugin.mode === 'webview' ? 'Web' : '独立应用'
                    }, void 0, false, {
                        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    plugin.manifest.runtime?.backend && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "•"
                            }, void 0, false, {
                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "capitalize",
                                children: plugin.manifest.runtime.backend.type
                            }, void 0, false, {
                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: plugin.installed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        isRunning ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onStop?.(plugin.id),
                            disabled: isLoading,
                            className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-warning-100 text-warning-700 text-sm font-medium hover:bg-warning-200 transition-all disabled:opacity-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "停止"
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                    lineNumber: 91,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                            lineNumber: 85,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onStart?.(plugin.id),
                            disabled: isLoading,
                            className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                    lineNumber: 99,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "启动"
                                }, void 0, false, {
                                    fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                    lineNumber: 100,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                            lineNumber: 94,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onUninstall?.(plugin.id),
                            disabled: isLoading || isRunning,
                            className: "px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-all disabled:opacity-50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                                lineNumber: 110,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                            lineNumber: 105,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    disabled: isLoading,
                    className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                            lineNumber: 118,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "安装"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                    lineNumber: 114,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/packages/web/components/tools/plugin-card.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
}),
"[project]/packages/web/app/(tools)/tools/market/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PluginMarketPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$agent$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/web/hooks/use-agent.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$plugins$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/web/hooks/use-plugins.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$components$2f$tools$2f$agent$2d$installer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/web/components/tools/agent-installer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$components$2f$tools$2f$plugin$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/web/components/tools/plugin-card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
'use client';
;
;
;
;
;
;
;
function PluginMarketPage() {
    const { isAvailable } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$agent$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAgent"])();
    const { plugins, isLoading, error, loadPlugins, startPlugin, stopPlugin, uninstallPlugin } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$hooks$2f$use$2d$plugins$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePlugins"])();
    const [filter, setFilter] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState('all');
    const [actionLoading, setActionLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useState(null);
    // 过滤插件
    const filteredPlugins = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useMemo(()=>{
        if (filter === 'all') return plugins;
        if (filter === 'official') {
            return plugins.filter((p)=>p.manifest.id.startsWith('com.booltox.'));
        }
        return plugins.filter((p)=>!p.manifest.id.startsWith('com.booltox.'));
    }, [
        plugins,
        filter
    ]);
    // 处理启动
    const handleStart = async (pluginId)=>{
        setActionLoading(pluginId);
        try {
            await startPlugin(pluginId);
        } catch (err) {
            console.error('Start failed:', err);
            alert(err instanceof Error ? err.message : '启动失败');
        } finally{
            setActionLoading(null);
        }
    };
    // 处理停止
    const handleStop = async (pluginId)=>{
        setActionLoading(pluginId);
        try {
            await stopPlugin(pluginId);
        } catch (err) {
            console.error('Stop failed:', err);
            alert(err instanceof Error ? err.message : '停止失败');
        } finally{
            setActionLoading(null);
        }
    };
    // 处理卸载
    const handleUninstall = async (pluginId)=>{
        if (!confirm('确定要卸载此插件吗？')) {
            return;
        }
        setActionLoading(pluginId);
        try {
            await uninstallPlugin(pluginId);
        } catch (err) {
            console.error('Uninstall failed:', err);
            alert(err instanceof Error ? err.message : '卸载失败');
        } finally{
            setActionLoading(null);
        }
    };
    // Agent 未安装
    if (!isAvailable) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold text-neutral-900 mb-2",
                            children: "插件市场"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                            lineNumber: 81,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-neutral-600",
                            children: "发现更多强大的工具插件"
                        }, void 0, false, {
                            fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$components$2f$tools$2f$agent$2d$installer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AgentInstaller"], {}, void 0, false, {
                    fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                    lineNumber: 84,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold text-neutral-900 mb-2",
                                children: "插件市场"
                            }, void 0, false, {
                                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-neutral-600",
                                children: "发现更多强大的工具插件"
                            }, void 0, false, {
                                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: loadPlugins,
                        disabled: isLoading,
                        className: "flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-all disabled:opacity-50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                size: 16,
                                className: isLoading ? 'animate-spin' : ''
                            }, void 0, false, {
                                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "刷新"
                            }, void 0, false, {
                                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setFilter('all'),
                        className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary-500 text-white' : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`,
                        children: [
                            "全部 (",
                            plugins.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setFilter('official'),
                        className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'official' ? 'bg-primary-500 text-white' : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`,
                        children: "官方插件"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setFilter('community'),
                        className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'community' ? 'bg-primary-500 text-white' : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`,
                        children: "社区插件"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 border border-error-200 rounded-xl bg-error-50 text-error-700",
                children: error
            }, void 0, false, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 145,
                columnNumber: 9
            }, this),
            isLoading && plugins.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-neutral-600",
                        children: "加载插件列表..."
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this),
            !isLoading && filteredPlugins.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-neutral-600 mb-2",
                        children: "暂无插件"
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-neutral-500",
                        children: filter === 'all' ? '还没有安装任何插件' : '此分类下暂无插件'
                    }, void 0, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 162,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                children: filteredPlugins.map((plugin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$web$2f$components$2f$tools$2f$plugin$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PluginCard"], {
                        plugin: plugin,
                        onStart: handleStart,
                        onStop: handleStop,
                        onUninstall: handleUninstall,
                        isLoading: actionLoading === plugin.id
                    }, plugin.id, false, {
                        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/packages/web/app/(tools)/tools/market/page.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/HTTPError.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTTPError",
    ()=>HTTPError
]);
class HTTPError extends Error {
    response;
    request;
    options;
    constructor(response, request, options){
        const code = response.status || response.status === 0 ? response.status : '';
        const title = response.statusText ?? '';
        const status = `${code} ${title}`.trim();
        const reason = status ? `status code ${status}` : 'an unknown error';
        super(`Request failed with ${reason}: ${request.method} ${request.url}`);
        this.name = 'HTTPError';
        this.response = response;
        this.request = request;
        this.options = options;
    }
} //# sourceMappingURL=HTTPError.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/NonError.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
Wrapper for non-Error values that were thrown.

In JavaScript, any value can be thrown (not just Error instances). This class wraps such values to ensure consistent error handling.
*/ __turbopack_context__.s([
    "NonError",
    ()=>NonError
]);
class NonError extends Error {
    name = 'NonError';
    value;
    constructor(value){
        let message = 'Non-error value was thrown';
        // Intentionally minimal as this error is just an edge-case.
        try {
            if (typeof value === 'string') {
                message = value;
            } else if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
                message = value.message;
            }
        } catch  {
        // Use default message if accessing properties throws
        }
        super(message);
        this.value = value;
    }
} //# sourceMappingURL=NonError.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/ForceRetryError.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ForceRetryError",
    ()=>ForceRetryError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$NonError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/NonError.js [app-ssr] (ecmascript)");
;
class ForceRetryError extends Error {
    name = 'ForceRetryError';
    customDelay;
    code;
    customRequest;
    constructor(options){
        // Runtime protection: wrap non-Error causes in NonError
        // TypeScript type is Error for guidance, but JS users can pass anything
        const cause = options?.cause ? options.cause instanceof Error ? options.cause : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$NonError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NonError"](options.cause) : undefined;
        super(options?.code ? `Forced retry: ${options.code}` : 'Forced retry', cause ? {
            cause
        } : undefined);
        this.customDelay = options?.delay;
        this.code = options?.code;
        this.customRequest = options?.request;
    }
} //# sourceMappingURL=ForceRetryError.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RetryMarker",
    ()=>RetryMarker,
    "kyOptionKeys",
    ()=>kyOptionKeys,
    "maxSafeTimeout",
    ()=>maxSafeTimeout,
    "requestMethods",
    ()=>requestMethods,
    "requestOptionsRegistry",
    ()=>requestOptionsRegistry,
    "responseTypes",
    ()=>responseTypes,
    "retry",
    ()=>retry,
    "stop",
    ()=>stop,
    "supportsAbortController",
    ()=>supportsAbortController,
    "supportsAbortSignal",
    ()=>supportsAbortSignal,
    "supportsFormData",
    ()=>supportsFormData,
    "supportsRequestStreams",
    ()=>supportsRequestStreams,
    "supportsResponseStreams",
    ()=>supportsResponseStreams,
    "usualFormBoundarySize",
    ()=>usualFormBoundarySize,
    "vendorSpecificOptions",
    ()=>vendorSpecificOptions
]);
const supportsRequestStreams = (()=>{
    let duplexAccessed = false;
    let hasContentType = false;
    const supportsReadableStream = typeof globalThis.ReadableStream === 'function';
    const supportsRequest = typeof globalThis.Request === 'function';
    if (supportsReadableStream && supportsRequest) {
        try {
            hasContentType = new globalThis.Request('https://empty.invalid', {
                body: new globalThis.ReadableStream(),
                method: 'POST',
                // @ts-expect-error - Types are outdated.
                get duplex () {
                    duplexAccessed = true;
                    return 'half';
                }
            }).headers.has('Content-Type');
        } catch (error) {
            // QQBrowser on iOS throws "unsupported BodyInit type" error (see issue #581)
            if (error instanceof Error && error.message === 'unsupported BodyInit type') {
                return false;
            }
            throw error;
        }
    }
    return duplexAccessed && !hasContentType;
})();
const supportsAbortController = typeof globalThis.AbortController === 'function';
const supportsAbortSignal = typeof globalThis.AbortSignal === 'function' && typeof globalThis.AbortSignal.any === 'function';
const supportsResponseStreams = typeof globalThis.ReadableStream === 'function';
const supportsFormData = typeof globalThis.FormData === 'function';
const requestMethods = [
    'get',
    'post',
    'put',
    'patch',
    'head',
    'delete'
];
const validate = ()=>undefined;
validate();
const responseTypes = {
    json: 'application/json',
    text: 'text/*',
    formData: 'multipart/form-data',
    arrayBuffer: '*/*',
    blob: '*/*',
    // Supported in modern Fetch implementations (for example, browsers and recent Node.js/undici).
    // We still feature-check at runtime before exposing the shortcut.
    bytes: '*/*'
};
const maxSafeTimeout = 2_147_483_647;
const usualFormBoundarySize = new TextEncoder().encode('------WebKitFormBoundaryaxpyiPgbbPti10Rw').length;
const stop = Symbol('stop');
class RetryMarker {
    options;
    constructor(options){
        this.options = options;
    }
}
const retry = (options)=>new RetryMarker(options);
const kyOptionKeys = {
    json: true,
    parseJson: true,
    stringifyJson: true,
    searchParams: true,
    prefixUrl: true,
    retry: true,
    timeout: true,
    hooks: true,
    throwHttpErrors: true,
    onDownloadProgress: true,
    onUploadProgress: true,
    fetch: true,
    context: true
};
const vendorSpecificOptions = {
    next: true
};
const requestOptionsRegistry = {
    method: true,
    headers: true,
    body: true,
    mode: true,
    credentials: true,
    cache: true,
    redirect: true,
    referrer: true,
    referrerPolicy: true,
    integrity: true,
    keepalive: true,
    signal: true,
    window: true,
    duplex: true
}; //# sourceMappingURL=constants.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/body.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBodySize",
    ()=>getBodySize,
    "streamRequest",
    ()=>streamRequest,
    "streamResponse",
    ()=>streamResponse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
;
const getBodySize = (body)=>{
    if (!body) {
        return 0;
    }
    if (body instanceof FormData) {
        // This is an approximation, as FormData size calculation is not straightforward
        let size = 0;
        for (const [key, value] of body){
            size += __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usualFormBoundarySize"];
            size += new TextEncoder().encode(`Content-Disposition: form-data; name="${key}"`).length;
            size += typeof value === 'string' ? new TextEncoder().encode(value).length : value.size;
        }
        return size;
    }
    if (body instanceof Blob) {
        return body.size;
    }
    if (body instanceof ArrayBuffer) {
        return body.byteLength;
    }
    if (typeof body === 'string') {
        return new TextEncoder().encode(body).length;
    }
    if (body instanceof URLSearchParams) {
        return new TextEncoder().encode(body.toString()).length;
    }
    if ('byteLength' in body) {
        return body.byteLength;
    }
    if (typeof body === 'object' && body !== null) {
        try {
            const jsonString = JSON.stringify(body);
            return new TextEncoder().encode(jsonString).length;
        } catch  {
            return 0;
        }
    }
    return 0; // Default case, unable to determine size
};
const withProgress = (stream, totalBytes, onProgress)=>{
    let previousChunk;
    let transferredBytes = 0;
    return stream.pipeThrough(new TransformStream({
        transform (currentChunk, controller) {
            controller.enqueue(currentChunk);
            if (previousChunk) {
                transferredBytes += previousChunk.byteLength;
                let percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
                // Avoid reporting 100% progress before the stream is actually finished (in case totalBytes is inaccurate)
                if (percent >= 1) {
                    // Epsilon is used here to get as close as possible to 100% without reaching it.
                    // If we were to use 0.99 here, percent could potentially go backwards.
                    percent = 1 - Number.EPSILON;
                }
                onProgress?.({
                    percent,
                    totalBytes: Math.max(totalBytes, transferredBytes),
                    transferredBytes
                }, previousChunk);
            }
            previousChunk = currentChunk;
        },
        flush () {
            if (previousChunk) {
                transferredBytes += previousChunk.byteLength;
                onProgress?.({
                    percent: 1,
                    totalBytes: Math.max(totalBytes, transferredBytes),
                    transferredBytes
                }, previousChunk);
            }
        }
    }));
};
const streamResponse = (response, onDownloadProgress)=>{
    if (!response.body) {
        return response;
    }
    if (response.status === 204) {
        return new Response(null, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }
    const totalBytes = Math.max(0, Number(response.headers.get('content-length')) || 0);
    return new Response(withProgress(response.body, totalBytes, onDownloadProgress), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
};
const streamRequest = (request, onUploadProgress, originalBody)=>{
    if (!request.body) {
        return request;
    }
    // Use original body for size calculation since request.body is already a stream
    const totalBytes = getBodySize(originalBody ?? request.body);
    return new Request(request, {
        // @ts-expect-error - Types are outdated.
        duplex: 'half',
        body: withProgress(request.body, totalBytes, onUploadProgress)
    });
}; //# sourceMappingURL=body.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/is.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// eslint-disable-next-line @typescript-eslint/ban-types
__turbopack_context__.s([
    "isObject",
    ()=>isObject
]);
const isObject = (value)=>value !== null && typeof value === 'object'; //# sourceMappingURL=is.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/merge.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deepMerge",
    ()=>deepMerge,
    "mergeHeaders",
    ()=>mergeHeaders,
    "mergeHooks",
    ()=>mergeHooks,
    "validateAndMerge",
    ()=>validateAndMerge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/is.js [app-ssr] (ecmascript)");
;
;
const validateAndMerge = (...sources)=>{
    for (const source of sources){
        if ((!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(source) || Array.isArray(source)) && source !== undefined) {
            throw new TypeError('The `options` argument must be an object');
        }
    }
    return deepMerge({}, ...sources);
};
const mergeHeaders = (source1 = {}, source2 = {})=>{
    const result = new globalThis.Headers(source1);
    const isHeadersInstance = source2 instanceof globalThis.Headers;
    const source = new globalThis.Headers(source2);
    for (const [key, value] of source.entries()){
        if (isHeadersInstance && value === 'undefined' || value === undefined) {
            result.delete(key);
        } else {
            result.set(key, value);
        }
    }
    return result;
};
function newHookValue(original, incoming, property) {
    return Object.hasOwn(incoming, property) && incoming[property] === undefined ? [] : deepMerge(original[property] ?? [], incoming[property] ?? []);
}
const mergeHooks = (original = {}, incoming = {})=>({
        beforeRequest: newHookValue(original, incoming, 'beforeRequest'),
        beforeRetry: newHookValue(original, incoming, 'beforeRetry'),
        afterResponse: newHookValue(original, incoming, 'afterResponse'),
        beforeError: newHookValue(original, incoming, 'beforeError')
    });
const appendSearchParameters = (target, source)=>{
    const result = new URLSearchParams();
    for (const input of [
        target,
        source
    ]){
        if (input === undefined) {
            continue;
        }
        if (input instanceof URLSearchParams) {
            for (const [key, value] of input.entries()){
                result.append(key, value);
            }
        } else if (Array.isArray(input)) {
            for (const pair of input){
                if (!Array.isArray(pair) || pair.length !== 2) {
                    throw new TypeError('Array search parameters must be provided in [[key, value], ...] format');
                }
                result.append(String(pair[0]), String(pair[1]));
            }
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(input)) {
            for (const [key, value] of Object.entries(input)){
                if (value !== undefined) {
                    result.append(key, String(value));
                }
            }
        } else {
            // String
            const parameters = new URLSearchParams(input);
            for (const [key, value] of parameters.entries()){
                result.append(key, value);
            }
        }
    }
    return result;
};
const deepMerge = (...sources)=>{
    let returnValue = {};
    let headers = {};
    let hooks = {};
    let searchParameters;
    const signals = [];
    for (const source of sources){
        if (Array.isArray(source)) {
            if (!Array.isArray(returnValue)) {
                returnValue = [];
            }
            returnValue = [
                ...returnValue,
                ...source
            ];
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(source)) {
            for (let [key, value] of Object.entries(source)){
                // Special handling for AbortSignal instances
                if (key === 'signal' && value instanceof globalThis.AbortSignal) {
                    signals.push(value);
                    continue;
                }
                // Special handling for context - shallow merge only
                if (key === 'context') {
                    if (value !== undefined && value !== null && (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(value) || Array.isArray(value))) {
                        throw new TypeError('The `context` option must be an object');
                    }
                    // Shallow merge: always create a new object to prevent mutation bugs
                    returnValue = {
                        ...returnValue,
                        context: value === undefined || value === null ? {} : {
                            ...returnValue.context,
                            ...value
                        }
                    };
                    continue;
                }
                // Special handling for searchParams
                if (key === 'searchParams') {
                    if (value === undefined || value === null) {
                        // Explicit undefined or null removes searchParams
                        searchParameters = undefined;
                    } else {
                        // First source: keep as-is to preserve type (string/object/URLSearchParams)
                        // Subsequent sources: merge and convert to URLSearchParams
                        searchParameters = searchParameters === undefined ? value : appendSearchParameters(searchParameters, value);
                    }
                    continue;
                }
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(value) && key in returnValue) {
                    value = deepMerge(returnValue[key], value);
                }
                returnValue = {
                    ...returnValue,
                    [key]: value
                };
            }
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(source.hooks)) {
                hooks = mergeHooks(hooks, source.hooks);
                returnValue.hooks = hooks;
            }
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$is$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isObject"])(source.headers)) {
                headers = mergeHeaders(headers, source.headers);
                returnValue.headers = headers;
            }
        }
    }
    if (searchParameters !== undefined) {
        returnValue.searchParams = searchParameters;
    }
    if (signals.length > 0) {
        if (signals.length === 1) {
            returnValue.signal = signals[0];
        } else if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsAbortSignal"]) {
            returnValue.signal = AbortSignal.any(signals);
        } else {
            // When AbortSignal.any is not available, use the last signal
            // This maintains the previous behavior before signal merging was added
            // This can be remove when the `supportsAbortSignal` check is removed.`
            returnValue.signal = signals.at(-1);
        }
    }
    if (returnValue.context === undefined) {
        returnValue.context = {};
    }
    return returnValue;
}; //# sourceMappingURL=merge.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/normalize.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizeRequestMethod",
    ()=>normalizeRequestMethod,
    "normalizeRetryOptions",
    ()=>normalizeRetryOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
;
const normalizeRequestMethod = (input)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestMethods"].includes(input) ? input.toUpperCase() : input;
const retryMethods = [
    'get',
    'put',
    'head',
    'delete',
    'options',
    'trace'
];
const retryStatusCodes = [
    408,
    413,
    429,
    500,
    502,
    503,
    504
];
const retryAfterStatusCodes = [
    413,
    429,
    503
];
const defaultRetryOptions = {
    limit: 2,
    methods: retryMethods,
    statusCodes: retryStatusCodes,
    afterStatusCodes: retryAfterStatusCodes,
    maxRetryAfter: Number.POSITIVE_INFINITY,
    backoffLimit: Number.POSITIVE_INFINITY,
    delay: (attemptCount)=>0.3 * 2 ** (attemptCount - 1) * 1000,
    jitter: undefined,
    retryOnTimeout: false
};
const normalizeRetryOptions = (retry = {})=>{
    if (typeof retry === 'number') {
        return {
            ...defaultRetryOptions,
            limit: retry
        };
    }
    if (retry.methods && !Array.isArray(retry.methods)) {
        throw new Error('retry.methods must be an array');
    }
    if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
        throw new Error('retry.statusCodes must be an array');
    }
    return {
        ...defaultRetryOptions,
        ...retry
    };
}; //# sourceMappingURL=normalize.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/TimeoutError.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TimeoutError",
    ()=>TimeoutError
]);
class TimeoutError extends Error {
    request;
    constructor(request){
        super(`Request timed out: ${request.method} ${request.url}`);
        this.name = 'TimeoutError';
        this.request = request;
    }
} //# sourceMappingURL=TimeoutError.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/timeout.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>timeout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$TimeoutError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/TimeoutError.js [app-ssr] (ecmascript)");
;
async function timeout(request, init, abortController, options) {
    return new Promise((resolve, reject)=>{
        const timeoutId = setTimeout(()=>{
            if (abortController) {
                abortController.abort();
            }
            reject(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$TimeoutError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TimeoutError"](request));
        }, options.timeout);
        void options.fetch(request, init).then(resolve).catch(reject).then(()=>{
            clearTimeout(timeoutId);
        });
    });
} //# sourceMappingURL=timeout.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/delay.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// https://github.com/sindresorhus/delay/tree/ab98ae8dfcb38e1593286c94d934e70d14a4e111
__turbopack_context__.s([
    "default",
    ()=>delay
]);
async function delay(ms, { signal }) {
    return new Promise((resolve, reject)=>{
        if (signal) {
            signal.throwIfAborted();
            signal.addEventListener('abort', abortHandler, {
                once: true
            });
        }
        function abortHandler() {
            clearTimeout(timeoutId);
            reject(signal.reason);
        }
        const timeoutId = setTimeout(()=>{
            signal?.removeEventListener('abort', abortHandler);
            resolve();
        }, ms);
    });
} //# sourceMappingURL=delay.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/options.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findUnknownOptions",
    ()=>findUnknownOptions,
    "hasSearchParameters",
    ()=>hasSearchParameters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
;
const findUnknownOptions = (request, options)=>{
    const unknownOptions = {};
    for(const key in options){
        // Skip inherited properties
        if (!Object.hasOwn(options, key)) {
            continue;
        }
        // An option is passed to fetch() if:
        // 1. It's not a standard RequestInit option (not in requestOptionsRegistry)
        // 2. It's not a ky-specific option (not in kyOptionKeys)
        // 3. Either:
        //    a. It's not on the Request object, OR
        //    b. It's a vendor-specific option that should always be passed (in vendorSpecificOptions)
        if (!(key in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestOptionsRegistry"]) && !(key in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["kyOptionKeys"]) && (!(key in request) || key in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["vendorSpecificOptions"])) {
            unknownOptions[key] = options[key];
        }
    }
    return unknownOptions;
};
const hasSearchParameters = (search)=>{
    if (search === undefined) {
        return false;
    }
    // The `typeof array` still gives "object", so we need different checking for array.
    if (Array.isArray(search)) {
        return search.length > 0;
    }
    if (search instanceof URLSearchParams) {
        return search.size > 0;
    }
    // Record
    if (typeof search === 'object') {
        return Object.keys(search).length > 0;
    }
    if (typeof search === 'string') {
        return search.trim().length > 0;
    }
    return Boolean(search);
}; //# sourceMappingURL=options.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/type-guards.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isForceRetryError",
    ()=>isForceRetryError,
    "isHTTPError",
    ()=>isHTTPError,
    "isKyError",
    ()=>isKyError,
    "isTimeoutError",
    ()=>isTimeoutError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$HTTPError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/HTTPError.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$TimeoutError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/TimeoutError.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/ForceRetryError.js [app-ssr] (ecmascript)");
;
;
;
function isKyError(error) {
    return isHTTPError(error) || isTimeoutError(error);
}
function isHTTPError(error) {
    return error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$HTTPError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTTPError"] || error?.name === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$HTTPError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTTPError"].name;
}
function isTimeoutError(error) {
    return error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$TimeoutError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TimeoutError"] || error?.name === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$TimeoutError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TimeoutError"].name;
}
function isForceRetryError(error) {
    return error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForceRetryError"] || error?.name === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForceRetryError"].name;
} //# sourceMappingURL=type-guards.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/Ky.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ky",
    ()=>Ky
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$HTTPError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/HTTPError.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$NonError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/NonError.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/errors/ForceRetryError.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$body$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/body.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/merge.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$normalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/normalize.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$timeout$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/timeout.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$delay$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/delay.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$options$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/options.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$type$2d$guards$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/type-guards.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
class Ky {
    static create(input, options) {
        const ky = new Ky(input, options);
        const function_ = async ()=>{
            if (typeof ky.#options.timeout === 'number' && ky.#options.timeout > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxSafeTimeout"]) {
                throw new RangeError(`The \`timeout\` option cannot be greater than ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxSafeTimeout"]}`);
            }
            // Delay the fetch so that body method shortcuts can set the Accept header
            await Promise.resolve();
            // Before using ky.request, _fetch clones it and saves the clone for future retries to use.
            // If retry is not needed, close the cloned request's ReadableStream for memory safety.
            let response = await ky.#fetch();
            for (const hook of ky.#options.hooks.afterResponse){
                // Clone the response before passing to hook so we can cancel it if needed
                const clonedResponse = ky.#decorateResponse(response.clone());
                // eslint-disable-next-line no-await-in-loop
                const modifiedResponse = await hook(ky.request, ky.#getNormalizedOptions(), clonedResponse, {
                    retryCount: ky.#retryCount
                });
                if (modifiedResponse instanceof globalThis.Response) {
                    response = modifiedResponse;
                }
                if (modifiedResponse instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RetryMarker"]) {
                    // Cancel both the cloned response passed to the hook and the current response
                    // to prevent resource leaks (especially important in Deno/Bun)
                    // eslint-disable-next-line no-await-in-loop
                    await Promise.all([
                        clonedResponse.body?.cancel(),
                        response.body?.cancel()
                    ]);
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForceRetryError"](modifiedResponse.options);
                }
            }
            ky.#decorateResponse(response);
            if (!response.ok && (typeof ky.#options.throwHttpErrors === 'function' ? ky.#options.throwHttpErrors(response.status) : ky.#options.throwHttpErrors)) {
                let error = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$HTTPError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTTPError"](response, ky.request, ky.#getNormalizedOptions());
                for (const hook of ky.#options.hooks.beforeError){
                    // eslint-disable-next-line no-await-in-loop
                    error = await hook(error, {
                        retryCount: ky.#retryCount
                    });
                }
                throw error;
            }
            // If `onDownloadProgress` is passed, it uses the stream API internally
            if (ky.#options.onDownloadProgress) {
                if (typeof ky.#options.onDownloadProgress !== 'function') {
                    throw new TypeError('The `onDownloadProgress` option must be a function');
                }
                if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsResponseStreams"]) {
                    throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
                }
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$body$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["streamResponse"])(response.clone(), ky.#options.onDownloadProgress);
            }
            return response;
        };
        // Always wrap in #retry to catch forced retries from afterResponse hooks
        // Method retriability is checked in #calculateRetryDelay for non-forced retries
        const result = ky.#retry(function_).finally(async ()=>{
            const originalRequest = ky.#originalRequest;
            const cleanupPromises = [];
            if (originalRequest && !originalRequest.bodyUsed) {
                cleanupPromises.push(originalRequest.body?.cancel());
            }
            if (!ky.request.bodyUsed) {
                cleanupPromises.push(ky.request.body?.cancel());
            }
            await Promise.all(cleanupPromises);
        });
        for (const [type, mimeType] of Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["responseTypes"])){
            // Only expose `.bytes()` when the environment implements it.
            if (type === 'bytes' && typeof globalThis.Response?.prototype?.bytes !== 'function') {
                continue;
            }
            result[type] = async ()=>{
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                ky.request.headers.set('accept', ky.request.headers.get('accept') || mimeType);
                const response = await result;
                if (type === 'json') {
                    if (response.status === 204) {
                        return '';
                    }
                    const text = await response.text();
                    if (text === '') {
                        return '';
                    }
                    if (options.parseJson) {
                        return options.parseJson(text);
                    }
                    return JSON.parse(text);
                }
                return response[type]();
            };
        }
        return result;
    }
    // eslint-disable-next-line unicorn/prevent-abbreviations
    static #normalizeSearchParams(searchParams) {
        // Filter out undefined values from plain objects
        if (searchParams && typeof searchParams === 'object' && !Array.isArray(searchParams) && !(searchParams instanceof URLSearchParams)) {
            return Object.fromEntries(Object.entries(searchParams).filter(([, value])=>value !== undefined));
        }
        return searchParams;
    }
    request;
    #abortController;
    #retryCount = 0;
    // eslint-disable-next-line @typescript-eslint/prefer-readonly -- False positive: #input is reassigned on line 202
    #input;
    #options;
    #originalRequest;
    #userProvidedAbortSignal;
    #cachedNormalizedOptions;
    // eslint-disable-next-line complexity
    constructor(input, options = {}){
        this.#input = input;
        this.#options = {
            ...options,
            headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeHeaders"])(this.#input.headers, options.headers),
            hooks: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeHooks"])({
                beforeRequest: [],
                beforeRetry: [],
                beforeError: [],
                afterResponse: []
            }, options.hooks),
            method: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$normalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeRequestMethod"])(options.method ?? this.#input.method ?? 'GET'),
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            prefixUrl: String(options.prefixUrl || ''),
            retry: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$normalize$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeRetryOptions"])(options.retry),
            throwHttpErrors: options.throwHttpErrors ?? true,
            timeout: options.timeout ?? 10_000,
            fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
            context: options.context ?? {}
        };
        if (typeof this.#input !== 'string' && !(this.#input instanceof URL || this.#input instanceof globalThis.Request)) {
            throw new TypeError('`input` must be a string, URL, or Request');
        }
        if (this.#options.prefixUrl && typeof this.#input === 'string') {
            if (this.#input.startsWith('/')) {
                throw new Error('`input` must not begin with a slash when using `prefixUrl`');
            }
            if (!this.#options.prefixUrl.endsWith('/')) {
                this.#options.prefixUrl += '/';
            }
            this.#input = this.#options.prefixUrl + this.#input;
        }
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsAbortController"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsAbortSignal"]) {
            this.#userProvidedAbortSignal = this.#options.signal ?? this.#input.signal;
            this.#abortController = new globalThis.AbortController();
            this.#options.signal = this.#userProvidedAbortSignal ? AbortSignal.any([
                this.#userProvidedAbortSignal,
                this.#abortController.signal
            ]) : this.#abortController.signal;
        }
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsRequestStreams"]) {
            // @ts-expect-error - Types are outdated.
            this.#options.duplex = 'half';
        }
        if (this.#options.json !== undefined) {
            this.#options.body = this.#options.stringifyJson?.(this.#options.json) ?? JSON.stringify(this.#options.json);
            this.#options.headers.set('content-type', this.#options.headers.get('content-type') ?? 'application/json');
        }
        // To provide correct form boundary, Content-Type header should be deleted when creating Request from another Request with FormData/URLSearchParams body
        // Only delete if user didn't explicitly provide a custom content-type
        const userProvidedContentType = options.headers && new globalThis.Headers(options.headers).has('content-type');
        if (this.#input instanceof globalThis.Request && (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsFormData"] && this.#options.body instanceof globalThis.FormData || this.#options.body instanceof URLSearchParams) && !userProvidedContentType) {
            this.#options.headers.delete('content-type');
        }
        this.request = new globalThis.Request(this.#input, this.#options);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$options$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasSearchParameters"])(this.#options.searchParams)) {
            // eslint-disable-next-line unicorn/prevent-abbreviations
            const textSearchParams = typeof this.#options.searchParams === 'string' ? this.#options.searchParams.replace(/^\?/, '') : new URLSearchParams(Ky.#normalizeSearchParams(this.#options.searchParams)).toString();
            // eslint-disable-next-line unicorn/prevent-abbreviations
            const searchParams = '?' + textSearchParams;
            const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
            // Recreate request with the updated URL. We already have all options in this.#options, including duplex.
            this.request = new globalThis.Request(url, this.#options);
        }
        // If `onUploadProgress` is passed, it uses the stream API internally
        if (this.#options.onUploadProgress) {
            if (typeof this.#options.onUploadProgress !== 'function') {
                throw new TypeError('The `onUploadProgress` option must be a function');
            }
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsRequestStreams"]) {
                throw new Error('Request streams are not supported in your environment. The `duplex` option for `Request` is not available.');
            }
            this.request = this.#wrapRequestWithUploadProgress(this.request, this.#options.body ?? undefined);
        }
    }
    #calculateDelay() {
        const retryDelay = this.#options.retry.delay(this.#retryCount);
        let jitteredDelay = retryDelay;
        if (this.#options.retry.jitter === true) {
            jitteredDelay = Math.random() * retryDelay;
        } else if (typeof this.#options.retry.jitter === 'function') {
            jitteredDelay = this.#options.retry.jitter(retryDelay);
            if (!Number.isFinite(jitteredDelay) || jitteredDelay < 0) {
                jitteredDelay = retryDelay;
            }
        }
        return Math.min(this.#options.retry.backoffLimit, jitteredDelay);
    }
    async #calculateRetryDelay(error) {
        this.#retryCount++;
        if (this.#retryCount > this.#options.retry.limit) {
            throw error;
        }
        // Wrap non-Error throws to ensure consistent error handling
        const errorObject = error instanceof Error ? error : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$NonError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NonError"](error);
        // Handle forced retry from afterResponse hook - skip method check and shouldRetry
        if (errorObject instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForceRetryError"]) {
            return errorObject.customDelay ?? this.#calculateDelay();
        }
        // Check if method is retriable for non-forced retries
        if (!this.#options.retry.methods.includes(this.request.method.toLowerCase())) {
            throw error;
        }
        // User-provided shouldRetry function takes precedence over all other checks
        if (this.#options.retry.shouldRetry !== undefined) {
            const result = await this.#options.retry.shouldRetry({
                error: errorObject,
                retryCount: this.#retryCount
            });
            // Strict boolean checking - only exact true/false are handled specially
            if (result === false) {
                throw error;
            }
            if (result === true) {
                // Force retry - skip all other validation and return delay
                return this.#calculateDelay();
            }
        // If undefined or any other value, fall through to default behavior
        }
        // Default timeout behavior
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$type$2d$guards$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isTimeoutError"])(error) && !this.#options.retry.retryOnTimeout) {
            throw error;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$type$2d$guards$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isHTTPError"])(error)) {
            if (!this.#options.retry.statusCodes.includes(error.response.status)) {
                throw error;
            }
            const retryAfter = error.response.headers.get('Retry-After') ?? error.response.headers.get('RateLimit-Reset') ?? error.response.headers.get('X-RateLimit-Retry-After') // Symfony-based services
             ?? error.response.headers.get('X-RateLimit-Reset') // GitHub
             ?? error.response.headers.get('X-Rate-Limit-Reset'); // Twitter
            if (retryAfter && this.#options.retry.afterStatusCodes.includes(error.response.status)) {
                let after = Number(retryAfter) * 1000;
                if (Number.isNaN(after)) {
                    after = Date.parse(retryAfter) - Date.now();
                } else if (after >= Date.parse('2024-01-01')) {
                    // A large number is treated as a timestamp (fixed threshold protects against clock skew)
                    after -= Date.now();
                }
                const max = this.#options.retry.maxRetryAfter ?? after;
                // Don't apply jitter when server provides explicit retry timing
                return after < max ? after : max;
            }
            if (error.response.status === 413) {
                throw error;
            }
        }
        return this.#calculateDelay();
    }
    #decorateResponse(response) {
        if (this.#options.parseJson) {
            response.json = async ()=>this.#options.parseJson(await response.text());
        }
        return response;
    }
    async #retry(function_) {
        try {
            return await function_();
        } catch (error) {
            const ms = Math.min(await this.#calculateRetryDelay(error), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["maxSafeTimeout"]);
            if (this.#retryCount < 1) {
                throw error;
            }
            // Only use user-provided signal for delay, not our internal abortController
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$delay$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(ms, this.#userProvidedAbortSignal ? {
                signal: this.#userProvidedAbortSignal
            } : {});
            // Apply custom request from forced retry before beforeRetry hooks
            // Ensure the custom request has the correct managed signal for timeouts and user aborts
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$errors$2f$ForceRetryError$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForceRetryError"] && error.customRequest) {
                const managedRequest = this.#options.signal ? new globalThis.Request(error.customRequest, {
                    signal: this.#options.signal
                }) : new globalThis.Request(error.customRequest);
                this.#assignRequest(managedRequest);
            }
            for (const hook of this.#options.hooks.beforeRetry){
                // eslint-disable-next-line no-await-in-loop
                const hookResult = await hook({
                    request: this.request,
                    options: this.#getNormalizedOptions(),
                    error: error,
                    retryCount: this.#retryCount
                });
                if (hookResult instanceof globalThis.Request) {
                    this.#assignRequest(hookResult);
                    break;
                }
                // If a Response is returned, use it and skip the retry
                if (hookResult instanceof globalThis.Response) {
                    return hookResult;
                }
                // If `stop` is returned from the hook, the retry process is stopped
                if (hookResult === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stop"]) {
                    return;
                }
            }
            return this.#retry(function_);
        }
    }
    async #fetch() {
        // Reset abortController if it was aborted (happens on timeout retry)
        if (this.#abortController?.signal.aborted) {
            this.#abortController = new globalThis.AbortController();
            this.#options.signal = this.#userProvidedAbortSignal ? AbortSignal.any([
                this.#userProvidedAbortSignal,
                this.#abortController.signal
            ]) : this.#abortController.signal;
            // Recreate request with new signal
            this.request = new globalThis.Request(this.request, {
                signal: this.#options.signal
            });
        }
        for (const hook of this.#options.hooks.beforeRequest){
            // eslint-disable-next-line no-await-in-loop
            const result = await hook(this.request, this.#getNormalizedOptions(), {
                retryCount: this.#retryCount
            });
            if (result instanceof Response) {
                return result;
            }
            if (result instanceof globalThis.Request) {
                this.#assignRequest(result);
                break;
            }
        }
        const nonRequestOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$options$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findUnknownOptions"])(this.request, this.#options);
        // Cloning is done here to prepare in advance for retries
        this.#originalRequest = this.request;
        this.request = this.#originalRequest.clone();
        if (this.#options.timeout === false) {
            return this.#options.fetch(this.#originalRequest, nonRequestOptions);
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$timeout$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(this.#originalRequest, nonRequestOptions, this.#abortController, this.#options);
    }
    #getNormalizedOptions() {
        if (!this.#cachedNormalizedOptions) {
            const { hooks, ...normalizedOptions } = this.#options;
            this.#cachedNormalizedOptions = Object.freeze(normalizedOptions);
        }
        return this.#cachedNormalizedOptions;
    }
    #assignRequest(request) {
        this.#cachedNormalizedOptions = undefined;
        this.request = this.#wrapRequestWithUploadProgress(request);
    }
    #wrapRequestWithUploadProgress(request, originalBody) {
        if (!this.#options.onUploadProgress || !request.body) {
            return request;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$body$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["streamRequest"])(request, this.#options.onUploadProgress, originalBody ?? this.#options.body ?? undefined);
    }
} //# sourceMappingURL=Ky.js.map
}),
"[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/index.js [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/*! MIT License © Sindre Sorhus */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$Ky$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/Ky.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/core/constants.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/ky@1.14.0/node_modules/ky/distribution/utils/merge.js [app-ssr] (ecmascript)");
;
;
;
const createInstance = (defaults)=>{
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const ky = (input, options)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$Ky$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ky"].create(input, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateAndMerge"])(defaults, options));
    for (const method of __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestMethods"]){
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        ky[method] = (input, options)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$Ky$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ky"].create(input, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateAndMerge"])(defaults, options, {
                method
            }));
    }
    ky.create = (newDefaults)=>createInstance((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateAndMerge"])(newDefaults));
    ky.extend = (newDefaults)=>{
        if (typeof newDefaults === 'function') {
            newDefaults = newDefaults(defaults ?? {});
        }
        return createInstance((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$utils$2f$merge$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateAndMerge"])(defaults, newDefaults));
    };
    ky.stop = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stop"];
    ky.retry = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$ky$40$1$2e$14$2e$0$2f$node_modules$2f$ky$2f$distribution$2f$core$2f$constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["retry"];
    return ky;
};
const ky = createInstance();
const __TURBOPACK__default__export__ = ky;
;
;
;
;
 // Intentionally not exporting this for now as it's just an implementation detail and we don't want to commit to a certain API yet at least.
 // export {NonError} from './errors/NonError.js';
 //# sourceMappingURL=index.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "mergeClasses",
    ()=>mergeClasses,
    "toKebabCase",
    ()=>toKebabCase
]);
const toKebabCase = (string)=>string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const mergeClasses = (...classes)=>classes.filter((className, index, array)=>{
        return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
    }).join(" ").trim();
;
 //# sourceMappingURL=utils.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>defaultAttributes
]);
var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};
;
 //# sourceMappingURL=defaultAttributes.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/Icon.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>Icon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-ssr] (ecmascript)");
;
;
;
const Icon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref)=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"])("svg", {
        ref,
        ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeClasses"])("lucide", className),
        ...rest
    }, [
        ...iconNode.map(([tag, attrs])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"])(tag, attrs)),
        ...Array.isArray(children) ? children : [
            children
        ]
    ]);
});
;
 //# sourceMappingURL=Icon.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>createLucideIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.7_react-dom@19.2.0_react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/Icon.js [app-ssr] (ecmascript)");
;
;
;
const createLucideIcon = (iconName, iconNode)=>{
    const Component = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            ref,
            iconNode,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeClasses"])(`lucide-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toKebabCase"])(iconName)}`, className),
            ...props
        }));
    Component.displayName = `${iconName}`;
    return Component;
};
;
 //# sourceMappingURL=createLucideIcon.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>Play
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const Play = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Play", [
    [
        "polygon",
        {
            points: "6 3 20 12 6 21 6 3",
            key: "1oa8hb"
        }
    ]
]);
;
 //# sourceMappingURL=play.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript) <export default as Play>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Play",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/square.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>Square
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const Square = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Square", [
    [
        "rect",
        {
            width: "18",
            height: "18",
            x: "3",
            y: "3",
            rx: "2",
            key: "afitv7"
        }
    ]
]);
;
 //# sourceMappingURL=square.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/square.js [app-ssr] (ecmascript) <export default as Square>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Square",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/square.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>Trash2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const Trash2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Trash2", [
    [
        "path",
        {
            d: "M3 6h18",
            key: "d0wm0j"
        }
    ],
    [
        "path",
        {
            d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",
            key: "4alrt4"
        }
    ],
    [
        "path",
        {
            d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
            key: "v07s0e"
        }
    ],
    [
        "line",
        {
            x1: "10",
            x2: "10",
            y1: "11",
            y2: "17",
            key: "1uufr5"
        }
    ],
    [
        "line",
        {
            x1: "14",
            x2: "14",
            y1: "11",
            y2: "17",
            key: "xtxkd"
        }
    ]
]);
;
 //# sourceMappingURL=trash-2.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Trash2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>Download
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const Download = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("Download", [
    [
        "path",
        {
            d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
            key: "ih7n3h"
        }
    ],
    [
        "polyline",
        {
            points: "7 10 12 15 17 10",
            key: "2ggqvy"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "15",
            y2: "3",
            key: "1vk2je"
        }
    ]
]);
;
 //# sourceMappingURL=download.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript) <export default as Download>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Download",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "default",
    ()=>RefreshCw
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const RefreshCw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("RefreshCw", [
    [
        "path",
        {
            d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
            key: "v9h5vc"
        }
    ],
    [
        "path",
        {
            d: "M21 3v5h-5",
            key: "1q7to0"
        }
    ],
    [
        "path",
        {
            d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
            key: "3uifl3"
        }
    ],
    [
        "path",
        {
            d: "M8 16H3v5",
            key: "1cv678"
        }
    ]
]);
;
 //# sourceMappingURL=refresh-cw.js.map
}),
"[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RefreshCw",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$469$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.469.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript)");
}),
];

//# sourceMappingURL=_1ffbcafd._.js.map