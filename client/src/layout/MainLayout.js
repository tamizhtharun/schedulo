import React, { useState } from 'react';
import { Dropdown, Layout, Menu, Button, Grid } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  TeamOutlined,
  BookOutlined,
  AppstoreOutlined,
  ScheduleOutlined,
  TableOutlined,
  BarsOutlined,
  UserOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider, Content, Header } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = ({ children, menuItems, onMenuSelect, headerTitle }) => {
  const [collapsed, setCollapsed] = useState(false); // State to toggle sidebar
  const navigate = useNavigate();
  const screens = useBreakpoint(); // Get responsive breakpoints

  // Static menu items
  const defaultMenuItems = [
    { key: '1', label: 'Manage Faculties', path: '/manage-faculties', icon: <TeamOutlined /> },
    { key: '2', label: 'Manage Subjects', path: '/manage-subjects', icon: <BookOutlined /> },
    { key: '3', label: 'Manage Classes', path: '/manage-classes', icon: <AppstoreOutlined /> },
    { key: '4', label: 'TT Incharge', path: '/tt-incharge', icon: <ScheduleOutlined /> },
    { key: '5', label: 'Manage Timetables', path: '/manage-timetables', icon: <TableOutlined /> },
    { key: '6', label: 'Timetables', path: '/timetables', icon: <BarsOutlined /> },
    { key: '7', label: 'Subjects', path: '/subjects', icon: <AppstoreOutlined /> },
    { key: '8', label: 'Manage Labs', path: '/manage-labs', icon: <AppstoreOutlined /> },
    { key: '9', label: 'Submit Willingness', path: '/submit-willingness', icon: <CheckSquareOutlined /> }
  ];

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle Logout
  const handleLogout = () => {
    // Clear any stored data (if applicable)
    localStorage.clear();
    navigate('/'); // Redirect to the home or login page
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Collapsible Fixed Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed} // Automatically handle collapse
        trigger={null}
        width={250}
        theme="dark"
        breakpoint="lg" // Collapse automatically on smaller screens
        collapsedWidth={80} // Width when collapsed
        style={{
          position: 'fixed', // Fix the sidebar
          height: '100vh', // Full height
          left: 0, // Align to the left
          overflow: 'auto', // Enable scrolling if content overflows
          transition: 'width 0.3s ease', // Smooth transition for sidebar width
          zIndex: 1, // Ensure it stays above content
        }}
      >
        <div
          style={{
            height: '64px',
            margin: '16px',
            background: 'rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            lineHeight: '64px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'Sc..O' : 'ScheduLO'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          onClick={({ key }) => {
            const target = (menuItems || defaultMenuItems).find(item => item.key === key);
            if (target && target.path) {
              navigate(target.path);
            }
            if (onMenuSelect) onMenuSelect(key);
          }}
          items={(menuItems || defaultMenuItems).map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label
            // Removed onClick from here
          }))}
        />

      </Sider>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250, // Adjust margin for collapsed sidebar
          transition: 'margin-left 0.5s ease', // Smooth transition for content margin
          zIndex:'1000'
        }}
      >
        {/* Fixed Header */}
        <Header
          style={{
            position: 'fixed', // Fix the header
            width: `calc(100% - ${collapsed ? 80 : 250}px)`, // Adjust width based on sidebar state
            zIndex: 1000, // Ensure it stays above content
            background: '#fff',
            padding: screens.xs ? '0 8px' : '0 16px', // Adjust padding for smaller screens
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Add shadow for better visibility
            transition: 'width 0.3s ease', // Smooth transition for header width
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ fontSize: '18px' }}
          />
          <h2 style={{ margin: 0, fontSize: screens.xs ? '16px' : '24px' }}>{headerTitle}</h2>
          {/* Username with dropdown for logout */}
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu>
            }
            trigger={['hover']}
            placement="bottomRight"
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '2px 10px',
              borderRadius: '16px',
              transition: 'background 0.2s'
            }}>
              <UserOutlined style={{ fontSize: screens.xs ? 16 : 20, marginRight: 8, color: '#555' }} />
              <span style={{ fontWeight: 500, color: '#222', fontSize: screens.xs ? 12 : 16 }}>
                  {(() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  return user && user.username ? user.username : '';
                })()}
              </span>
            </span>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '80px 16px 16px', // Add margin to account for fixed header
            padding: screens.xs ? '8px' : '16px', // Adjust padding for smaller screens
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 96px)', // Ensure content fills the remaining space
            overflow: 'auto', // Enable scrolling for content
            transition: 'margin-left 0.3s ease', // Smooth transition for content margin
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
