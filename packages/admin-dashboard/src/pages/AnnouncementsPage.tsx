import { useMemo, useState, useCallback } from 'react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  Badge,
  Button,
  Card,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@booltox/shared';
import dayjs from 'dayjs';
import { announcementsApi } from '../features/announcements/api';

const { Title, Paragraph, Text } = Typography;

const STATUS_OPTIONS: Array<{ label: string; value: AnnouncementStatus | 'ALL' }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已过期', value: 'EXPIRED' },
];

const TYPE_OPTIONS: Array<{ label: string; value: AnnouncementType | 'ALL' }> = [
  { label: '全部类型', value: 'ALL' },
  { label: '公告', value: 'ANNOUNCEMENT' },
  { label: '更新', value: 'UPDATE' },
  { label: '通知', value: 'NOTICE' },
  { label: '维护', value: 'MAINTENANCE' },
];

const STATUS_MAP: Record<AnnouncementStatus, { text: string; color: 'default' | 'processing' | 'warning' | 'error' | 'success' }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PUBLISHED: { text: '已发布', color: 'success' },
  EXPIRED: { text: '已过期', color: 'warning' },
};

const TYPE_COLOR: Record<AnnouncementType, string> = {
  ANNOUNCEMENT: 'blue',
  UPDATE: 'green',
  NOTICE: 'gold',
  MAINTENANCE: 'volcano',
};

function formatDate(value: string | null) {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function AnnouncementsPage() {
  const [status, setStatus] = useState<AnnouncementStatus | null>(null);
  const [type, setType] = useState<AnnouncementType | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const queryKey = useMemo(
    () => ['admin', 'announcements', { page: pagination.page, limit: pagination.limit, status, type }],
    [pagination, status, type]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      announcementsApi.list({
        page: pagination.page,
        limit: pagination.limit,
        status,
        type,
      }),
    keepPreviousData: true,
  });

  const handlePaginationChange = useCallback((config: TablePaginationConfig) => {
    setPagination({
      page: config.current ?? 1,
      limit: config.pageSize ?? 10,
    });
  }, []);

  const columns = useMemo<ColumnsType<Announcement>>(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            <Tag color={TYPE_COLOR[record.type]}>{record.type.toLowerCase()}</Tag>
          </Space>
        ),
      },
      {
        title: '状态 / 优先级',
        dataIndex: 'status',
        key: 'status',
        render: (value: AnnouncementStatus, record) => (
          <Space size={8}>
            <Badge status={STATUS_MAP[value].color} text={STATUS_MAP[value].text} />
            <Tag color={record.priority > 50 ? 'volcano' : record.priority > 10 ? 'geekblue' : 'default'}>
              优先级 {record.priority}
            </Tag>
          </Space>
        ),
      },
      {
        title: '发布时间',
        dataIndex: 'publishAt',
        key: 'publishAt',
        render: (value: string | null) => formatDate(value),
      },
      {
        title: '过期时间',
        dataIndex: 'expireAt',
        key: 'expireAt',
        render: (value: string | null) => formatDate(value),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string) => formatDate(value),
      },
    ],
    []
  );

  const tableData = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            公告中心
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            发布客户端公告、维护有效期以及优先级。
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建公告
          </Button>
        </Space>
      </Space>

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Segmented
            options={STATUS_OPTIONS}
            value={status ?? 'ALL'}
            onChange={(value) => {
              setStatus(value === 'ALL' ? null : (value as AnnouncementStatus));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
          <Segmented
            options={TYPE_OPTIONS}
            value={type ?? 'ALL'}
            onChange={(value) => {
              setType(value === 'ALL' ? null : (value as AnnouncementType));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </Space>

        <Table<Announcement>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={tableData}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total,
            showSizeChanger: true,
            showTotal: (tot) => `共 ${tot} 条公告`,
          }}
          onChange={handlePaginationChange}
          expandable={{
            expandedRowRender: (record) => (
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{record.content}</Paragraph>
            ),
          }}
        />
      </Card>
    </Space>
  );
}
