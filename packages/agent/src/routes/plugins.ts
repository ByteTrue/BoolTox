import type { FastifyInstance } from 'fastify';
import { getPluginManager, getPluginInstaller } from '@booltox/core/plugin';

export async function pluginsRoutes(server: FastifyInstance) {
  const pluginManager = getPluginManager();
  const pluginInstaller = getPluginInstaller();

  // 初始化
  await pluginInstaller.init();
  await pluginManager.initialize();

  // 获取所有插件
  server.get('/plugins', async () => {
    const plugins = pluginManager.getAllPlugins();
    return {
      plugins: plugins.map(p => ({
        id: p.id,
        name: p.manifest.name,
        version: p.manifest.version,
        description: p.manifest.description,
        status: p.status,
        mode: p.mode,
        isDev: p.isDev,
        icon: p.manifest.icon,
        author: p.manifest.author,
        permissions: p.manifest.permissions,
      })),
      total: plugins.length,
    };
  });

  // 获取单个插件
  server.get<{ Params: { id: string } }>('/plugins/:id', async (request, reply) => {
    const { id } = request.params;
    const plugin = pluginManager.getPlugin(id);

    if (!plugin) {
      reply.code(404);
      return { error: 'Plugin not found' };
    }

    return {
      id: plugin.id,
      manifest: plugin.manifest,
      status: plugin.status,
      mode: plugin.mode,
      path: plugin.path,
      isDev: plugin.isDev,
    };
  });

  // 安装插件
  server.post<{ Body: { source: string; type: string; hash?: string } }>(
    '/plugins/install',
    async (request, reply) => {
      const { source, type, hash } = request.body;

      try {
        const pluginId = await pluginInstaller.installPlugin({
          source,
          type: type as 'url' | 'local',
          hash,
          onProgress: (progress) => {
            // TODO: 通过 WebSocket 推送进度
            server.log.info(`Install progress: ${progress.message} (${progress.percent}%)`);
          },
        });

        // 重新加载插件列表
        await pluginManager.reloadPlugins();

        return {
          success: true,
          pluginId,
          message: '插件安装成功',
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // 卸载插件
  server.delete<{ Params: { id: string } }>('/plugins/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await pluginInstaller.uninstallPlugin(id);
      await pluginManager.reloadPlugins();

      return {
        success: true,
        message: '插件卸载成功',
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 启动插件
  server.post<{ Params: { id: string } }>('/plugins/:id/start', async (request, reply) => {
    const { id } = request.params;

    // TODO: 实现插件启动逻辑
    reply.code(501);
    return { error: 'Not implemented yet' };
  });

  // 停止插件
  server.post<{ Params: { id: string } }>('/plugins/:id/stop', async (request, reply) => {
    const { id } = request.params;

    // TODO: 实现插件停止逻辑
    reply.code(501);
    return { error: 'Not implemented yet' };
  });

  // 获取插件日志
  server.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/plugins/:id/logs',
    async (request, reply) => {
      const { id } = request.params;
      const { limit } = request.querystring;

      // TODO: 实现插件日志获取
      reply.code(501);
      return { error: 'Not implemented yet' };
    }
  );

  // 重新加载插件列表
  server.post('/plugins/reload', async () => {
    await pluginManager.reloadPlugins();
    return { success: true };
  });
}
