import { useState, useMemo, useCallback } from 'react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  Badge,
  Button,
  Card,
  Input,
  Rate,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { Module, ModuleStatus } from '@booltox/shared';
import dayjs from 'dayjs';
import { modulesApi } from '../features/modules/api';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const STATUS_OPTIONS: Array<{ label: string; value: ModuleStatus | 'ALL' }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '启用', value: 'ACTIVE' },
  { label: '已下线', value: 'DEPRECATED' },
  { label: '归档', value: 'ARCHIVED' },
];

const FEATURED_OPTIONS = [
  { label: '全部模块', value: 'ALL' },
  { label: '精选模块', value: 'FEATURED' },
  { label: '普通模块', value: 'REGULAR' },
];

function formatDate(value: string) {
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function ModulesPage() {
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const [featured, setFeatured] = useState<'ALL' | 'FEATURED' | 'REGULAR'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const queryKey = useMemo(
    () => [
      'admin',
      'modules',
      {
        page: pagination.page,
        limit: pagination.limit,
        status,
        featured,
        searchKeyword,
      },
    ],
    [pagination, status, featured, searchKeyword]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      modulesApi.list({
        page: pagination.page,
        limit: pagination.limit,
        status,
        featured:
          featured === 'ALL' ? null : featured === 'FEATURED' ? true : false,
        search: searchKeyword,
      }),
    keepPreviousData: true,
  });

  const handlePaginationChange = useCallback((config: TablePaginationConfig) => {
    setPagination({
      page: config.current ?? 1,
      limit: config.pageSize ?? 10,
    });
  }, []);

  const columns = useMemo<ColumnsType<Module>>(
    () => [
      {
        title: '模块名称',
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value: string, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.name}
            </Text>
          </Space>
        ),
      },
      {
        title: '当前版本',
        dataIndex: 'currentVersion',
        key: 'currentVersion',
        render: (value) => <Tag color="blue">{value}</Tag>,
      },
      {
        title: '分类 / 标签',
        dataIndex: 'category',
        key: 'category',
        render: (value: string, record) => (
          <Space size={[4, 4]} wrap>
            <Tag color="cyan">{value}</Tag>
            {record.keywords.slice(0, 3).map((keyword) => (
              <Tag key={keyword}>{keyword}</Tag>
            ))}
            {record.keywords.length > 3 ? <Tag>+{record.keywords.length - 3}</Tag> : null}
          </Space>
        ),
      },
      {
        title: '下载 / 评分',
        dataIndex: 'downloads',
        key: 'downloads',
        render: (_: number, record) => (
          <Space direction="vertical" size={0}>
            <Text>{record.downloads.toLocaleString()} 次下载</Text>
            <Rate allowHalf disabled value={record.rating ?? 0} style={{ fontSize: 14 }} />
          </Space>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (value: ModuleStatus, record) => (
          <Space>
            <Badge
              status={
                value === 'ACTIVE' ? 'success' : value === 'DEPRECATED' ? 'warning' : 'default'
              }
              text={
                value === 'ACTIVE'
                  ? '启用'
                  : value === 'DEPRECATED'
                  ? '已下线'
                  : '归档'
              }
            />
            {record.featured ? <Tag color="gold">精选</Tag> : null}
          </Space>
        ),
      },
      {
        title: '更新信息',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>修改：{formatDate(record.updatedAt)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              创建：{formatDate(record.createdAt)}
            </Text>
          </Space>
        ),
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
            模块市场
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            管理模块上架、版本分发与下载统计。
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建模块
          </Button>
        </Space>
      </Space>

      <Card bordered={false}>
        <Space
          wrap
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Space wrap>
            <Segmented
              options={STATUS_OPTIONS}
              value={status ?? 'ALL'}
              onChange={(value) => {
                setStatus(value === 'ALL' ? null : (value as ModuleStatus));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
            <Segmented
              options={FEATURED_OPTIONS}
              value={featured}
              onChange={(value) => {
                setFeatured(value as typeof featured);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </Space>
          <Search
            allowClear
            placeholder="搜索模块名称 / 描述 / 关键字"
            prefix={<SearchOutlined />}
            onSearch={(value) => {
              setSearchKeyword(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            style={{ width: 320 }}
          />
        </Space>

        <Table<Module>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={tableData}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total,
            showSizeChanger: true,
            showTotal: (tot) => `共 ${tot} 个模块`,
          }}
          onChange={handlePaginationChange}
        />
      </Card>
    </Space>
  );
}
