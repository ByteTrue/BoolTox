import { useMemo } from 'react';
import { Button, Card, Checkbox, Form, Input, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import type { LoginPayload } from '../types';
import { useAuth } from '../auth-context';
import { extractApiErrorMessage } from '../../../shared/error';

const { Title, Text } = Typography;

export function LoginForm() {
  const [form] = Form.useForm<LoginPayload>();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async (payload: LoginPayload) => {
      await login(payload);
    },
  });

  const errorMessage = useMemo(() => {
    if (!mutation.isError) {
      return null;
    }
    return extractApiErrorMessage(mutation.error, '登录失败，请检查账号或密码。');
  }, [mutation.error, mutation.isError]);

  return (
    <Card
      style={{ width: 420 }}
      bordered={false}
      bodyStyle={{ padding: '2.5rem' }}
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            BoolTox 后台管理
          </Title>
          <Text type="secondary">使用管理员账号登录控制台</Text>
        </div>
      }
    >
      <Form<LoginPayload>
        form={form}
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入管理员邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' },
          ]}
        >
          <Input
            size="large"
            prefix={<MailOutlined />}
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入登录密码' }]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>保留登录状态</Checkbox>
        </Form.Item>

        {errorMessage ? (
          <Alert
            type="error"
            message={errorMessage}
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        ) : null}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={mutation.isPending}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
