/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 添加工具源页面
 *
 * 支持两种类型：
 * 1. 远程仓库（GitHub/GitLab）
 * 2. 本地目录（源码或二进制）
 *
 * 核心流程：
 * - 用户选择类型并填写基本信息
 * - 系统尝试读取 booltox.json（有则预填，无则空表单）
 * - 用户确认后保存
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';
import { motion } from 'framer-motion';
import { ArrowLeft, Github, FolderOpen } from 'lucide-react';
import type { ToolSourceConfig } from '@booltox/shared';

type SourceType = 'remote' | 'local';

export function AddToolSourcePage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState<'select-type' | 'fill-form'>('select-type');
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);

  const handleSelectType = (type: SourceType) => {
    setSelectedType(type);
    setStep('fill-form');
  };

  const handleBack = () => {
    if (step === 'fill-form') {
      setStep('select-type');
      setSelectedType(null);
    } else {
      navigate('/tools');
    }
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 elegant-scroll">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">添加工具源</h1>
      </div>

      {/* 步骤 1：选择类型 */}
      {step === 'select-type' && (
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500 mb-8 text-center">
            选择要添加的工具源类型
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 远程仓库 */}
            <SourceTypeCard
              icon={<Github size={48} />}
              title="远程仓库"
              description="GitHub/GitLab 仓库，支持 booltox.json 或 booltox-index.json"
              color="blue"
              onClick={() => handleSelectType('remote')}
            />

            {/* 本地目录 */}
            <SourceTypeCard
              icon={<FolderOpen size={48} />}
              title="本地目录"
              description="本地文件夹（源码或二进制），支持 booltox.json 或手动配置"
              color="green"
              onClick={() => handleSelectType('local')}
            />
          </div>
        </div>
      )}

      {/* 步骤 2：填写表单 */}
      {step === 'fill-form' && selectedType && (
        <div className="max-w-2xl mx-auto">
          {selectedType === 'remote' && <RemoteSourceForm onBack={handleBack} onSuccess={() => navigate('/tools')} />}
          {selectedType === 'local' && <LocalSourceForm onBack={handleBack} onSuccess={() => navigate('/tools')} />}
        </div>
      )}
    </div>
  );
}

// 类型选择卡片
interface SourceTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'orange';
  onClick: () => void;
}

function SourceTypeCard({ icon, title, description, color, onClick }: SourceTypeCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`border-2 rounded-xl p-6 text-center transition-all ${colorClasses[color]}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-center mb-4 opacity-70">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </motion.button>
  );
}

// 远程仓库表单
function RemoteSourceForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'github' as 'github' | 'gitlab',
    owner: '',
    repo: '',
    branch: 'main',
    baseUrl: '',
    token: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.owner || !formData.repo || !formData.branch) {
      window.toast?.error('请填写所有必填字段');
      return;
    }

    try {
      const newSource: Omit<ToolSourceConfig, 'id'> = {
        ...formData,
        type: 'remote',
        enabled: true,
        priority: 999, // 添加到最后
      };

      await window.ipc?.invoke('tool-sources:add', newSource);
      window.toast?.success('工具源已添加，正在加载工具...');

      // 等待一下，让缓存失效
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess();
    } catch (error) {
      console.error('Failed to add source:', error);
      window.toast?.error('添加失败');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">添加远程仓库</h2>

      <div>
        <label className="block text-sm font-medium mb-2">工具源名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          placeholder="如：公司内部工具库"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">平台 *</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'github' | 'gitlab' })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">分支 *</label>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="main"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">所有者 *</label>
          <input
            type="text"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="如：ByteTrue"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">仓库名 *</label>
          <input
            type="text"
            value={formData.repo}
            onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="如：my-tools"
            required
          />
        </div>
      </div>

      {formData.provider === 'gitlab' && (
        <div>
          <label className="block text-sm font-medium mb-2">GitLab 服务器地址（可选）</label>
          <input
            type="text"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="https://gitlab.company.com"
          />
          <p className="text-xs text-gray-500 mt-1">留空使用 gitlab.com</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">访问 Token（私有仓库）</label>
        <input
          type="password"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          placeholder="ghp_xxx 或 glpat-xxx"
        />
        <p className="text-xs text-gray-500 mt-1">公开仓库无需填写</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          返回
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加
        </button>
      </div>
    </form>
  );
}

// 本地目录表单（增强版：支持配置检测和生成）
function LocalSourceForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'select-path' | 'configure'>('select-path');
  const [formData, setFormData] = useState({
    sourceName: '',
    localPath: '',
  });
  const [existingConfig, setExistingConfig] = useState<{
    hasBooltoxJson: boolean;
    hasBooltoxIndex: boolean;
    booltoxData?: any;
    indexData?: any;
  } | null>(null);

  const handleSelectPath = async () => {
    const result = await window.ipc?.invoke('dialog:openFile', {
      properties: ['openDirectory'],
    });

    if (result && typeof result === 'string') {
      // 检测配置文件
      const config = await detectToolConfig(result);
      setExistingConfig(config);

      setFormData({
        ...formData,
        localPath: result,
        sourceName: formData.sourceName || result.split(/[/\\]/).pop() || '本地工具',
      });
    }
  };

  const handleNextStep = () => {
    if (!formData.localPath) {
      window.toast?.error('请先选择目录');
      return;
    }
    setStep('configure');
  };

  const handleFinishConfiguration = async () => {
    // 配置向导完成后，添加工具源
    try {
      const newSource: Omit<ToolSourceConfig, 'id'> = {
        name: formData.sourceName,
        type: 'local',
        localPath: formData.localPath,
        enabled: true,
        priority: 999,
      };

      await window.ipc?.invoke('tool-sources:add', newSource);
      window.toast?.success('本地工具源已添加');
      onSuccess();
    } catch (error) {
      console.error('Failed to add source:', error);
      window.toast?.error('添加失败');
    }
  };

  // 第一步：选择路径
  if (step === 'select-path') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">添加本地目录</h2>

        <div>
          <label className="block text-sm font-medium mb-2">工具源名称 *</label>
          <input
            type="text"
            value={formData.sourceName}
            onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="如：我的本地工具"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">本地目录路径 *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.localPath}
              onChange={(e) => setFormData({ ...formData, localPath: e.target.value })}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="E:\Code\MyTool"
            />
            <button
              type="button"
              onClick={handleSelectPath}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              浏览...
            </button>
          </div>
          {existingConfig && (
            <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
              {existingConfig.hasBooltoxIndex && (
                <p className="text-blue-700 dark:text-blue-300">✓ 检测到 booltox-index.json（多工具模式）</p>
              )}
              {existingConfig.hasBooltoxJson && !existingConfig.hasBooltoxIndex && (
                <p className="text-blue-700 dark:text-blue-300">✓ 检测到 booltox.json（单工具模式）</p>
              )}
              {!existingConfig.hasBooltoxJson && !existingConfig.hasBooltoxIndex && (
                <p className="text-yellow-700 dark:text-yellow-300">⚠ 未检测到配置文件，将引导您创建</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            返回
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!formData.localPath}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  // 第二步：配置工具信息
  return (
    <ToolConfigWizard
      localPath={formData.localPath}
      sourceName={formData.sourceName}
      existingConfig={existingConfig}
      onBack={() => setStep('select-path')}
      onFinish={handleFinishConfiguration}
    />
  );
}

// 检测工具配置文件
async function detectToolConfig(localPath: string) {
  try {
    const result = await window.ipc?.invoke('fs:detectToolConfig', localPath);
    return result || { hasBooltoxJson: false, hasBooltoxIndex: false };
  } catch (error) {
    console.error('Failed to detect config:', error);
    return { hasBooltoxJson: false, hasBooltoxIndex: false };
  }
}

// 工具配置向导
interface ToolConfigWizardProps {
  localPath: string;
  sourceName: string;
  existingConfig: {
    hasBooltoxJson: boolean;
    hasBooltoxIndex: boolean;
    booltoxData?: any;
    indexData?: any;
  } | null;
  onBack: () => void;
  onFinish: () => void;
}

function ToolConfigWizard({ localPath, sourceName, existingConfig, onBack, onFinish }: ToolConfigWizardProps) {
  // 根据现有配置确定模式和步骤
  const initialMode = existingConfig?.hasBooltoxIndex
    ? 'index'
    : existingConfig?.hasBooltoxJson
    ? 'single'
    : null;

  const initialStep: 'mode-select' | 'index-list' | 'create-subtools' =
    initialMode === 'index'
      ? 'index-list'  // 已有 index，直接到列表编辑
      : 'mode-select'; // 没有配置或只有单工具配置

  const [mode, setMode] = useState<'single' | 'index' | null>(initialMode);
  const [step, setStep] = useState<'mode-select' | 'index-list' | 'create-subtools'>(initialStep);

  const [toolConfig, setToolConfig] = useState<any>(existingConfig?.booltoxData || {
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    author: '',
    category: 'utilities',
    runtime: {
      type: 'http-service',
      start: '',
      healthCheck: { path: '/', port: 8080 },
    },
  });
  const [indexTools, setIndexTools] = useState<Array<{ id: string; path: string }>>(
    existingConfig?.indexData?.tools || []
  );
  const [subtoolsStatus, setSubtoolsStatus] = useState<Array<{ id: string; path: string; hasConfig: boolean }>>([]);

  const handleSaveConfig = async () => {
    try {
      if (mode === 'single') {
        // 生成 booltox.json
        await window.ipc?.invoke('fs:writeToolConfig', localPath, toolConfig);
        window.toast?.success('已生成 booltox.json');
        onFinish();
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      window.toast?.error('保存配置失败');
    }
  };

  const handleSaveIndex = async () => {
    try {
      // 1. 生成 booltox-index.json
      await window.ipc?.invoke('fs:writeToolIndex', localPath, { tools: indexTools });

      // 2. 检测每个子工具是否有配置
      const status = await Promise.all(
        indexTools.map(async (tool) => {
          const subPath = `${localPath}/${tool.path}`;
          const result = await window.ipc?.invoke('fs:detectToolConfig', subPath);
          return {
            id: tool.id,
            path: tool.path,
            hasConfig: result?.hasBooltoxJson || false,
          };
        })
      );

      setSubtoolsStatus(status);

      // 如果所有子工具都有配置，直接完成
      if (status.every(s => s.hasConfig)) {
        window.toast?.success('已生成 booltox-index.json，所有子工具配置已就绪');
        onFinish();
      } else {
        // 否则进入子工具配置步骤
        setStep('create-subtools');
      }
    } catch (error) {
      console.error('Failed to save index:', error);
      window.toast?.error('保存索引失败');
    }
  };

  const handleCreateSubtoolConfig = async (toolId: string, toolPath: string) => {
    try {
      const subPath = `${localPath}/${toolPath}`;
      const defaultConfig = {
        id: toolId,
        name: toolId.split('.').pop() || toolId,
        version: '1.0.0',
        description: '',
        author: '',
        category: 'utilities',
        runtime: {
          type: 'http-service',
          start: '',
          healthCheck: { path: '/', port: 8080 },
        },
      };

      await window.ipc?.invoke('fs:writeToolConfig', subPath, defaultConfig);

      // 更新状态
      setSubtoolsStatus(prev =>
        prev.map(s => (s.id === toolId ? { ...s, hasConfig: true } : s))
      );

      window.toast?.success(`已为 ${toolId} 生成配置模板`);
    } catch (error) {
      console.error('Failed to create subtool config:', error);
      window.toast?.error(`创建 ${toolId} 配置失败`);
    }
  };

  const handleFinishSubtools = () => {
    const missingCount = subtoolsStatus.filter(s => !s.hasConfig).length;
    if (missingCount > 0) {
      if (confirm(`还有 ${missingCount} 个子工具未配置，确定要继续吗？\n（未配置的工具将无法使用）`)) {
        onFinish();
      }
    } else {
      window.toast?.success('所有子工具配置完成');
      onFinish();
    }
  };

  // 选择模式
  if (step === 'mode-select' && !mode) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">选择工具模式</h2>
        <p className="text-gray-500 mb-6">
          该目录还没有配置文件，请选择工具模式：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setMode('single');
              setStep('mode-select');
            }}
            className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <h3 className="text-lg font-bold mb-2">单工具模式</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              该目录是一个完整的工具项目
            </p>
          </button>

          <button
            onClick={() => {
              setMode('index');
              setStep('index-list');
            }}
            className="border-2 border-green-200 rounded-xl p-6 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
          >
            <h3 className="text-lg font-bold mb-2">多工具模式</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              该目录包含多个子工具项目
            </p>
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 单工具模式：配置表单
  if (mode === 'single') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">配置工具信息</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">工具 ID *</label>
            <input
              type="text"
              value={toolConfig.id}
              onChange={(e) => setToolConfig({ ...toolConfig, id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="com.example.my-tool"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">工具名称 *</label>
            <input
              type="text"
              value={toolConfig.name}
              onChange={(e) => setToolConfig({ ...toolConfig, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="我的工具"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">版本 *</label>
            <input
              type="text"
              value={toolConfig.version}
              onChange={(e) => setToolConfig({ ...toolConfig, version: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="1.0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">作者 *</label>
            <input
              type="text"
              value={toolConfig.author}
              onChange={(e) => setToolConfig({ ...toolConfig, author: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="Your Name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">描述</label>
          <textarea
            value={toolConfig.description}
            onChange={(e) => setToolConfig({ ...toolConfig, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            rows={3}
            placeholder="工具功能描述"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">运行时类型 *</label>
            <select
              value={toolConfig.runtime?.type || 'http-service'}
              onChange={(e) => setToolConfig({
                ...toolConfig,
                runtime: { ...toolConfig.runtime, type: e.target.value }
              })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="http-service">HTTP Service</option>
              <option value="standalone">Standalone</option>
              <option value="cli">CLI</option>
              <option value="binary">Binary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            <input
              type="text"
              value={toolConfig.category}
              onChange={(e) => setToolConfig({ ...toolConfig, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="utilities"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">启动命令 *</label>
          <input
            type="text"
            value={toolConfig.runtime?.start || ''}
            onChange={(e) => setToolConfig({
              ...toolConfig,
              runtime: { ...toolConfig.runtime, start: e.target.value }
            })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            placeholder="python main.py 或 node server.js"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            返回
          </button>
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={!toolConfig.id || !toolConfig.name || !toolConfig.runtime?.start}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            保存并添加
          </button>
        </div>
      </div>
    );
  }

  // 多工具模式 - 步骤1：配置工具列表
  if (step === 'index-list') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">配置工具列表</h2>
        <p className="text-gray-500 mb-4">
          请添加该目录下的工具子项目
        </p>

        <div className="space-y-3">
          {indexTools.map((tool, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={tool.id}
                onChange={(e) => {
                  const newTools = [...indexTools];
                  newTools[index].id = e.target.value;
                  setIndexTools(newTools);
                }}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder="工具 ID (如: com.example.tool1)"
              />
              <input
                type="text"
                value={tool.path}
                onChange={(e) => {
                  const newTools = [...indexTools];
                  newTools[index].path = e.target.value;
                  setIndexTools(newTools);
                }}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder="相对路径（如：tools/tool1）"
              />
              <button
                type="button"
                onClick={() => setIndexTools(indexTools.filter((_, i) => i !== index))}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                删除
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIndexTools([...indexTools, { id: '', path: '' }])}
          className="w-full px-4 py-2 border-2 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + 添加工具
        </button>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            返回
          </button>
          <button
            type="button"
            onClick={handleSaveIndex}
            disabled={indexTools.length === 0 || indexTools.some(t => !t.id || !t.path)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  // 多工具模式 - 步骤2：创建子工具配置
  if (step === 'create-subtools') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">配置子工具</h2>
        <p className="text-gray-500 mb-4">
          为没有配置的子工具生成配置模板（后续可手动编辑）
        </p>

        <div className="space-y-3">
          {subtoolsStatus.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600"
            >
              <div className="flex-1">
                <h3 className="font-medium">{tool.id}</h3>
                <p className="text-sm text-gray-500">{tool.path}</p>
              </div>
              <div className="flex items-center gap-3">
                {tool.hasConfig ? (
                  <span className="text-green-600 dark:text-green-400 text-sm">✓ 已有配置</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCreateSubtoolConfig(tool.id, tool.path)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    生成配置模板
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 提示：生成的配置模板只包含基本字段，请稍后手动编辑 booltox.json 添加详细信息（如描述、启动命令等）
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setStep('index-list')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            返回
          </button>
          <button
            type="button"
            onClick={handleFinishSubtools}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            完成并添加
          </button>
        </div>
      </div>
    );
  }

  return null;
}

