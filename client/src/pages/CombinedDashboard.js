import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import AssignSubjectFaculty from './AssignSubjectFaculty';
import Subjects from './Subjects';
import SubmitWillingness from './SubmitWillingness';
import FacultyTimetable from './FacultyTimetable';
import Timetables from './Timetables';
import { AppstoreOutlined, BarsOutlined, CheckSquareOutlined, TableOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const CombinedDashboard = () => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState('Subjects'); // Default selected option

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'Subjects':
        return <Subjects />;
      case 'AssignFac':
        return <AssignSubjectFaculty />;
      case 'SubmitWillingness':
        return <SubmitWillingness />;
      case 'facultyTimetable':
        return <FacultyTimetable />;
      case 'Timetables':
        return <Timetables />;
      case 'FacultyOwnTimetable':
        return <FacultyTimetable />;
      default:
        return <h2>Welcome to the Combined Dashboard</h2>;
    }
  };

  // Only show Submit Willingness menu if user role is faculty or HOD
  const allowedRolesForWillingness = ['faculty', 'hod'];
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const canSubmitWillingness = allowedRolesForWillingness.some(role =>
    userRoles.some(userRole => userRole?.toLowerCase() === role.toLowerCase())
  );

  const menuItems = [
    { key: 'Subjects', label: 'Class-Subjects', icon: <AppstoreOutlined /> },
    { key: 'AssignFac', label: 'Assign Subject Faculties', icon: <BarsOutlined /> },
    { key: 'Timetables', label: 'Timetables', icon: <BarsOutlined /> },
    { key: 'facultyTimetable', label: 'Faculty Timetable', icon: <TableOutlined /> },
    {key: 'FacultyOwnTimetable', label: 'Faculty Own Timetable', icon: <TableOutlined /> },
  ];

  if (canSubmitWillingness) {
    menuItems.push({ key: 'SubmitWillingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> });
  }

  return (
    <MainLayout
      headerTitle="Combined Dashboard" // Pass the header title
      menuItems={menuItems}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};

export default CombinedDashboard;
