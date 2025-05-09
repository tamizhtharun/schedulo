import React, { useState, useEffect } from 'react';
import { Typography, Spin, message, Tooltip, Table } from 'antd';
import axios from '../api/axios';
import TimetableGrid from '../components/TimetableGrid';
import './FacultyOwnTimetable.css';

const { Title } = Typography;

const FacultyOwnTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = [
    { key: 'firstHour', label: 'I', time: '8:45 AM - 9:45 AM' },
    { key: 'secondHour', label: 'II', time: '9:45 AM - 10:45 AM' },
    { key: 'thirdHour', label: 'III', time: '11:00 AM - 12:00 PM' },
    { key: 'fourthHour', label: 'IV', time: '12:00 PM - 1:00 PM' },
    { key: 'fifthHour', label: 'V', time: '1:45 PM - 2:45 PM' },
    { key: 'sixthHour', label: 'VI', time: '2:45 PM - 3:45 PM' },
    { key: 'seventhHour', label: 'VII', time: '3:45 PM - 4:45 PM' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userString = localStorage.getItem('user');
        if (!userString) {
          message.warning('User session not found. Please log in again.');
          setLoading(false);
          return;
        }
        const user = JSON.parse(userString);
        if (!user || !user._id) {
          message.error('Invalid user data. Please log out and log in again.');
          setLoading(false);
          return;
        }
        setCurrentUser(user);

        await Promise.all([fetchSubjects(user), fetchClasses(user)]);
        await fetchTimetable(user);
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Failed to load timetable data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchSubjects = async (user) => {
    try {
      setModalLoading(true);
      const isAdmin = Array.isArray(user.role) ? user.role.includes('Admin') : user.role === 'Admin';
      // Use non-admin endpoints for faculty users to avoid 403 errors
      const endpoint = isAdmin ? '/subjects/all' : '/subjects';

      const response = await axios.get(endpoint, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && Array.isArray(response.data)) {
        setSubjects(response.data.map(sub => ({ ...sub, key: sub._id })));
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      message.error('Failed to fetch subjects');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchClasses = async (user) => {
    try {
      setModalLoading(true);
      const isAdmin = Array.isArray(user.role) ? user.role.includes('Admin') : user.role === 'Admin';
      // Use non-admin endpoints for faculty users to avoid 403 errors
      const endpoint = isAdmin ? '/classes/all' : '/classes';

      const response = await axios.get(endpoint, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && Array.isArray(response.data)) {
        setClasses(response.data.map(cls => ({ ...cls, key: cls._id })));
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      message.error('Failed to fetch classes');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchTimetable = async (user) => {
    try {
      setModalLoading(true);
        const response = await axios.get(`/faculty-timetables/me`, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.timetable) {
          setSelectedTimetable(response.data.timetable);
        } else {
          setSelectedTimetable([]);
          message.info('No timetable found for you.');
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        if (error.response && error.response.status === 404) {
          message.info('No timetable found for you.');
          setSelectedTimetable([]);
        } else {
          message.error('Failed to fetch timetable.');
        }
      } finally {
        setModalLoading(false);
      }
    };

  const getSubjectAcronym = (subjectId) => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return subjectId;
    return subject.acronym || subject.subjectName?.split(' ').map(word => word.charAt(0).toUpperCase()).join('') || subjectId;
  };

  const getSubjectFullName = (subjectId) => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return subjectId;
    return subject.subjectName || subject.name || subjectId;
  };

  const getClassDetails = (classId) => {
    if (!classId) return { className: 'N/A', section: '', year: '', venue: 'N/A' };
    const classData = classes.find(cls => cls._id === classId);
    if (!classData) return { className: 'Unknown', section: '', year: '', venue: 'N/A' };
    return {
      className: classData.className || classData.department?.name || 'Unknown',
      section: classData.section !== 'N/A' ? classData.section : '',
      year: classData.year || '',
      venue: classData.classVenue || 'N/A'
    };
  };

  const generateTimetableColumns = () => {
    return [
      {
        title: 'Day',
        dataIndex: 'day',
        key: 'day',
        width: 100,
        render: text => <strong>{text}</strong>,
        fixed: 'left',
      },
      ...hours.map((hour) => ({
        title: (
          <div style={{ whiteSpace: 'normal', lineHeight: '1.5' }}>
            <strong>{hour.label} Hour</strong>
            <br />
            {hour.time}
          </div>
        ),
        dataIndex: hour.key,
        key: hour.key,
        width: 150,
        render: (hourData) => {
          if (!hourData || !hourData.subject) {
            return (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                -
              </div>
            );
          }

          // Determine subject acronym from subject object or ID
          let subjectAcronym = '-';
          if (hourData.subject) {
            if (typeof hourData.subject === 'object' && hourData.subject.acronym) {
              subjectAcronym = hourData.subject.acronym;
            } else {
              // Try to find subject in subjects array by ID
              const subjectObj = subjects.find(s => s._id === hourData.subject);
              subjectAcronym = subjectObj ? subjectObj.acronym || subjectObj.subjectName?.split(' ').map(word => word.charAt(0).toUpperCase()).join('') : hourData.subject;
            }
          }

          // Determine class details from class object or ID
          let classDetails = { className: 'N/A', section: '', year: '', venue: 'N/A' };
          if (hourData.class) {
            if (typeof hourData.class === 'object') {
              classDetails = {
                className: hourData.class.className || hourData.class.department?.name || 'Unknown',
                section: hourData.class.section !== 'N/A' ? hourData.class.section : '',
                year: hourData.class.year || '',
                venue: hourData.class.classVenue || 'N/A'
              };
            } else {
              // Find class in classes array by ID
              const classObj = classes.find(c => c._id === hourData.class);
              if (classObj) {
                classDetails = {
                  className: classObj.className || classObj.department?.name || 'Unknown',
                  section: classObj.section !== 'N/A' ? classObj.section : '',
                  year: classObj.year || '',
                  venue: classObj.classVenue || 'N/A'
                };
              }
            }
          }

          const venue = hourData.classVenue || classDetails.venue || '';

          return (
            <Tooltip title={
              <div key="tooltip-content">
                <p key="subject-info"><strong>Subject:</strong> {typeof hourData.subject === 'object' ? hourData.subject.subjectName : getSubjectFullName(hourData.subject)}</p>
                <p key="class-info"><strong>Class:</strong> {classDetails.year} {classDetails.className} {classDetails.section}</p>
                <p key="venue-info"><strong>Venue:</strong> {venue}</p>
              </div>
            }>
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }} key="timetable-cell-content">
                <div key="subject-acronym" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {subjectAcronym}
                </div>
                <div key="class-details" style={{ fontSize: '14px' }}>
                  {classDetails.year}/{classDetails.className}{classDetails.section ? `/${classDetails.section}` : ''}
                </div>
                <div key="venue" style={{ fontSize: '12px' }}>
                  {venue}
                </div>
              </div>
            </Tooltip>
          );
        }
      }))
    ];
  };

  const formatTimetableData = () => {
    if (!selectedTimetable || selectedTimetable.length === 0) {
      return days.map(day => ({
        key: day,
        day,
        ...hours.reduce((acc, hour) => {
          const hourKey = `${day}-${hour.key}`;
          acc[hour.key] = {
            subject: null,
            class: null,
            key: hourKey,
            classVenue: null
          };
          return acc;
        }, {})
      }));
    }

    return selectedTimetable.map(dayData => ({
      key: dayData.day,
      day: dayData.day,
      ...hours.reduce((acc, hour) => {
        const hourKey = `${dayData.day}-${hour.key}`;
        acc[hour.key] = {
          ...(dayData[hour.key] || { subject: null, class: null, classVenue: null }),
          key: hourKey,
          classVenue: dayData[hour.key]?.classVenue || ''
        };
        return acc;
      }, {})
    }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>My Timetable</Title>
      {loading || modalLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading timetable...</div>
        </div>
      ) : (
        <Table
          columns={generateTimetableColumns()}
          dataSource={formatTimetableData()}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 1050 }}
        />
      )}
    </div>
  );
};

export default FacultyOwnTimetable;
