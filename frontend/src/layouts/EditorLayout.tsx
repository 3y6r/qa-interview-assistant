import { Layout, Typography, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HistoryOutlined, SolutionOutlined } from '@ant-design/icons';
import styles from './EditorLayout.module.css';

const { Header, Content } = Layout;

const navItems = [
  { key: '/', icon: <SolutionOutlined />, label: 'Интервью' },
  { key: '/history', icon: <HistoryOutlined />, label: 'История' },
];

export function EditorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Typography.Title level={4}  className={styles.logo}>QA Interview Assistant</Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          className={styles.menu}
        />
      </Header>
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
