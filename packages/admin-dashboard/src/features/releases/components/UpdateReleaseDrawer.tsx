import { useEffect } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  DatePicker,
  Spin,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ReleaseChannel } from '@booltox/shared';
import type { ReleaseDetail, UpdateReleasePayload } from '../types';
import { RELEASE_CHANNEL_META } from '../utils';

const { Text } = Typography;

interface UpdateReleaseDrawerProps {
  open: boolean;
  loading: boolean;
  loadingRelease: boolean;
  release: ReleaseDetail | null;
  onClose: () => void;
  onSubmit: (payload: UpdateReleasePayload) => Promise<void>;
}

interface UpdateReleaseFormValues {
  version: string;
  channel: ReleaseChannel;
  notes?: string;
  mandatory: boolean;
  rolloutPercent: number;
  publishedAt?: Dayjs | null;
}

const CHANNEL_OPTIONS = [
  { label: RELEASE_CHANNEL_META[ReleaseChannel.STABLE].label, value: ReleaseChannel.STABLE },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.BETA].label, value: ReleaseChannel.BETA },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.ALPHA].label, value: ReleaseChannel.ALPHA },
];

export function UpdateReleaseDrawer({
  open,
  loading,
  loadingRelease,
  release,
  onClose,
  onSubmit,
}: UpdateReleaseDrawerProps) {
  const [form] = Form.useForm<UpdateReleaseFormValues>();

  useEffect(() => {
    if (open && release) {
      form.setFieldsValue({
        channel: release.channel,
        notes: release.notes ?? '',
        mandatory: release.mandatory,
        rolloutPercent: release.rolloutPercent,
        publishedAt: release.publishedAt ? dayjs(release.publishedAt) : null,
      });
    }
    if (!open) {
      form.resetFields();
    }
  }, [form, open, release]);

  return (
    <Drawer
      title="编辑版本"
      width={560}
      open={open}
      destroyOnClose
      maskClosable={false}
      onClose={onClose}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => form.submit()} loading={loading} disabled={loadingRelease}>
            保存
          </Button>
        </Space>
      }
    >
      {loadingRelease ? (
        <Space
          direction="vertical"
          align="center"
          style={{ width: '100%', marginTop: 40 }}
        >
          <Spin />
          <Text type="secondary">正在加载版本详情...</Text>
        </Space>
      ) : (
        <Form<UpdateReleaseFormValues>
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            const payload: UpdateReleasePayload = {
              channel: values.channel,
              notes: values.notes?.trim() ?? undefined,
              mandatory: values.mandatory,
              rolloutPercent: values.rolloutPercent,
            };

            if (values.publishedAt) {
              payload.publishedAt = values.publishedAt.toISOString();
            }

            await onSubmit(payload);
          }}
        >
          <Form.Item label="版本号">
            <Input value={release?.version ?? ''} disabled />
          </Form.Item>

          <Form.Item
            name="channel"
            label="发布渠道"
            rules={[{ required: true, message: '请选择发布渠道' }]}
          >
            <Select options={CHANNEL_OPTIONS} />
          </Form.Item>

          <Form.Item name="notes" label="更新说明">
            <Input.TextArea rows={4} placeholder="可选，支持 Markdown" />
          </Form.Item>

          <Form.Item
            name="mandatory"
            label="强制更新"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="rolloutPercent"
            label="灰度比例"
            rules={[{ required: true, message: '请输入灰度比例' }]}
          >
            <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="publishedAt" label="发布时间">
            <DatePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm"
              allowClear
            />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
