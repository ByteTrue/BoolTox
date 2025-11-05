import { useState } from 'react';
import {
  AppstoreOutlined,
  DashboardOutlined,
  NotificationOutlined,
  RocketOutlined,
  DatabaseOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/releases', icon: <RocketOutlined />, label: '版本发布' },
  { key: '/modules', icon: <AppstoreOutlined />, label: '模块管理' },
  { key: '/announcements', icon: <NotificationOutlined />, label: '公告中心' },
  { key: '/logs', icon: <DatabaseOutlined />, label: '日志分析' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const selectedMenuKey = menuItems.find((item) => {
    if (!item || typeof item.key !== 'string') return false;
    if (item.key === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.key);
  })?.key;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => navigate(key);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <Space direction="vertical" size={2}>
          <Text strong>{user?.displayName ?? user?.email ?? '未命名用户'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.roles.join(' / ')}
          </Text>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        await logout();
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{
          boxShadow: '2px 0 8px rgba(15, 23, 42, 0.06)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '0 16px',
            color: '#1f2937',
            fontWeight: 600,
            fontSize: collapsed ? 16 : 18,
          }}
        >
          {collapsed ? 'BoolTox' : 'BoolTox 管理后台'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          items={menuItems}
          selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
          onClick={handleMenuClick}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
          />
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                {user?.displayName?.charAt(0)?.toUpperCase() ??
                  user?.email?.charAt(0)?.toUpperCase() ??
                  'A'}
              </Avatar>
              <Text>{user?.displayName ?? user?.email ?? '未命名用户'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ padding: '24px 32px', background: '#f6f7fb' }}>
          <div
            style={{
              minHeight: 'calc(100vh - 120px)',
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
