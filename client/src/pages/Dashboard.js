import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Descriptions, 
  Tag, 
  Alert, 
  Progress, 
  Divider, 
  List, 
  Avatar, 
  Skeleton 
} from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined, ClockCircleOutlined, PieChartOutlined } from '@ant-design/icons';
import API_BASE_URL from '../api/config';
import axios from '../api/axios';
import notify from '../utils/notify';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalFaculties: 0,
    totalSubjects: 0,
    totalStudents: 0,
  });
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        setUser(currentUser);
        
        // Fetch statistics based on user role
        const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
        setStats(response.data);
      } catch (error) {
        notify('error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderRoleSpecificContent = () => {
    if (!user || loading) return null;

    switch (user.role.toLowerCase()) {
      case 'hod':
        return (
          <Card title="Department Overview" style={{ marginTop: 16 }}>
            <Descriptions bordered>
              <Descriptions.Item label="Department">{user.department}</Descriptions.Item>
              <Descriptions.Item label="Total Faculties" span={2}>
                <Statistic value={stats.totalFaculties} prefix={<TeamOutlined />} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Classes" span={2}>
                <Statistic value={stats.totalClasses} prefix={<ClockCircleOutlined />} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Subjects" span={2}>
                <Statistic value={stats.totalSubjects} prefix={<BookOutlined />} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        );
      case 'admin':
        return (
          <Card title="System Overview" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Total Users"
                  value={stats.totalUsers}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Active Departments"
                  value={stats.totalDepartments}
                  prefix={<PieChartOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Classes"
                  value={stats.totalClasses}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Subjects"
                  value={stats.totalSubjects}
                  prefix={<BookOutlined />}
                />
              </Col>
            </Row>
          </Card>
        );
      default:
        return (
          <Card title="Quick Actions" style={{ marginTop: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: 'View My Timetable', icon: <ClockCircleOutlined /> },
                { title: 'Update Profile', icon: <UserOutlined /> },
                { title: 'View Department Stats', icon: <PieChartOutlined /> },
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={item.icon} />}
                    title={item.title}
                  />
                </List.Item>
              )}
            />
          </Card>
        );
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col span={24}>
          <Card>
            <Title level={3}>Welcome, {user?.name || 'User'}</Title>
            {user?.role && (
              <Tag color="blue" style={{ marginBottom: 16 }}>
                {user.role.toUpperCase()}
              </Tag>
            )}
            
            <Paragraph>
              This dashboard provides you with a quick overview of your responsibilities and important metrics.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          {loading ? (
            <Skeleton active />
          ) : (
            renderRoleSpecificContent()
          )}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Quick Links">
            <List
              grid={{ gutter: 16, column: 4 }}
              dataSource={[
                { title: 'Manage Classes', path: '/manage-classes' },
                { title: 'Manage Subjects', path: '/manage-subjects' },
                { title: 'Manage Faculties', path: '/manage-faculties' },
                { title: 'Timetables', path: '/timetables' },
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
