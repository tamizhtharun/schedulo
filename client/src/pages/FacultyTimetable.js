import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Spin, Space, message, 
  Alert, notification, Typography, Tag,
  Tooltip
} from 'antd';
import axios from '../api/axios';
import API_BASE_URL from '../api/config';

const { Title, Text } = Typography;

/**
 * FacultyTimetable Component - Manages faculty timetables for HODs and TTIncharge users
 * Supports viewing faculty timetables with subject acronyms, class details, and venue information
 * Only shows faculties that belong to the department of the logged-in user
 */
const FacultyTimetable = () => {
  // State variables
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Constants
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

  const debugLocalStorageUser = () => {
    const userString = localStorage.getItem('user');
    //console.log('Raw user string from localStorage:', userString);
    
    try {
      const user = JSON.parse(userString);
      //console.log('Parsed user object:', user);
      //console.log('User department data:', user.department);
      //console.log('Department type:', typeof user.department);
      
      if (user.department) {
        //console.log('Department keys:', Object.keys(user.department));
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };
  
  // Get current user from localStorage and fetch data
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      message.warning('User session not found. Please log in again.');
      return;
    }

    try {
      const user = JSON.parse(userString);
      //console.log('Loaded user data:', user);
      
      // Validate user data
      if (!user || !user._id || !user.role) {
        message.error('Invalid user data. Please log out and log in again.');
        return;
      }

      // Check if user has required roles
      const roles = Array.isArray(user.role) ? user.role : [user.role];
      const allowedRoles = ['Admin', 'HOD', 'TTIncharge'];
      const hasAllowedRole = roles.some(role => allowedRoles.includes(role));
      
      if (!hasAllowedRole) {
        message.error('You do not have access to this page.');
        return;
      }

      setCurrentUser(user);
      
      // Fetch faculties immediately after setting current user
      fetchFaculties();
      fetchSubjects();
      fetchClasses();
    } catch (error) {
      console.error('Error loading user data:', error);
      message.error('Error retrieving user data');
    }
  }, []);

  // Updated  // Fetch faculties from backend with department filtering
  const fetchFaculties = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        message.error('User information not found');
        return;
      }

      // Check if user has a department (only for non-admins)
      const isAdmin = Array.isArray(userData.role) ? userData.role.includes('Admin') : userData.role === 'Admin';
      if (!isAdmin && (!userData.department || !userData.department._id)) {
        //console.log('User department data:', userData.department);
        message.error('Department information not found. Please log out and log in again.');
        return;
      }

      // Clear any existing token header since we're using session auth
      delete axios.defaults.headers.common['Authorization'];

      // Use the faculty endpoint which handles department filtering based on user role
      const response = await axios.get('/faculty', {
        withCredentials: true, // Send cookies with the request
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Log response for debugging
      //console.log('Faculty response:', response.data);
      //console.log('Current user data:', userData);
      
      // Transform data for table
      if (response.data && Array.isArray(response.data)) {
        // Filter faculties based on user role
        const filteredFaculties = isAdmin 
          ? response.data // Admins see all faculties
          : response.data
            .filter(faculty => {
              // Log for debugging
              //console.log('Checking faculty:', faculty.username);
              //console.log('Faculty department:', faculty.department);
              
              // Get department ID from faculty
              const facultyDeptId = faculty.department?._id || faculty.department;
              
              // Get department ID from current user
              const currentDeptId = userData.department._id;
              
              // Compare department IDs
              return facultyDeptId === currentDeptId;
            })
            .map(faculty => ({
              ...faculty,
              key: faculty._id
            }));
        
        //console.log('Filtered faculties:', filteredFaculties);
        setFaculties(filteredFaculties);
      } else {
        message.info(isAdmin ? 'No faculties found.' : 'No faculties found in your department.');
        setFaculties([]);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      if (error.response) {
        message.error(error.response.data.message || 'Failed to fetch faculties');
      } else {
        message.error('Failed to fetch faculties');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract department ID from various formats
  const extractDepartmentId = (department) => {
    if (!department) return null;
    if (typeof department === 'string') {
      return department;
    }
    
    if (typeof department === 'object') {
      if (department._id) {
        return department._id;
      }
      
      if (department.$oid) {
        return department.$oid;
      }
    }
    
    return null;
  };

  // Function to fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        message.error('User information not found');
        return;
      }

      // Clear any existing token header since we're using session auth
      delete axios.defaults.headers.common['Authorization'];

      // Use the appropriate endpoint based on user role
      const isAdmin = Array.isArray(userData.role) ? userData.role.includes('Admin') : userData.role === 'Admin';
      const endpoint = isAdmin ? '/subjects/all' : '/subjects';
      
      //console.log('Fetching subjects from:', endpoint);
      
      const response = await axios.get(endpoint, {
        withCredentials: true, // Send cookies with the request
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Log response for debugging
      //console.log('Subjects response:', response.data);
      
      // Transform data for use
      if (response.data && Array.isArray(response.data)) {
        setSubjects(response.data.map(sub => ({
          ...sub,
          key: sub._id
        })));
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      if (error.response) {
        message.error(error.response.data.message || 'Failed to fetch subjects');
      } else {
        message.error('Failed to fetch subjects');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        message.error('User information not found');
        return;
      }

      // Clear any existing token header since we're using session auth
      delete axios.defaults.headers.common['Authorization'];

      // Use the appropriate endpoint based on user role
      const isAdmin = Array.isArray(userData.role) ? userData.role.includes('Admin') : userData.role === 'Admin';
      const endpoint = isAdmin ? '/classes/all' : '/classes';
      
      //console.log('Fetching classes from:', endpoint);
      
      const response = await axios.get(endpoint, {
        withCredentials: true, // Send cookies with the request
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Log response for debugging
      //console.log('Classes response:', response.data);
      
      // Transform data for use
      if (response.data && Array.isArray(response.data)) {
        setClasses(response.data.map(cls => ({
          ...cls,
          key: cls._id
        })));
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      if (error.response) {
        message.error(error.response.data.message || 'Failed to fetch classes');
      } else {
        message.error('Failed to fetch classes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get subject acronym helper function
  const getSubjectAcronym = (subjectId) => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return subjectId; // Return ID if subject not found
    return subject.acronym || subject.subjectName?.split(' ').map(word => word.charAt(0).toUpperCase()).join('') || subjectId;
  };
  

  // Get full subject name helper function
  const getSubjectFullName = (subjectId) => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return subjectId; // Return ID if subject not found
    return subject.subjectName || subject.name || subjectId;
  };

  // Get class details helper function
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

  // Format class name for display
  const formatClassForDisplay = (classId) => {
    if (!classId) return 'N/A';
    
    const details = getClassDetails(classId);
    let displayText = `${details.year} ${details.className}`;
    if (details.section) {
      displayText += `/${details.section}`;
    }
    
    return displayText;
  };

  // Display the timetable view modal
  const showViewModal = async (faculty) => {
    try {
      setModalLoading(true);
      setSelectedFaculty(faculty);
      setIsViewModalVisible(true);
      
      // Fetch timetable for the selected faculty
      const response = await axios.get(`/faculty-timetables/faculty/${faculty._id}`);
      console.log('Raw timetable response:', response.data); // Debug log
      console.log('First day data:', response.data.timetable[0]); // Debug log
      console.log('First hour data:', response.data.timetable[0]?.['firstHour']); // Debug log
      setSelectedTimetable(response.data.timetable);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      
      if (error.response && error.response.status === 404) {
        // No timetable found, show empty grid
        setSelectedTimetable([]);
        // message.info('No timetable found for this faculty');
      } else {
        message.error('Failed to fetch timetable');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Close view modal
  const handleViewCancel = () => {
    setIsViewModalVisible(false);
    setSelectedFaculty(null);
    setSelectedTimetable(null);
  };

  // Generate columns for the timetable grid
  const generateTimetableColumns = () => {
    return [
      {
        title: 'Day',
        dataIndex: 'day',
        key: 'day',
        width: 100,
        // height: 500,
        render: text => <strong>{text}</strong>,
        fixed: 'left',
      },
      ...hours.map((hour, index) => ({
        title: (
          <div style={{ whiteSpace: 'normal', lineHeight: '1.5',  }}>
            <strong>{hour.label} Hour</strong>
            <br />
            {hour.time}
          </div>
        ),
        dataIndex: hour.key,
        key: hour.key,
        width: 150,
        render: (hourData, record) => {
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

          const subjectAcronym = getSubjectAcronym(hourData.subject);
          const classDetails = getClassDetails(hourData.class);
          const venue = hourData.classVenue || classDetails.venue || '';

          return (
            <Tooltip title={
              <div key="tooltip-content">
                <p key="subject-info"><strong>Subject:</strong> {getSubjectFullName(hourData.subject)}</p>
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

  // Format timetable data for the grid
  const formatTimetableData = () => {
    if (!selectedTimetable || selectedTimetable.length === 0) {
      return days.map(day => ({
        key: day,
        day,
        ...hours.reduce((acc, hour) => {
          const hourKey = `${day}-${hour.key}`;
          acc[hour.key] = { 
            ...({ subject: null, class: null }),
            key: hourKey
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

// ... (rest of the code remains the same)
  // Table columns for faculty list
  const columns = [
    {
      title: 'S.no',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 80
    },
    {
      title: 'Faculty Name',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => text || record.name || 'N/A'
    },
    {
      title: 'Faculty ID',
      dataIndex: 'facultyId',
      key: 'facultyId',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => dept?.name || 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => showViewModal(record)}>
          View Timetable
        </Button>
      )
    }
  ];

  // Helper function to get department name
  const getDepartmentName = () => {
    if (!currentUser) return 'your';
    
    if (currentUser.department) {
      if (typeof currentUser.department === 'object' && currentUser.department.name) {
        return currentUser.department.name;
      }
    }
    
    // Try to find department name from the faculty list
    if (faculties.length > 0 && faculties[0].department && faculties[0].department.name) {
      return faculties[0].department.name;
    }
    
    return 'your';
  };

  const departmentName = getDepartmentName();
  const isAdminWithoutDept = currentUser?.role === 'admin' && 
                             (!currentUser.department || 
                              (typeof currentUser.department === 'object' && !currentUser.department.name));

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Faculty Timetables</Title>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          {isAdminWithoutDept 
            ? 'View timetables for all faculty members.'
            : `View timetables for faculty members in the department of`
          }
        </Text>
        {departmentName !== 'your' && !isAdminWithoutDept && (
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {departmentName}
          </Tag>
        )}
        {isAdminWithoutDept && (
          <Tag color="green" style={{ marginLeft: 8 }}>
            Admin View
          </Tag>
        )}
      </div>
      
      {/* {faculties.length === 0 && !loading && (
        <Alert
          message="No faculties found"
          description={isAdminWithoutDept 
            ? "No faculty records were found in the system."
            : `No faculty records were found in ${departmentName} department.`
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )} */}
      
      <Table 
        columns={columns} 
        dataSource={faculties} 
        loading={loading}
        rowKey="key"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50']
        }}
      />

      {/* View Timetable Modal */}
      <Modal
        title={selectedFaculty ? `Timetable for ${selectedFaculty.username || selectedFaculty.name || 'Faculty'}` : 'View Timetable'}
        open={isViewModalVisible}
        onCancel={handleViewCancel}
        footer={null}
        width={1100}
      >
        {modalLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading timetable...</div>
          </div>
        ) : (
          <>
            {/* {selectedFaculty && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Faculty: </Text>
                <Text>{selectedFaculty.username || selectedFaculty.name}</Text>
                <Text strong style={{ marginLeft: 16 }}>Department: </Text>
                <Text>{selectedFaculty.department?.name || 'N/A'}</Text>
              </div>
            )} */}
            
            <Table
              columns={generateTimetableColumns()}
              dataSource={formatTimetableData()}
              pagination={false}
              bordered
              // scroll={{ x: 1050 }}
              size="middle"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default FacultyTimetable;