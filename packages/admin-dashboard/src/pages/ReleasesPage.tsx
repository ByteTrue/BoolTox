import { useState, useMemo, useCallback } from 'react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  Badge,
  Button,
  Card,
  message,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Release } from '@booltox/shared';
import { ReleaseChannel, PermissionCode } from '@booltox/shared';
import { releasesApi } from '../features/releases/api';
import { CreateReleaseDrawer } from '../features/releases/components/CreateReleaseDrawer';
import { UpdateReleaseDrawer } from '../features/releases/components/UpdateReleaseDrawer';
import { ReleaseDetailDrawer } from '../features/releases/components/ReleaseDetailDrawer';
import type {
  CreateReleasePayload,
  ReleaseDetail,
  UpdateReleasePayload,
  SyncGitHubReleasePayload,
} from '../features/releases/types';
import { formatReleaseDate, RELEASE_CHANNEL_META } from '../features/releases/utils';
import { extractApiErrorMessage } from '../shared/error';
import { SyncGitHubModal } from '../features/releases/components/SyncGitHubModal';
import { useAuth } from '../features/auth/auth-context';

const { Title, Paragraph, Text } = Typography;

const CHANNEL_OPTIONS: Array<{ label: string; value: ReleaseChannel | 'ALL' }> = [
  { label: '全部', value: 'ALL' },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.STABLE].label, value: ReleaseChannel.STABLE },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.BETA].label, value: ReleaseChannel.BETA },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.ALPHA].label, value: ReleaseChannel.ALPHA },
];

interface DetailDrawerState {
  open: boolean;
  loading: boolean;
  release: ReleaseDetail | null;
}

interface EditDrawerState extends DetailDrawerState {
  releaseId: string | null;
}

export function ReleasesPage() {
  const [channel, setChannel] = useState<ReleaseChannel | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  });
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState<DetailDrawerState>({
    open: false,
    loading: false,
    release: null,
  });
  const [editDrawer, setEditDrawer] = useState<EditDrawerState>({
    open: false,
    loading: false,
    release: null,
    releaseId: null,
  });
  const [isSyncModalOpen, setSyncModalOpen] = useState(false);

  const { permissions } = useAuth();
  const canSyncGitHub = permissions.includes(PermissionCode.GITHUB_SYNC);

  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['admin', 'releases', { page: pagination.page, limit: pagination.limit, channel }],
    [channel, pagination]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      releasesApi.list({
        page: pagination.page,
        limit: pagination.limit,
        channel,
      }),
    keepPreviousData: true,
  });

  const loadRelease = useCallback(
    async (id: string) => {
      return queryClient.fetchQuery({
        queryKey: ['admin', 'releases', 'detail', id],
        queryFn: () => releasesApi.get(id),
      });
    },
    [queryClient]
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateReleasePayload) => releasesApi.create(payload),
    onSuccess: async () => {
      message.success('已创建新版本');
      setCreateDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'releases'] });
    },
    onError: (error) => {
      message.error(extractApiErrorMessage(error, '创建版本失败，请稍后重试。'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReleasePayload }) =>
      releasesApi.update(id, payload),
    onSuccess: async (release, { id }) => {
      message.success('版本信息已更新');
      setEditDrawer({
        open: false,
        loading: false,
        release: null,
        releaseId: null,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'releases'] });
      queryClient.setQueryData(['admin', 'releases', 'detail', id], release);
      setDetailDrawer((prev) =>
        prev.release?.id === id ? { ...prev, release } : prev
      );
    },
    onError: (error) => {
      message.error(extractApiErrorMessage(error, '更新版本失败，请稍后重试。'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => releasesApi.remove(id),
    onSuccess: async (_result, id) => {
      message.success('已删除版本');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'releases'] });
      setDetailDrawer((prev) =>
        prev.release?.id === id ? { open: false, loading: false, release: null } : prev
      );
      setEditDrawer((prev) =>
        prev.releaseId === id
          ? { open: false, loading: false, release: null, releaseId: null }
          : prev
      );
    },
    onError: (error) => {
      message.error(extractApiErrorMessage(error, '删除版本失败，请稍后重试。'));
    },
  });

  const syncMutation = useMutation({
    mutationFn: (payload: SyncGitHubReleasePayload) => releasesApi.syncGitHub(payload),
    onSuccess: async (result, payload) => {
      let successText: string;
      if (payload.mode === 'tag') {
        successText = `已同步指定 Tag：${payload.tag}`;
      } else if (payload.mode === 'all') {
        successText = payload.limit
          ? `已触发批量同步最近 ${payload.limit} 个 Release`
          : '已触发批量同步全部 Release';
      } else {
        successText = '已同步最新 Release';
      }

      if (typeof result.count === 'number' && result.count > 0) {
        successText = `${successText}（共 ${result.count} 个版本）`;
      }

      message.success(successText);
      setSyncModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'releases'] });
    },
    onError: (error) => {
      message.error(extractApiErrorMessage(error, '同步 GitHub Release 失败，请稍后重试。'));
    },
  });

  const deletePendingId = (deleteMutation.variables as string | undefined) ?? null;
  const deletePending = deleteMutation.isPending;

  const handlePaginationChange = useCallback(
    (config: TablePaginationConfig) => {
      setPagination({
        page: config.current ?? 1,
        limit: config.pageSize ?? 10,
      });
    },
    []
  );

  const handleOpenDetail = useCallback(
    async (id: string) => {
      setDetailDrawer({ open: true, loading: true, release: null });
      try {
        const release = await loadRelease(id);
        setDetailDrawer({ open: true, loading: false, release });
      } catch (error) {
        setDetailDrawer({ open: false, loading: false, release: null });
        message.error(extractApiErrorMessage(error, '加载版本详情失败，请稍后重试。'));
      }
    },
    [loadRelease]
  );

  const handleOpenEdit = useCallback(
    async (id: string) => {
      setEditDrawer({ open: true, loading: true, release: null, releaseId: id });
      try {
        const release = await loadRelease(id);
        setEditDrawer({ open: true, loading: false, release, releaseId: id });
      } catch (error) {
        setEditDrawer({ open: false, loading: false, release: null, releaseId: null });
        message.error(extractApiErrorMessage(error, '加载版本详情失败，请稍后重试。'));
      }
    },
    [loadRelease]
  );

  const handleCloseDetail = useCallback(() => {
    setDetailDrawer({ open: false, loading: false, release: null });
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditDrawer({ open: false, loading: false, release: null, releaseId: null });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleSyncSubmit = useCallback(
    async (payload: SyncGitHubReleasePayload) => {
      await syncMutation.mutateAsync(payload);
    },
    [syncMutation]
  );

  const columns = useMemo<ColumnsType<Release>>(
    () => [
      {
        title: '版本号',
        dataIndex: 'version',
        key: 'version',
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: '渠道',
        dataIndex: 'channel',
        key: 'channel',
        render: (value: ReleaseChannel) => (
          <Tag color={RELEASE_CHANNEL_META[value].color}>{RELEASE_CHANNEL_META[value].label}</Tag>
        ),
      },
      {
        title: '强制更新',
        dataIndex: 'mandatory',
        key: 'mandatory',
        render: (mandatory: boolean) =>
          mandatory ? <Badge color="red" text="是" /> : <Badge color="green" text="否" />,
      },
      {
        title: '灰度比例',
        dataIndex: 'rolloutPercent',
        key: 'rolloutPercent',
        render: (value: number) => `${value}%`,
      },
      {
        title: '资产数量',
        dataIndex: 'assets',
        key: 'assets',
        render: (assets) => (Array.isArray(assets) ? assets.length : 0),
      },
      {
        title: '发布时间',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        render: (value: string | null) => formatReleaseDate(value),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => formatReleaseDate(value),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_value, record) => (
          <Space>
            <Tooltip title="查看详情">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetail(record.id)}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record.id)}
              />
            </Tooltip>
            <Popconfirm
              title="确认删除该版本？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{
                danger: true,
                loading: deletePending && deletePendingId === record.id,
              }}
              onConfirm={() => handleDelete(record.id)}
              disabled={deletePending && deletePendingId === record.id}
            >
              <Tooltip title="删除">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletePending && deletePendingId === record.id}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deletePending, deletePendingId, handleDelete, handleOpenDetail, handleOpenEdit]
  );

  const tableData = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>
              版本发布管理
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              管理客户端版本、推送策略以及 GitHub Release 同步。
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
            {canSyncGitHub && (
              <Button
                icon={<CloudSyncOutlined />}
                onClick={() => setSyncModalOpen(true)}
                loading={syncMutation.isPending}
              >
                同步 GitHub
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDrawerOpen(true)}>
              新建版本
            </Button>
          </Space>
        </Space>

        <Card bordered={false}>
          <Space style={{ marginBottom: 16 }}>
            <Segmented
              options={CHANNEL_OPTIONS}
              value={channel ?? 'ALL'}
              onChange={(value) => {
                const nextChannel = value === 'ALL' ? null : (value as ReleaseChannel);
                setChannel(nextChannel);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </Space>

          <Table<Release>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={tableData}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total,
              showSizeChanger: true,
              showTotal: (tot) => `共 ${tot} 条记录`,
            }}
            onChange={handlePaginationChange}
          />
        </Card>
      </Space>

      <CreateReleaseDrawer
        open={isCreateDrawerOpen}
        loading={createMutation.isPending}
        onClose={() => setCreateDrawerOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
      />

      <UpdateReleaseDrawer
        open={editDrawer.open}
        loading={updateMutation.isPending}
        loadingRelease={editDrawer.loading}
        release={editDrawer.release}
        onClose={handleCloseEdit}
        onSubmit={async (payload) => {
          if (!editDrawer.releaseId) {
            return;
          }
          await updateMutation.mutateAsync({ id: editDrawer.releaseId, payload });
        }}
      />

      <ReleaseDetailDrawer
        open={detailDrawer.open}
        loading={detailDrawer.loading}
        release={detailDrawer.release}
        onClose={handleCloseDetail}
      />

      {canSyncGitHub && (
        <SyncGitHubModal
          open={isSyncModalOpen}
          confirmLoading={syncMutation.isPending}
          onCancel={() => {
            if (!syncMutation.isPending) {
              setSyncModalOpen(false);
            }
          }}
          onSubmit={handleSyncSubmit}
        />
      )}
    </>
  );
}
