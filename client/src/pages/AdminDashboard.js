import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import ManageFaculties from './ManageFaculties';
import ManageSubjects from './ManageSubjects';
import ManageClasses from './ManageClasses';
// import TTIncharge from './TTIncharge';
import Timetables from './Timetables';
import AddUser from './AddUser';
import Departments from './Departments';
import FacultyTimetable from './FacultyTimetable';
import {
  TeamOutlined,
  BookOutlined,
  AppstoreOutlined,
  ScheduleOutlined,
  TableOutlined,
  BarsOutlined,
} from '@ant-design/icons';

const AdminDashboard = () => {
  const [selectedOption, setSelectedOption] = useState('ManageFaculties'); // Default selected option

  // Render the selected component
  const renderContent = () => {
    switch (selectedOption) {
      case 'AddUser':
        return <AddUser/>;
      case 'ManageFaculties':
        return <ManageFaculties />;
      case 'ManageSubjects':
        return <ManageSubjects />;
      case 'ManageClasses':
        return <ManageClasses />;
      case 'Timetables':
        return <Timetables />;
      case 'Departments':
        return <Departments/>;
      case 'facultyTimetable':
        return <FacultyTimetable />;
      default:
        return <h2>Welcome to the Admin Dashboard</h2>;
    }
  };

  return (
    <MainLayout
      headerTitle="Admin Dashboard" // Pass the header title
      menuItems={[
        { key: 'ManageFaculties', label: 'Manage Faculties', icon: <TeamOutlined /> },
        { key: 'ManageSubjects', label: 'Manage Subjects', icon: <BookOutlined /> },
        { key: 'ManageClasses', label: 'Manage Classes', icon: <AppstoreOutlined /> },
        { key: 'Timetables', label: 'Timetables', icon: <BarsOutlined /> },
        { key: 'AddUser', label: 'Add Users', icon: <BarsOutlined /> },
        { key: 'Departments', label: 'Departments', icon: <AppstoreOutlined /> },
        { key: 'facultyTimetable', label: 'Faculty Timetable', icon: <TableOutlined /> },
      ]}
      onMenuSelect={(key) => setSelectedOption(key)} // Update selected option
    >
      {renderContent()}
    </MainLayout>
  );
};

export default AdminDashboard;