import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Typography, Spin, Alert, message } from 'antd';
import TimetableGrid from '../components/TimetableGrid';
import API_BASE_URL from '../api/config';

const { Title, Text } = Typography;

const LabTimetable = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [labTimetable, setLabTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch labs on mount
  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL + '/labs', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch labs');
      const data = await response.json();
      const transformed = data.map(lab => ({ ...lab, key: lab._id }));
      setLabs(transformed);
    } catch (error) {
      console.error('Error fetching labs:', error);
      message.error('Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  const handleLabChange = async (labId) => {
    setSelectedLab(labId);
    if (!labId) {
      setLabTimetable([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL + '/lab-timetables/lab/' + labId, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch lab timetable');
      const data = await response.json();

      // Merge fetched timetable with all weekdays
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const hourNames = [
        'firstHour', 'secondHour', 'thirdHour', 'fourthHour',
        'fifthHour', 'sixthHour', 'seventhHour'
      ];

      const mergedTimetable = allDays.map(day => {
        const dayEntry = data.find(d => d.day === day);
        if (dayEntry) {
          return dayEntry;
        } else {
          // Create empty day entry
          const emptyDay = { day };
          hourNames.forEach(hour => {
            emptyDay[hour] = { subject: null, class: null };
          });
          return emptyDay;
        }
      });

      setLabTimetable(mergedTimetable);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching lab timetable:', error);
      message.error('Failed to fetch lab timetable');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Lab Name',
      dataIndex: 'labName',
      key: 'labName',
      render: (text, record) => record.labName || 'Unnamed Lab'
    },
    {
      title: 'Lab Number',
      dataIndex: 'labNumber',
      key: 'labNumber',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => handleLabChange(record._id)}>
          View Lab Timetable
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Lab Timetables</Title>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        View individual lab timetables for labs.
      </Text>

      <Table
        columns={columns}
        dataSource={labs}
        loading={loading}
        rowKey="key"
        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
      />

      <Modal
        title={`Lab Timetable for Lab`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading timetable...</div>
          </div>
        ) : labTimetable && labTimetable.length > 0 ? (
          <TimetableGrid timetables={labTimetable} useAcronyms={true} />
        ) : (
          <Alert
            message="No timetable available"
            description="No lab timetable has been created for this lab yet."
            type="info"
          />
        )}
      </Modal>
    </div>
  );
};

export default LabTimetable;
