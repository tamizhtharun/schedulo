import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import FacultyTimetable from './FacultyTimetable';
import Timetables from './Timetables';
import SubmitWillingness from './SubmitWillingness';
import FacultyOwnTimetable from './FacultyOwnTimetable';
import { TableOutlined, BarsOutlined, CheckSquareOutlined } from '@ant-design/icons';

const TTInchargeDashboard = () => {
  const [selectedOption, setSelectedOption] = useState('Timetables'); // Default selected option

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'facultyTimetable':
        return <FacultyTimetable />;
      case 'Timetables':
        return <Timetables />;
      case 'SubmitWillingness':
        return <SubmitWillingness />;
      case 'FacultyOwnTimetable':
        return <FacultyOwnTimetable />;
      default:
        return <h2>Welcome to the TT Incharge Dashboard</h2>;
    }
  };

  return (
    <MainLayout
      headerTitle="TT Incharge Dashboard" // Pass the header title
      menuItems={[
        { key: 'Timetables', label: 'Timetables', icon: <BarsOutlined /> },
        { key: 'facultyTimetable', label: 'Faculty Timetable', icon: <TableOutlined /> },
        { key: 'SubmitWillingness', label: 'Submit Willingness', icon: <CheckSquareOutlined /> },
        { key: 'FacultyOwnTimetable', label: 'My Timetable', icon: <BarsOutlined /> },
      ]}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};

export default TTInchargeDashboard;
