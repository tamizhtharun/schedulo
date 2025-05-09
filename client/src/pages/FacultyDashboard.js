import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import SubmitWillingness from './SubmitWillingness';
import { BarsOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import FacultyOwnTimetable from './FacultyOwnTimetable';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState('default');

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'Willingness':
        return <SubmitWillingness />;
      case 'Faculty Own Timetable':
        return <FacultyOwnTimetable />;
      default:
        return <h2>Welcome to the Faculty Dashboard</h2>;
    }
  };

  // Only show Submit Willingness menu if user role is faculty or HOD
  // Remove role check to show Submit Willingness for all users
  // const allowedRoles = ['faculty', 'hod'];
  // const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  // const canSubmitWillingness = allowedRoles.some(role =>
  //   userRoles.some(userRole => userRole?.toLowerCase() === role.toLowerCase())
  // );

  const menuItems = [
    { key: 'Faculty Own Timetable', label: 'My Timetable', icon: <BarsOutlined /> },
    { key: 'Willingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> },
  ];

  // if (canSubmitWillingness) {
  //   menuItems.push({ key: 'Willingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> });
  // }

  return (
    <MainLayout
      headerTitle="Faculty Dashboard" // Pass the header title
      menuItems={menuItems}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};

export default FacultyDashboard;
