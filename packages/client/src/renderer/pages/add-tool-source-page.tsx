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

// 本地目录表单
function LocalSourceForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    localPath: '',
  });

  const handleSelectPath = async () => {
    const result = await window.ipc?.invoke('dialog:openFile', {
      properties: ['openDirectory'],
    });

    if (result && typeof result === 'string') {
      setFormData({
        ...formData,
        localPath: result,
        name: formData.name || result.split(/[/\\]/).pop() || '本地工具',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.localPath) {
      window.toast?.error('请填写所有字段');
      return;
    }

    try {
      const newSource: Omit<ToolSourceConfig, 'id'> = {
        name: formData.name,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">添加本地目录</h2>

      <div>
        <label className="block text-sm font-medium mb-2">工具源名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          placeholder="如：我的本地工具"
          required
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
            required
          />
          <button
            type="button"
            onClick={handleSelectPath}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            浏览...
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          目录中可以包含 booltox.json 文件（可选）
        </p>
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          添加
        </button>
      </div>
    </form>
  );
}

