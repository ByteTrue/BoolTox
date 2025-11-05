import { useEffect } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Radio, Space, Typography } from 'antd';
import type {
  SyncGitHubReleasePayload,
  SyncGitHubReleaseMode,
} from '../types';

const { Paragraph, Text } = Typography;

interface SyncGitHubModalProps {
  open: boolean;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (payload: SyncGitHubReleasePayload) => Promise<void>;
}

interface SyncGitHubFormValues {
  mode: SyncGitHubReleaseMode;
  tag?: string;
  limit?: number;
}

export function SyncGitHubModal({ open, confirmLoading, onCancel, onSubmit }: SyncGitHubModalProps) {
  const [form] = Form.useForm<SyncGitHubFormValues>();
  const mode = Form.useWatch('mode', form);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ mode: 'latest', tag: undefined, limit: undefined });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const { mode: selectedMode, tag, limit } = await form.validateFields();
      const payload: SyncGitHubReleasePayload =
        selectedMode === 'tag'
          ? { mode: 'tag', tag: tag!.trim() }
          : selectedMode === 'all'
            ? { mode: 'all', limit }
            : { mode: 'latest' };

      await onSubmit(payload);
    } catch (error) {
      if (error instanceof Error) {
        // 已由 Form 显示错误，此处无需额外处理
        return;
      }
    }
  };

  return (
    <Modal
      open={open}
      title="同步 GitHub Release"
      okText="开始同步"
      cancelText="取消"
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      centered
      maskClosable={!confirmLoading}
      destroyOnClose
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="同步说明"
          description={
            <Paragraph style={{ marginBottom: 0 }}>
              根据选择的范围触发后台同步任务。同步完成后，版本列表会自动刷新。
            </Paragraph>
          }
        />
        <Form form={form} layout="vertical" initialValues={{ mode: 'latest' }}>
          <Form.Item label="同步范围" name="mode" rules={[{ required: true, message: '请选择同步范围' }]}>
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="latest">
                  <Text strong>最新 Release</Text>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    仅同步 GitHub 上的最新版本。
                  </Paragraph>
                </Radio>
                <Radio value="tag">
                  <Text strong>指定 Tag</Text>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    按照标签名称同步单个 Release。
                  </Paragraph>
                </Radio>
                <Radio value="all">
                  <Text strong>所有 Release</Text>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    批量同步历史版本，可选数量上限。
                  </Paragraph>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          {mode === 'tag' && (
            <Form.Item
              label="Git Tag"
              name="tag"
              rules={[
                { required: true, message: '请输入要同步的 tag' },
                {
                  validator: async (_, value: unknown) => {
                    if (typeof value === 'string' && value.trim().length > 0) {
                      return;
                    }
                    throw new Error('Tag 不能为空');
                  },
                },
              ]}
            >
              <Input placeholder="例如 v1.2.3" autoFocus />
            </Form.Item>
          )}
          {mode === 'all' && (
            <Form.Item
              label="同步数量上限（可选）"
              name="limit"
              extra="留空则同步所有历史版本。"
              rules={[
                {
                  validator: async (_, value: unknown) => {
                    if (value === undefined || value === null || value === '') {
                      return;
                    }
                    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
                      return;
                    }
                    throw new Error('请输入大于 0 的整数，或留空');
                  },
                },
              ]}
            >
              <InputNumber min={1} precision={0} placeholder="默认同步全部" style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>
      </Space>
    </Modal>
  );
}
