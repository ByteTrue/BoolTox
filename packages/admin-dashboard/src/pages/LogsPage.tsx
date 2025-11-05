import { useCallback, useMemo, useState } from 'react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { ClientLog, LogLevel } from '@booltox/shared';
import dayjs, { type Dayjs } from 'dayjs';
import { ReloadOutlined } from '@ant-design/icons';
import { logsApi } from '../features/logs/api';

const { Title, Text } = Typography;
const Paragraph = Typography.Paragraph;
const { RangePicker } = DatePicker;
const { Search } = Input;

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'default',
  INFO: 'processing',
  WARN: 'warning',
  ERROR: 'error',
};

const LEVEL_OPTIONS: Array<{ label: string; value: LogLevel | 'ALL' }> = [
  { label: '全部等级', value: 'ALL' },
  { label: 'Debug', value: 'DEBUG' },
  { label: 'Info', value: 'INFO' },
  { label: 'Warn', value: 'WARN' },
  { label: 'Error', value: 'ERROR' },
];

function formatTimestamp(value: string) {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function LogsPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [level, setLevel] = useState<LogLevel | null>(null);
  const [clientIdentifier, setClientIdentifier] = useState('');
  const [namespace, setNamespace] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const queryKey = useMemo(
    () => [
      'admin',
      'logs',
      {
        page: pagination.page,
        limit: pagination.limit,
        level,
        clientIdentifier,
        namespace,
        start: dateRange[0]?.toISOString() ?? null,
        end: dateRange[1]?.toISOString() ?? null,
      },
    ],
    [pagination, level, clientIdentifier, namespace, dateRange]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      logsApi.list({
        page: pagination.page,
        limit: pagination.limit,
        level,
        clientIdentifier: clientIdentifier.trim() || undefined,
        namespace: namespace.trim() || undefined,
        startDate: dateRange[0]?.toISOString() ?? undefined,
        endDate: dateRange[1]?.toISOString() ?? undefined,
      }),
    keepPreviousData: true,
  });

  const handlePaginationChange = useCallback((config: TablePaginationConfig) => {
    setPagination({
      page: config.current ?? 1,
      limit: config.pageSize ?? 20,
    });
  }, []);

  const columns = useMemo<ColumnsType<ClientLog>>(
    () => [
      {
        title: '时间',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (value: string) => (
          <Space direction="vertical" size={0}>
            <Text strong>{formatTimestamp(value)}</Text>
          </Space>
        ),
      },
      {
        title: '等级',
        dataIndex: 'level',
        key: 'level',
        render: (value: LogLevel) => (
          <Tag color={LEVEL_COLORS[value]} style={{ minWidth: 64, textAlign: 'center' }}>
            {value}
          </Tag>
        ),
      },
      {
        title: '命名空间',
        dataIndex: 'namespace',
        key: 'namespace',
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: '消息内容',
        dataIndex: 'message',
        key: 'message',
        ellipsis: true,
        render: (value: string) => (
          <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2 }}>
            {value}
          </Paragraph>
        ),
      },
      {
        title: '客户端',
        key: 'client',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text>{record.clientIdentifier}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.appVersion} · {record.platform ?? '未知平台'}
            </Text>
          </Space>
        ),
      },
      {
        title: '接收时间',
        dataIndex: 'receivedAt',
        key: 'receivedAt',
        render: (value: string) => formatTimestamp(value),
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
            日志分析
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            查看客户端上报日志、筛选错误并定位问题。
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          刷新
        </Button>
      </Space>

      <Card bordered={false}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: '100%', marginBottom: 16 }}
        >
          <Space wrap>
            <Space>
              <Text strong>等级</Text>
              <Input.Group compact>
                <Button
                  type={level === null ? 'primary' : 'default'}
                  onClick={() => {
                    setLevel(null);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  全部
                </Button>
                {LEVEL_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <Button
                    key={option.value}
                    type={level === option.value ? 'primary' : 'default'}
                    onClick={() => {
                      setLevel(option.value as LogLevel);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Input.Group>
            </Space>
            <Search
              allowClear
              placeholder="客户端 ID"
              style={{ width: 200 }}
              onSearch={(value) => {
                setClientIdentifier(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
            <Search
              allowClear
              placeholder="命名空间"
              style={{ width: 200 }}
              onSearch={(value) => {
                setNamespace(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
            <RangePicker
              showTime
              allowEmpty={[true, true]}
              value={dateRange}
              onChange={(value) => {
                setDateRange(value ?? [null, null]);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </Space>
        </Space>

        <Table<ClientLog>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={tableData}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total,
            showSizeChanger: true,
            showTotal: (tot) => `共 ${tot} 条日志`,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          onChange={handlePaginationChange}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '12px 0' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>日志消息</Text>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {record.message}
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>Args</Text>
                    <pre style={{ margin: 0, background: '#f5f5f5', padding: 12 }}>
                      {stringify(record.args)}
                    </pre>
                  </div>
                  <div>
                    <Text strong>Context</Text>
                    <pre style={{ margin: 0, background: '#f5f5f5', padding: 12 }}>
                      {stringify(record.context)}
                    </pre>
                  </div>
                </Space>
              </div>
            ),
          }}
        />
      </Card>
    </Space>
  );
}
