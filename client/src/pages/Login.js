import React, { useState } from 'react';
import axios from '../api/axios';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle Login
  const handleLogin = async (values) => {
    setLoading(true);
    let payload;
    if (/^\d+$/.test(values.userId)) {
      payload = { facultyId: values.userId, password: values.password };
    } else {
      payload = { username: values.userId, password: values.password };
    }
    try {
      const response = await axios.post('/users/login', payload);
      setLoading(false);
      if (response.data && response.data.success) {
        // Store user info including department in localStorage for session management
        const userData = {
          _id: response.data._id,
          username: response.data.username,
          facultyId: response.data.facultyId,
          role: Array.isArray(response.data.role) ? response.data.role : [response.data.role],
          department: response.data.department
        };
        
        // Ensure department is properly stored
        if (userData.department && typeof userData.department === 'object') {
          userData.department = {
            _id: userData.department._id || userData.department.$oid || userData.department,
            name: userData.department.name
          };
        }
        
        // Update both localStorage and AuthContext
        localStorage.setItem('user', JSON.stringify(userData));
        login(userData);
        
        console.log('Stored user data with department:', response.data.department);
        
        message.success('Login successful!');
        // Role-based navigation
        const roles = Array.isArray(response.data.role) ? response.data.role : [response.data.role];
        if (roles.includes('Admin')) {
          navigate('/admin-dashboard');
        } else if (roles.includes('HOD')) {
          navigate('/hod-dashboard');
        } else if (roles.includes('TTIncharge') && roles.includes('ClassAdvisor')) {
          navigate('/combined-dashboard');
        } else if (roles.includes('TTIncharge')) {
          navigate('/ttincharge-dashboard');
        } else if (roles.includes('ClassAdvisor')) {
          navigate('/classadvisor-dashboard');
        } else if (roles.includes('Faculty')) {
          navigate('/faculty-dashboard');
        } else {
          message.warning('Login successful, but no recognized role assigned.');
        }
      } else {
        message.error(response.data.message || 'Login failed');
      }
    } catch (err) {
      setLoading(false);
      message.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
  <div style={{
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    position: 'relative',
    background: 'linear-gradient(120deg,rgb(255, 252, 238) 0%,rgb(171, 198, 246) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    {/* Floating Animated Background Circles */}
    <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          borderRadius: '50%',
          width: `${80 + Math.random() * 120}px`,
          height: `${80 + Math.random() * 120}px`,
          left: `${Math.random() * 90}%`,
          top: `${Math.random() * 90}%`,
          background: `rgba(255,255,255,${0.03 + Math.random() * 0.07})`,
          animation: `float${i} 10s ease-in-out infinite alternate`,
          filter: 'blur(1px)',
        }} />
      ))}
      <style>{`
        ${[...Array(12)].map((_, i) => `
          @keyframes float${i} {
            0% { transform: translateY(0px) scale(1); }
            100% { transform: translateY(-${40 + Math.random() * 40}px) scale(${0.9 + Math.random() * 0.2}); }
          }
        `).join('')}
      `}</style>
    </div>

    {/* Login Card */}
    <div style={{
      zIndex: 2,
      background: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 20,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.09)',
      padding: '40px 32px 32px 32px',
      minWidth: 340,
      maxWidth: 370,
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      border: '1.5px solid #eaeaea',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'background 0.4s',
    }}>
      <div style={{
        fontFamily: 'Montserrat, Poppins, sans-serif',
        fontWeight: 900,
        fontSize: 34,
        color: '#274690',
        letterSpacing: 1.5,
        marginBottom: 8,
        textShadow: '0 2px 8px rgba(39,70,144,0.10)',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        ScheduLO
      </div>
      <div style={{
        fontSize: 15,
        color: '#7285b7',
        marginBottom: 24,
        fontWeight: 500,
        textAlign: 'center',
        letterSpacing: 0.2,
      }}>
        Smart Timetable Management
      </div>
      <Form layout="vertical" onFinish={handleLogin} style={{ width: '100%' }}>
        <Form.Item
          name="userId"
          label={<span style={{ fontWeight: 600, color: '#1b2845' }}>User ID</span>}
          rules={[{ required: true, message: 'Please enter your User ID' }]}
        >
          <Input size="large" placeholder="Enter your Username or Faculty ID" autoFocus style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 600, color: '#1b2845' }}>Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password size="large" placeholder="Enter your password" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ borderRadius: 8, fontWeight: 600, background: '#274690' }}>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  </div>
);
};

export default Login;