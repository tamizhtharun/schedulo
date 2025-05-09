import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import AssignSubjectFaculty from './AssignSubjectFaculty';
import Subjects from './Subjects';
import { AppstoreOutlined, BarsOutlined, CheckSquareOutlined } from '@ant-design/icons';
import SubmitWillingness from './SubmitWillingness'; // Import the new component
import { useAuth } from '../context/AuthContext';
import FacultyOwnTimetable from './FacultyOwnTimetable';

const ClassAdvisorDashboard = () => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState('ManageClasses'); // Default selected option

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'Subjects':
        return <Subjects />;
      case 'AssignFac':
        return <AssignSubjectFaculty />;
      case 'SubmitWillingness':
        return <SubmitWillingness />;
      case 'FacultyOwnTimetable':
        return <FacultyOwnTimetable />;
      default:
        return <h2>Welcome to the Class Advisor Dashboard</h2>;
    }
  };

  // Remove role check to show Submit Willingness for all users
  // const allowedRoles = ['faculty', 'hod'];
  // const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  // const canSubmitWillingness = allowedRoles.some(role =>
  //   userRoles.some(userRole => userRole?.toLowerCase() === role.toLowerCase())
  // );

  const menuItems = [
    { key: 'Subjects', label: 'Class-Subjects', icon: <AppstoreOutlined /> },
    // Removed AssignFac menu as per user feedback
    // { key: 'AssignFac', label: 'Assign Subject Faculties', icon: <BarsOutlined /> },
    { key: 'SubmitWillingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> },
    { key: 'FacultyOwnTimetable', label: 'My Timetable', icon: <BarsOutlined /> },
  ];

  // if (canSubmitWillingness) {
  //   menuItems.push({ key: 'SubmitWillingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> });
  // }

  return (
    <MainLayout
      headerTitle="Class Advisor Dashboard" // Pass the header title
      menuItems={menuItems}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};



export default ClassAdvisorDashboard;
