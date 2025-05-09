import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, Space, Popconfirm, Table } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import API_BASE_URL from '../api/config';
import notify from '../utils/notify';

const { Option } = Select;

const TTIncharge = () => {
  const [faculties, setFaculties] = useState([]);
  const [ttIncharge, setTTIncharge] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch faculties from backend
  React.useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`,{
          credentials: 'include'
        });
        const users = await response.json();
        // Get HOD's department from localStorage/session or fallback to API
        let hodDeptId;
        let currentUser = null;
        try {
          currentUser = JSON.parse(localStorage.getItem('user'));
        } catch (e) { currentUser = null; }
        async function getHodDeptId() {
          if (currentUser && currentUser.department) {
            if (typeof currentUser.department === 'object' && currentUser.department !== null && currentUser.department._id) {
              return currentUser.department._id;
            } else {
              return currentUser.department;
            }
          } else if (currentUser && currentUser._id) {
            // Fallback: fetch user info from API
            try {
              const res = await fetch(`${API_BASE_URL}/users/${currentUser._id}`, { credentials: 'include' });
              if (res.ok) {
                const userData = await res.json();
                if (userData.department) {
                  return typeof userData.department === 'object' && userData.department !== null && userData.department._id
                    ? userData.department._id
                    : userData.department;
                }
              }
            } catch (e) {}
          }
          return undefined;
        }
        hodDeptId = await getHodDeptId();
        // Filter only faculties of the same department (handle string/object)
        const facultyUsers = users.filter(user => {
          const notAdmin = Array.isArray(user.role) ? !user.role.map(r => (r || '').toString().trim().toLowerCase()).includes('admin') : (user.role || '').toString().trim().toLowerCase() !== 'admin';
          let userDeptId = user.department;
          if (typeof userDeptId === 'object' && userDeptId !== null && userDeptId._id) {
            userDeptId = userDeptId._id;
          }
          const sameDept = userDeptId && hodDeptId && String(userDeptId) === String(hodDeptId);
          return notAdmin && sameDept;
        });
        setFaculties(facultyUsers);
        // Set current TTIncharge if any (handles array or string, case-insensitive)
        const current = users.find(user => {
          if (!user.role) return false;
          if (Array.isArray(user.role)) return user.role.map(r => r && r.toLowerCase()).includes('ttincharge');
          return typeof user.role === 'string' && user.role.toLowerCase() === 'ttincharge';
        });
        if (current) setTTIncharge(current);
        else setTTIncharge(null);
      } catch (error) {
        setFaculties([]);
      }
    };
    fetchFaculties();
  }, []);

  // Approve TT Incharge
  const handleApproveTTIncharge = async (values) => {
    const selectedFaculty = faculties.find((faculty) => faculty._id === values.facultyId);
    if (!selectedFaculty) return;
    try {
      // Update role to TTIncharge
      let newRoles = Array.isArray(selectedFaculty.role) ? [...selectedFaculty.role] : [selectedFaculty.role];
      if (!newRoles.map(r => r.toLowerCase()).includes('faculty')) newRoles.push('Faculty');
      if (!newRoles.map(r => r.toLowerCase()).includes('ttincharge')) newRoles.push('TTIncharge');
      newRoles = Array.from(new Set(newRoles.filter(Boolean)));
      const res = await notify(
        fetch(`http://localhost:5000/api/users/${selectedFaculty._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRoles })
        }),
        { success: 'TT Incharge approved successfully', error: 'Failed to approve TT Incharge' }
      );
      if (res.ok) {
        setTTIncharge({ ...selectedFaculty, role: newRoles });
        const updatedFaculties = faculties.map(f =>
          f._id === selectedFaculty._id ? { ...f, role: newRoles } : f
        );
        setFaculties(updatedFaculties);
      }
    } catch (error) {}
    setIsModalVisible(false);
    form.resetFields();
  };

  // Remove TT Incharge
  const handleRemoveTTIncharge = async () => {
    if (!ttIncharge) return;
    try {
      let newRoles = Array.isArray(ttIncharge.role) ? [...ttIncharge.role] : [ttIncharge.role];
newRoles = newRoles.filter(r => r && r.toLowerCase() !== 'ttincharge');
if (!newRoles.map(r => r && r.toLowerCase()).includes('faculty')) newRoles.push('Faculty');
newRoles = Array.from(new Set(newRoles.filter(Boolean)));
const res = await notify(
  fetch(`http://localhost:5000/api/users/${ttIncharge._id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: newRoles })
  }),
  { success: 'TT Incharge removed successfully', error: 'Failed to remove TT Incharge' }
);

    if (res.ok) {
      setTTIncharge(null);
      const updatedFaculties = faculties.map(f =>
        f._id === ttIncharge._id ? { ...f, role: newRoles } : f
      );
      setFaculties(updatedFaculties);
    }
  } catch (error) {}
};

  return (
    <div>
      <h2>TT Incharge</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => setIsModalVisible(true)}
          disabled={!!ttIncharge} // Disable button if TT Incharge is already assigned
        >
          Assign TT Incharge
        </Button>
        {ttIncharge && (
          <Popconfirm
            title="Are you sure you want to remove the current TT Incharge?"
            onConfirm={handleRemoveTTIncharge}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger">Remove TT Incharge</Button>
          </Popconfirm>
        )}
      </Space>
      {ttIncharge ? (
        <div>
          <h3>Current TT Incharge</h3>
          <p>
            <strong>Name:</strong> {ttIncharge.name || ttIncharge.username}
          </p>
          <p>
            <strong>Faculty ID:</strong> {ttIncharge.facultyId}
          </p>
        </div>
      ) : (
        <p>No TT Incharge assigned yet.</p>
      )}
      <Modal
        title="Assign TT Incharge"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleApproveTTIncharge}>
          <Form.Item
            name="facultyId"
            label="Select Faculty"
            rules={[{ required: true, message: 'Please select a faculty member' }]}
          >
            <Select placeholder="Select a faculty">
              {faculties.map((faculty) => (
                <Option key={faculty._id} value={faculty._id}>
                  {(faculty.name || faculty.username)} ({faculty.facultyId})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Approve as TT Incharge
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default TTIncharge;