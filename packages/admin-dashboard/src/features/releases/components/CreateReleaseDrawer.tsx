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
  Typography,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ReleaseChannel,
  Platform,
  Arch,
} from '@booltox/shared';
import type { CreateReleasePayload } from '../types';
import { RELEASE_CHANNEL_META } from '../utils';

const { Text } = Typography;

interface CreateReleaseDrawerProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReleasePayload) => Promise<void>;
}

interface CreateReleaseFormValues {
  version: string;
  channel: ReleaseChannel;
  notes?: string;
  mandatory: boolean;
  rolloutPercent: number;
  assets: Array<{
    platform: Platform;
    architecture: Arch;
    downloadUrl: string;
    checksum: string;
    signature?: string;
    sizeBytes?: number;
  }>;
}

const CHANNEL_OPTIONS = [
  { label: RELEASE_CHANNEL_META[ReleaseChannel.STABLE].label, value: ReleaseChannel.STABLE },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.BETA].label, value: ReleaseChannel.BETA },
  { label: RELEASE_CHANNEL_META[ReleaseChannel.ALPHA].label, value: ReleaseChannel.ALPHA },
];

const PLATFORM_OPTIONS = [
  { label: 'Windows', value: Platform.WINDOWS },
  { label: 'macOS', value: Platform.MACOS },
  { label: 'Linux', value: Platform.LINUX },
];

const ARCH_OPTIONS = [
  { label: 'x64', value: Arch.X64 },
  { label: 'arm64', value: Arch.ARM64 },
];

export function CreateReleaseDrawer({
  open,
  loading,
  onClose,
  onSubmit,
}: CreateReleaseDrawerProps) {
  const [form] = Form.useForm<CreateReleaseFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        channel: ReleaseChannel.STABLE,
        mandatory: false,
        rolloutPercent: 100,
        assets: [
          {
            platform: Platform.WINDOWS,
            architecture: Arch.X64,
            downloadUrl: '',
            checksum: '',
          },
        ],
      });
    } else {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Drawer
      title="新建版本"
      width={720}
      open={open}
      destroyOnClose
      maskClosable={false}
      onClose={onClose}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
          >
            创建
          </Button>
        </Space>
      }
    >
      <Form<CreateReleaseFormValues>
        layout="vertical"
        form={form}
        onFinish={async (values) => {
          const payload: CreateReleasePayload = {
            version: values.version.trim(),
            channel: values.channel,
            notes: values.notes?.trim() ? values.notes.trim() : undefined,
            mandatory: values.mandatory,
            rolloutPercent: values.rolloutPercent,
            assets: values.assets.map((asset) => ({
              platform: asset.platform,
              architecture: asset.architecture,
              downloadUrl: asset.downloadUrl.trim(),
              checksum: asset.checksum.trim(),
              signature: asset.signature?.trim() ? asset.signature.trim() : undefined,
              sizeBytes: Number(asset.sizeBytes ?? 0),
            })),
          };
          await onSubmit(payload);
        }}
      >
        <Form.Item
          name="version"
          label="版本号"
          rules={[{ required: true, message: '请输入版本号' }]}
        >
          <Input placeholder="例如：1.4.0" />
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

        <Form.List name="assets" rules={[{ validator: async (_, value) => {
          if (!value || value.length === 0) {
            return Promise.reject(new Error('请至少添加一个安装包资产'));
          }
          return Promise.resolve();
        } }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              <Space align="center" style={{ marginBottom: 8 }}>
                <Text strong>资产信息</Text>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      platform: Platform.WINDOWS,
                      architecture: Arch.X64,
                      downloadUrl: '',
                      checksum: '',
                    })
                  }
                >
                  添加资产
                </Button>
              </Space>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  direction="vertical"
                  style={{
                    border: '1px solid #f0f0f0',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 16,
                    width: '100%',
                  }}
                >
                  <Space
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Text type="secondary">资产 #{key + 1}</Text>
                    {fields.length > 1 ? (
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        移除
                      </Button>
                    ) : null}
                  </Space>
                  <Form.Item
                    {...restField}
                    name={[name, 'platform']}
                    label="平台"
                    rules={[{ required: true, message: '请选择平台' }]}
                  >
                    <Select options={PLATFORM_OPTIONS} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'architecture']}
                    label="架构"
                    rules={[{ required: true, message: '请选择架构' }]}
                  >
                    <Select options={ARCH_OPTIONS} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'downloadUrl']}
                    label="下载地址"
                    rules={[
                      { required: true, message: '请输入下载地址' },
                      { type: 'url', message: '请输入合法的 URL' },
                    ]}
                  >
                    <Input placeholder="https://..." />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'checksum']}
                    label="文件校验值"
                    rules={[{ required: true, message: '请输入文件校验值' }]}
                  >
                    <Input placeholder="SHA256 校验值" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'signature']}
                    label="签名"
                  >
                    <Input placeholder="可选" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'sizeBytes']}
                    label="文件大小 (字节)"
                    rules={[{ required: true, message: '请输入文件大小' }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Space>
              ))}
              <Form.ErrorList errors={errors} />
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
}
