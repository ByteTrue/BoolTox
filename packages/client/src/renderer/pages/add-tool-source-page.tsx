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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { ArrowLeft, Github, FolderOpen } from 'lucide-react';
import type { ToolSourceConfig } from '@booltox/shared';
import { AppButton, AppInput, AppSelect } from '../components/ui';

type SourceType = 'remote' | 'local';

export function AddToolSourcePage() {
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
    <Box sx={{ height: '100%', overflowY: 'auto', px: 4, py: 3 }}>
      {/* 头部 */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <IconButton onClick={handleBack}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h4" fontWeight={700}>
          添加工具源
        </Typography>
      </Stack>

      {/* 步骤 1：选择类型 */}
      {step === 'select-type' && (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            选择要添加的工具源类型
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* 远程仓库 */}
            <SourceTypeCard
              icon={<Github size={48} />}
              title="远程仓库"
              description="GitHub/GitLab 仓库，支持 booltox.json 或 booltox-index.json"
              color="primary"
              onClick={() => handleSelectType('remote')}
            />

            {/* 本地目录 */}
            <SourceTypeCard
              icon={<FolderOpen size={48} />}
              title="本地目录"
              description="本地文件夹（源码或二进制），支持 booltox.json 或手动配置"
              color="success"
              onClick={() => handleSelectType('local')}
            />
          </Box>
        </Box>
      )}

      {/* 步骤 2：填写表单 */}
      {step === 'fill-form' && selectedType && (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          {selectedType === 'remote' && (
            <RemoteSourceForm onBack={handleBack} onSuccess={() => navigate('/tools')} />
          )}
          {selectedType === 'local' && (
            <LocalSourceForm onBack={handleBack} onSuccess={() => navigate('/tools')} />
          )}
        </Box>
      )}
    </Box>
  );
}

// 类型选择卡片
interface SourceTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'success';
  onClick: () => void;
}

function SourceTypeCard({ icon, title, description, color, onClick }: SourceTypeCardProps) {
  return (
    <Paper
      component="button"
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: 2,
        border: 2,
        borderColor: `${color}.light`,
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: `${color}.main`,
          bgcolor: `${color}.main`,
          color: `${color}.contrastText`,
          transform: 'translateY(-4px) scale(1.02)',
          '& [data-icon]': {
            opacity: 1,
          },
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        transition: 'all 0.2s',
      }}
    >
      <Box data-icon sx={{ mb: 2, opacity: 0.7 }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
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
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          添加远程仓库
        </Typography>

        <AppInput
          label="工具源名称"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="如：公司内部工具库"
          required
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <AppSelect
            label="平台"
            value={formData.provider}
            onChange={value => setFormData({ ...formData, provider: value as 'github' | 'gitlab' })}
            options={[
              { value: 'github', label: 'GitHub' },
              { value: 'gitlab', label: 'GitLab' },
            ]}
            required
          />
          <AppInput
            label="分支"
            value={formData.branch}
            onChange={e => setFormData({ ...formData, branch: e.target.value })}
            placeholder="main"
            required
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <AppInput
            label="所有者"
            value={formData.owner}
            onChange={e => setFormData({ ...formData, owner: e.target.value })}
            placeholder="如：ByteTrue"
            required
          />
          <AppInput
            label="仓库名"
            value={formData.repo}
            onChange={e => setFormData({ ...formData, repo: e.target.value })}
            placeholder="如：my-tools"
            required
          />
        </Box>

        {formData.provider === 'gitlab' && (
          <AppInput
            label="GitLab 服务器地址（可选）"
            value={formData.baseUrl}
            onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder="https://gitlab.company.com"
            helperText="留空使用 gitlab.com"
          />
        )}

        <AppInput
          label="访问 Token（私有仓库）"
          type="password"
          value={formData.token}
          onChange={e => setFormData({ ...formData, token: e.target.value })}
          placeholder="ghp_xxx 或 glpat-xxx"
          helperText="公开仓库无需填写"
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={onBack}>
            返回
          </AppButton>
          <AppButton type="submit" variant="primary">
            添加
          </AppButton>
        </Stack>
      </Stack>
    </Box>
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
    booltoxData?: unknown;
    indexData?: unknown;
  } | null>(null);

  const handleSelectPath = async () => {
    const result = await window.ipc?.invoke('dialog:openFile', {
      properties: ['openDirectory'],
    });

    if (result && typeof result === 'string') {
      // 检测配置文件
      const config = await detectToolConfig(result);
      setExistingConfig(
        config as {
          hasBooltoxJson: boolean;
          hasBooltoxIndex: boolean;
          booltoxData?: unknown;
          indexData?: unknown;
        }
      );

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
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          添加本地目录
        </Typography>

        <AppInput
          label="工具源名称"
          value={formData.sourceName}
          onChange={e => setFormData({ ...formData, sourceName: e.target.value })}
          placeholder="如：我的本地工具"
          required
        />

        <Box>
          <Stack direction="row" spacing={2}>
            <AppInput
              label="本地目录路径"
              value={formData.localPath}
              onChange={e => setFormData({ ...formData, localPath: e.target.value })}
              placeholder="E:\Code\MyTool"
              required
            />
            <Box sx={{ mt: 2, flexShrink: 0 }}>
              <AppButton variant="secondary" onClick={handleSelectPath}>
                浏览...
              </AppButton>
            </Box>
          </Stack>
          {existingConfig && (
            <Paper sx={{ mt: 1, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
              {existingConfig.hasBooltoxIndex && (
                <Typography variant="body2" color="info.dark">
                  ✓ 检测到 booltox-index.json（多工具模式）
                </Typography>
              )}
              {existingConfig.hasBooltoxJson && !existingConfig.hasBooltoxIndex && (
                <Typography variant="body2" color="info.dark">
                  ✓ 检测到 booltox.json（单工具模式）
                </Typography>
              )}
              {!existingConfig.hasBooltoxJson && !existingConfig.hasBooltoxIndex && (
                <Typography variant="body2" color="warning.dark">
                  ⚠ 未检测到配置文件，将引导您创建
                </Typography>
              )}
            </Paper>
          )}
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={onBack}>
            返回
          </AppButton>
          <AppButton variant="success" onClick={handleNextStep} disabled={!formData.localPath}>
            下一步
          </AppButton>
        </Stack>
      </Stack>
    );
  }

  // 第二步：配置工具信息
  return (
    <ToolConfigWizard
      localPath={formData.localPath}
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
  existingConfig: {
    hasBooltoxJson: boolean;
    hasBooltoxIndex: boolean;
    booltoxData?: unknown;
    indexData?: unknown;
  } | null;
  onBack: () => void;
  onFinish: () => void;
}

type ToolIndexData = { tools?: Array<{ id: string; path: string }> };

interface ToolConfigDraftRuntime {
  type?: string;
  start?: string;
  healthCheck?: { path?: string; port?: number };
}

interface ToolConfigDraft {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  runtime?: ToolConfigDraftRuntime;
}

function ToolConfigWizard({ localPath, existingConfig, onBack, onFinish }: ToolConfigWizardProps) {
  // 根据现有配置确定模式和步骤
  const initialMode = existingConfig?.hasBooltoxIndex
    ? 'index'
    : existingConfig?.hasBooltoxJson
      ? 'single'
      : null;

  const initialStep: 'mode-select' | 'index-list' | 'create-subtools' =
    initialMode === 'index'
      ? 'index-list' // 已有 index，直接到列表编辑
      : 'mode-select'; // 没有配置或只有单工具配置

  const [mode, setMode] = useState<'single' | 'index' | null>(initialMode);
  const [step, setStep] = useState<'mode-select' | 'index-list' | 'create-subtools'>(initialStep);

  const defaultToolConfig: ToolConfigDraft = {
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
  };

  const [toolConfig, setToolConfig] = useState<ToolConfigDraft>(() => {
    const existing = existingConfig?.booltoxData;
    if (!existing || typeof existing !== 'object') {
      return defaultToolConfig;
    }

    const record = existing as Partial<ToolConfigDraft> & { runtime?: unknown };
    const runtime = record.runtime;

    return {
      ...defaultToolConfig,
      ...record,
      runtime: {
        ...defaultToolConfig.runtime,
        ...(runtime && typeof runtime === 'object'
          ? (runtime as Partial<ToolConfigDraftRuntime>)
          : {}),
      },
    };
  });

  const [indexTools, setIndexTools] = useState<Array<{ id: string; path: string }>>(() => {
    const tools = (existingConfig?.indexData as ToolIndexData | null | undefined)?.tools;
    return Array.isArray(tools) ? tools : [];
  });
  const [subtoolsStatus, setSubtoolsStatus] = useState<
    Array<{ id: string; path: string; hasConfig: boolean }>
  >([]);

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
        indexTools.map(async tool => {
          const subPath = `${localPath}/${tool.path}`;
          const result = (await window.ipc?.invoke('fs:detectToolConfig', subPath)) as
            | { hasBooltoxJson?: boolean }
            | undefined;
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
      setSubtoolsStatus(prev => prev.map(s => (s.id === toolId ? { ...s, hasConfig: true } : s)));

      window.toast?.success(`已为 ${toolId} 生成配置模板`);
    } catch (error) {
      console.error('Failed to create subtool config:', error);
      window.toast?.error(`创建 ${toolId} 配置失败`);
    }
  };

  const handleFinishSubtools = () => {
    const missingCount = subtoolsStatus.filter(s => !s.hasConfig).length;
    if (missingCount > 0) {
      if (
        confirm(`还有 ${missingCount} 个子工具未配置，确定要继续吗？\n（未配置的工具将无法使用）`)
      ) {
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
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          选择工具模式
        </Typography>
        <Typography variant="body2" color="text.secondary">
          该目录还没有配置文件，请选择工具模式：
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Paper
            component="button"
            onClick={() => {
              setMode('single');
              setStep('mode-select');
            }}
            sx={{
              p: 3,
              border: 2,
              borderColor: 'info.light',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'info.main',
                bgcolor: 'info.light',
              },
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              单工具模式
            </Typography>
            <Typography variant="body2" color="text.secondary">
              该目录是一个完整的工具项目
            </Typography>
          </Paper>

          <Paper
            component="button"
            onClick={() => {
              setMode('index');
              setStep('index-list');
            }}
            sx={{
              p: 3,
              border: 2,
              borderColor: 'success.light',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'success.main',
                bgcolor: 'success.light',
              },
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              多工具模式
            </Typography>
            <Typography variant="body2" color="text.secondary">
              该目录包含多个子工具项目
            </Typography>
          </Paper>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={onBack}>
            返回
          </AppButton>
        </Stack>
      </Stack>
    );
  }

  // 单工具模式：配置表单
  if (mode === 'single') {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          配置工具信息
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <AppInput
            label="工具 ID"
            value={toolConfig.id}
            onChange={e => setToolConfig({ ...toolConfig, id: e.target.value })}
            placeholder="com.example.my-tool"
            required
          />
          <AppInput
            label="工具名称"
            value={toolConfig.name}
            onChange={e => setToolConfig({ ...toolConfig, name: e.target.value })}
            placeholder="我的工具"
            required
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <AppInput
            label="版本"
            value={toolConfig.version}
            onChange={e => setToolConfig({ ...toolConfig, version: e.target.value })}
            placeholder="1.0.0"
            required
          />
          <AppInput
            label="作者"
            value={toolConfig.author}
            onChange={e => setToolConfig({ ...toolConfig, author: e.target.value })}
            placeholder="Your Name"
            required
          />
        </Box>

        <AppInput
          label="描述"
          value={toolConfig.description}
          onChange={e => setToolConfig({ ...toolConfig, description: e.target.value })}
          placeholder="工具功能描述"
          multiline
          rows={3}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <AppSelect
            label="运行时类型"
            value={toolConfig.runtime?.type || 'http-service'}
            onChange={value =>
              setToolConfig({
                ...toolConfig,
                runtime: { ...toolConfig.runtime, type: value },
              })
            }
            options={[
              { value: 'http-service', label: 'HTTP Service' },
              { value: 'standalone', label: 'Standalone' },
              { value: 'cli', label: 'CLI' },
              { value: 'binary', label: 'Binary' },
            ]}
            required
          />
          <AppInput
            label="分类"
            value={toolConfig.category}
            onChange={e => setToolConfig({ ...toolConfig, category: e.target.value })}
            placeholder="utilities"
          />
        </Box>

        <AppInput
          label="启动命令"
          value={toolConfig.runtime?.start || ''}
          onChange={e =>
            setToolConfig({
              ...toolConfig,
              runtime: { ...toolConfig.runtime, start: e.target.value },
            })
          }
          placeholder="python main.py 或 node server.js"
          required
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={onBack}>
            返回
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSaveConfig}
            disabled={!toolConfig.id || !toolConfig.name || !toolConfig.runtime?.start}
          >
            保存并添加
          </AppButton>
        </Stack>
      </Stack>
    );
  }

  // 多工具模式 - 步骤1：配置工具列表
  if (step === 'index-list') {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          配置工具列表
        </Typography>
        <Typography variant="body2" color="text.secondary">
          请添加该目录下的工具子项目
        </Typography>

        <Stack spacing={2}>
          {indexTools.map((tool, index) => (
            <Stack key={index} direction="row" spacing={2} alignItems="flex-end">
              <AppInput
                label={index === 0 ? '工具 ID' : undefined}
                value={tool.id}
                onChange={e => {
                  const newTools = [...indexTools];
                  newTools[index].id = e.target.value;
                  setIndexTools(newTools);
                }}
                placeholder="工具 ID (如: com.example.tool1)"
              />
              <AppInput
                label={index === 0 ? '相对路径' : undefined}
                value={tool.path}
                onChange={e => {
                  const newTools = [...indexTools];
                  newTools[index].path = e.target.value;
                  setIndexTools(newTools);
                }}
                placeholder="相对路径（如：tools/tool1）"
              />
              <AppButton
                variant="danger"
                size="sm"
                onClick={() => setIndexTools(indexTools.filter((_, i) => i !== index))}
              >
                删除
              </AppButton>
            </Stack>
          ))}
        </Stack>

        <AppButton
          variant="secondary"
          fullWidth
          onClick={() => setIndexTools([...indexTools, { id: '', path: '' }])}
        >
          + 添加工具
        </AppButton>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={onBack}>
            返回
          </AppButton>
          <AppButton
            variant="success"
            onClick={handleSaveIndex}
            disabled={indexTools.length === 0 || indexTools.some(t => !t.id || !t.path)}
          >
            下一步
          </AppButton>
        </Stack>
      </Stack>
    );
  }

  // 多工具模式 - 步骤2：创建子工具配置
  if (step === 'create-subtools') {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          配置子工具
        </Typography>
        <Typography variant="body2" color="text.secondary">
          为没有配置的子工具生成配置模板（后续可手动编辑）
        </Typography>

        <Stack spacing={2}>
          {subtoolsStatus.map(tool => (
            <Paper
              key={tool.id}
              sx={{
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box flex={1}>
                <Typography variant="body1" fontWeight={600}>
                  {tool.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tool.path}
                </Typography>
              </Box>
              <Box>
                {tool.hasConfig ? (
                  <Typography variant="body2" color="success.main">
                    ✓ 已有配置
                  </Typography>
                ) : (
                  <AppButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateSubtoolConfig(tool.id, tool.path)}
                  >
                    生成配置模板
                  </AppButton>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>

        <Alert severity="info">
          💡 提示：生成的配置模板只包含基本字段，请稍后手动编辑 booltox.json
          添加详细信息（如描述、启动命令等）
        </Alert>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
          <AppButton variant="ghost" onClick={() => setStep('index-list')}>
            返回
          </AppButton>
          <AppButton variant="success" onClick={handleFinishSubtools}>
            完成并添加
          </AppButton>
        </Stack>
      </Stack>
    );
  }

  return null;
}
