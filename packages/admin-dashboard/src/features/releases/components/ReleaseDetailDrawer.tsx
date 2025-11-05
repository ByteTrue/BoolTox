import {
  Badge,
  Descriptions,
  Drawer,
  List,
  Space,
  Tag,
  Typography,
  Spin,
} from 'antd';
import type { ReleaseDetail } from '../types';
import { formatReleaseDate, RELEASE_CHANNEL_META } from '../utils';

const { Text } = Typography;

interface ReleaseDetailDrawerProps {
  open: boolean;
  loading: boolean;
  release: ReleaseDetail | null;
  onClose: () => void;
}

export function ReleaseDetailDrawer({
  open,
  loading,
  release,
  onClose,
}: ReleaseDetailDrawerProps) {
  return (
    <Drawer
      title="版本详情"
      width={640}
      open={open}
      destroyOnClose
      onClose={onClose}
    >
      {loading ? (
        <Space
          direction="vertical"
          align="center"
          style={{ width: '100%', marginTop: 40 }}
        >
          <Spin />
          <Text type="secondary">正在加载版本详情...</Text>
        </Space>
      ) : release ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="版本号">{release.version}</Descriptions.Item>
            <Descriptions.Item label="发布渠道">
              <Tag color={RELEASE_CHANNEL_META[release.channel].color}>
                {RELEASE_CHANNEL_META[release.channel].label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="强制更新">
              <Badge color={release.mandatory ? 'red' : 'green'} text={release.mandatory ? '是' : '否'} />
            </Descriptions.Item>
            <Descriptions.Item label="灰度比例">
              {release.rolloutPercent}%
            </Descriptions.Item>
            <Descriptions.Item label="发布时间">
              {formatReleaseDate(release.publishedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatReleaseDate(release.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新说明">
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: 0,
                }}
              >
                {release.notes || '—'}
              </pre>
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Text strong>资产列表</Text>
            <List
              style={{ marginTop: 12 }}
              dataSource={release.assets}
              renderItem={(asset) => (
                <List.Item key={asset.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{asset.platform}</Tag>
                        <Tag color="geekblue">{asset.architecture}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">下载地址：{asset.downloadUrl}</Text>
                        <Text type="secondary">校验值：{asset.checksum}</Text>
                        <Text type="secondary">
                          文件大小：{Number(asset.sizeBytes).toLocaleString()} 字节
                        </Text>
                        {asset.signature ? (
                          <Text type="secondary">签名：{asset.signature}</Text>
                        ) : null}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Space>
      ) : (
        <Text type="secondary">未找到版本信息。</Text>
      )}
    </Drawer>
  );
}
