import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import ManageFaculties from './ManageFaculties';
import ManageSubjects from './ManageSubjects';
import ManageClasses from './ManageClasses';
import ProtectedRoute from '../components/ProtectedRoute';
import TTIncharge from './TTIncharge';
import { TeamOutlined, BookOutlined, AppstoreOutlined, ScheduleOutlined, TableOutlined, BarsOutlined, CheckSquareOutlined, LaptopOutlined} from '@ant-design/icons';
import FacultyTimetable from './FacultyTimetable';
import Timetables from './Timetables';
import AssignSubjectFaculty from './AssignSubjectFaculty';
import FacultyOwnTimetable from './FacultyOwnTimetable';
import { Avatar } from 'antd';
import SubmitWillingness from './SubmitWillingness';
import ManageLabs from './ManageLabs';
// import Dashboard from './Dashboard';

const HODDashboard = () => {
  const [selectedOption, setSelectedOption] = useState('ManageFaculties'); // Default selected option

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'ManageFaculties':
        return <ManageFaculties />;
      case 'ManageSubjects':
        return <ManageSubjects />;
      case 'ManageClasses':
        return (
          <ProtectedRoute allowedRoles={['hod', 'admin']}>
            <ManageClasses />
            
          </ProtectedRoute>
        );
      case 'ManageLabs':
        return <ManageLabs />
      case 'TTIncharge':
        return <TTIncharge />;
      case 'Timetables':
        return <Timetables />;
      case 'facultyTimetable':
        return <FacultyTimetable />;
      case 'AssignFac':
        return <AssignSubjectFaculty />;
      case 'FacultyOwnTimetable':
        return <FacultyOwnTimetable />;
        case 'SubmitWillingness':
        return <SubmitWillingness />;
      default:
        return <h2>Welcome to the HOD Dashboard</h2>;
    }
  };

  return (
    <MainLayout
      headerTitle="HOD Dashboard" // Pass the header title
      menuItems={[
        // { key: 'Dashboard', label: 'Dashboard', icon: <TeamOutlined /> },
        { key: 'ManageFaculties', label: 'Manage Faculties', icon: <TeamOutlined /> },
        { key: 'ManageSubjects', label: 'Manage Subjects', icon: <BookOutlined /> },
        { key: 'ManageClasses', label: 'Manage Classes', icon: <AppstoreOutlined /> },
        {key: 'ManageLabs', label:'Manage Laboratories', icon: <LaptopOutlined />},
        { key: 'TTIncharge', label: 'TT Incharge', icon: <ScheduleOutlined /> },
        { key: 'Timetables', label: 'Class Timetables', icon: <TableOutlined /> },
        { key: 'facultyTimetable', label: 'Faculty Timetables', icon: <TableOutlined /> },
      { key: 'AssignFac', label: 'Assign Subject Faculties', icon: <AppstoreOutlined /> },
      { key: 'SubmitWillingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> },
      { key: 'FacultyOwnTimetable', label: 'My Timetable', icon: <BarsOutlined /> },
      ]}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};

export default HODDashboard;
