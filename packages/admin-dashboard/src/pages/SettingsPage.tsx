import { Card, Descriptions, Space, Typography } from 'antd';
import { useAuth } from '../features/auth/auth-context';

const { Title, Paragraph } = Typography;

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ marginBottom: 0 }}>
          系统设置
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          后续将在此配置 API 凭证、同步任务与安全策略。
        </Paragraph>
      </div>
      <Card title="当前账号" bordered={false}>
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="邮箱">{user?.email ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="显示名称">
            {user?.displayName ?? '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            {user?.roles.join(' / ') ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="权限数量">
            {user?.permissions.length ?? 0}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
