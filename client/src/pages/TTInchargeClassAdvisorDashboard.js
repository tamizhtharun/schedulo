import React from 'react';
import { Card, Row, Col, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const TTInchargeClassAdvisorDashboard = () => {
  return (
    <div style={{ padding: 24, minHeight: '80vh' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={2}>TT Incharge & Class Advisor Dashboard</Title>
            <Paragraph>
              Welcome! You have both TT Incharge and Class Advisor privileges.<br />
              Please select a section below to proceed:
            </Paragraph>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Card hoverable onClick={() => window.location.href = '/ttincharge-dashboard'} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <Title level={4}>TT Incharge Section</Title>
                  <Paragraph>Access all timetable management and TT Incharge features.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card hoverable onClick={() => window.location.href = '/classadvisor-dashboard'} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <Title level={4}>Class Advisor Section</Title>
                  <Paragraph>Access class advisor features and manage your assigned classes.</Paragraph>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TTInchargeClassAdvisorDashboard;
