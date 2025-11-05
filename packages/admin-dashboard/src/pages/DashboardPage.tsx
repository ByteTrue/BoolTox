import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { useMemo } from 'react';
import {
  AppstoreOutlined,
  NotificationOutlined,
  RocketOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const stats = [
  { key: 'releases', title: '发布版本', value: 0, icon: <RocketOutlined />, color: '#1677ff' },
  { key: 'modules', title: '模块数量', value: 0, icon: <AppstoreOutlined />, color: '#52c41a' },
  { key: 'announcements', title: '公告数量', value: 0, icon: <NotificationOutlined />, color: '#faad14' },
  { key: 'logs', title: '今日日志', value: 0, icon: <DatabaseOutlined />, color: '#eb2f96' },
];

export function DashboardPage() {
  const statItems = useMemo(
    () =>
      stats.map((item) => (
        <Col key={item.key} xs={24} sm={12} xl={6}>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <Space size="large">
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  fontSize: 22,
                }}
              >
                {item.icon}
              </span>
              <Statistic title={item.title} value={item.value} />
            </Space>
          </Card>
        </Col>
      )),
    []
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>控制台概览</Title>
        <Paragraph type="secondary">
          欢迎使用 BoolTox 后台管理系统，后续将在此展示实时指标和任务状态。
        </Paragraph>
      </div>
      <Row gutter={[24, 24]}>{statItems}</Row>
      <Card title="快速指引" bordered={false}>
        <Paragraph>
          当前展示的是占位数据。完成服务端 API 对接后，这里将显示发布、模块、公告与日志等核心指标。
        </Paragraph>
        <Paragraph>
          推荐先完成管理员账号准备，随后在“系统设置”中配置 API 与告警策略。
        </Paragraph>
      </Card>
    </Space>
  );
}
