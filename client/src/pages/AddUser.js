import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import axios from '../api/axios'; // your custom axios instance

const { Option } = Select;

const AddUser = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get('/departments');
        setDepartments(res.data);
      } catch (err) {
        message.error('Failed to load departments');
      }
    };
    fetchDepartments();
  }, []);

  const handleRoleChange = (value) => {
    setShowAdditionalFields(value !== 'Admin');
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/users/add', values);
      message.success(response.data.message || 'User added successfully'); 
      form.resetFields(); 
      setShowAdditionalFields(false); 
    } catch (error) {
      console.error(error); 
      message.error(error.response?.data?.error || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Add User</h2>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter the username' }]}>
          <Input placeholder="Enter username" />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter the password' }]}>
          <Input.Password placeholder="Enter password" />
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
          <Select placeholder="Select a role" onChange={handleRoleChange}>
            <Option value="Admin">Admin</Option>
            <Option value="HOD">HOD</Option>
            <Option value="TTIncharge">TT Incharge</Option>
            <Option value="ClassAdvisor">Class Advisor</Option>
            <Option value="Faculty">Faculty</Option>
          </Select>
        </Form.Item>

        {showAdditionalFields && (
          <>
            <Form.Item name="facultyId" label="Faculty ID" rules={[{ required: true, message: 'Please enter the Faculty ID' }]}>
              <Input placeholder="Enter Faculty ID" />
            </Form.Item>

            <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Please select a department' }]}>
              <Select placeholder="Select a department">
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="contact" label="Contact" rules={[
              { required: true, message: 'Please enter the contact number' },
              { pattern: /^[0-9]{10}$/, message: 'Enter valid 10-digit contact number' },
            ]}>
              <Input placeholder="Enter contact number" />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={[
              { required: true, message: 'Please enter the email address' },
              { type: 'email', message: 'Enter valid email address' },
            ]}>
              <Input placeholder="Enter email address" />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Add User
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddUser;

// AddUser.js