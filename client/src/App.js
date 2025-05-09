// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense} from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import HODDashboard from './pages/HODDashboard';
import TTInchargeDashboard from './pages/TTInchargeDashboard';
import ClassAdvisorDashboard from './pages/ClassAdvisorDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyOwnTimetable from './pages/FacultyOwnTimetable';
// import TTInchargeClassAdvisorDashboard from './pages/TTInchargeClassAdvisorDashboard';
import './global.css';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import CombinedDashboard from './pages/CombinedDashboard';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

          {/* Protected Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/hod-dashboard" element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HODDashboard />
            </ProtectedRoute>
          } />

          <Route path="/ttincharge-dashboard" element={
            <ProtectedRoute allowedRoles={['ttincharge']}>
              <TTInchargeDashboard />
            </ProtectedRoute>
          } />

          <Route path="/classadvisor-dashboard" element={
            <ProtectedRoute allowedRoles={['classadvisor']}>
              <ClassAdvisorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/faculty-dashboard" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty-timetable" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Suspense fallback={<div>Loading...</div>}>
                <FacultyOwnTimetable />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/combined-dashboard" element={
            <ProtectedRoute allowedRoles={['ttincharge', 'classadvisor']}>
              <CombinedDashboard />
            </ProtectedRoute>
          } />
          {/*
          <Route path="/ttincharge-classadvisor-dashboard" element={
            <ProtectedRoute allowedRoles={['ttincharge', 'classadvisor']}>
              <TTInchargeClassAdvisorDashboard />
            </ProtectedRoute>
          } />
          */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;