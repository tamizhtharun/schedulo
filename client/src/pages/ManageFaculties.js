import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Upload } from 'antd';
import useDepartments from '../utils/useDepartments';
import { SearchOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import { generateFacultyTemplate } from '../utils/bulkTemplates';
import API_BASE_URL from '../api/config';
import notify from '../utils/notify';


const ManageFaculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [hodDepartment, setHodDepartment] = useState(null);

  // Fetch HOD department on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user._id) {
      axios.get(`/users/${user._id}`)
        .then(res => {
          setHodDepartment(res.data.department);
        })
        .catch(() => setHodDepartment(null));
    }
  }, []);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          credentials: 'include', // Include credentials for session management
        });
        if (response.ok) {
          const users = await response.json();
          const facultyUsers = users
            .filter(user => {
              if (!user.role) return false;
              if (Array.isArray(user.role)) {
                return !user.role.map(r => (r || '').toString().trim().toLowerCase()).includes('admin');
              }
              return (user.role || '').toString().trim().toLowerCase() !== 'admin';
            })
            .map(user => ({
              key: user._id,
              name: user.username,
              facultyId: user.facultyId,
              email: user.email,
              contact: user.contact,
              role: user.role,
              department: user.department || null
            }));
          setFaculties(facultyUsers);
        } else {
          
        }
      } catch (error) {
        
        setFaculties([]);
      }
    };
    fetchFaculties();
  }, []);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Add or Edit Faculty
  const handleSaveFaculty = async (values) => {
    if (isEditMode && editingFaculty) {
      const payload = { ...values, username: values.name, role: editingFaculty.role };
      delete payload.name;
      try {
        const response = await notify(
          fetch(`${API_BASE_URL}/users/${editingFaculty.key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
          }),
          { success: 'Faculty updated successfully', error: 'Failed to update faculty' }
        );
        const data = await response.json();
        if (response.ok && data.success) {
          const updatedFaculty = { ...data.user, key: data.user._id, name: data.user.username };
          setFaculties(faculties.map(faculty =>
            faculty.key === editingFaculty.key ? updatedFaculty : faculty
          ));
          
        } else {
          
        }
      } catch (error) {
        
      }
    } else {
      // Add this import at the top if not present:
      // import axios from '../api/axios';

      const payload = {
        username: values.name,
        facultyId: values.facultyId,
        password: values.facultyId, // or values.password if you add a password field
        role: 'Faculty',
        department: hodDepartment, // assign HOD's department
        contact: values.contact,
        email: values.email
      };

      try {
        const { data } = await notify(
          axios.post(`${API_BASE_URL}/users/add`, payload),
          { success: 'Faculty added successfully', error: 'Failed to add faculty' }
        );
        if (data && data.user) {
          const newFaculty = { ...data.user, key: data.user._id, name: data.user.username };
          setFaculties([...faculties, newFaculty]);
        }
      } catch (error) {
        
      }
    }
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingFaculty(null);
    form.resetFields();
  };

  // Remove Faculty
  const handleRemoveFaculty = async (key) => {
    try {
      const response = await notify(
        fetch(`${API_BASE_URL}/users/${key}`, {
          method: 'DELETE',
          credentials: 'include' // Send credentials with the request
        }),
        { success: 'Faculty deleted successfully', error: 'Failed to delete faculty' }
      );
      if (response.ok) {
        setFaculties(faculties.filter(faculty => faculty.key !== key));
        
      } else {
        
      }
    } catch (error) {
      
    }
  };

  // Open Edit Modal
  const handleEditFaculty = (record) => {
    setIsEditMode(true);
    setEditingFaculty(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Filtered Data for Search
  const filteredFaculties = faculties.filter((faculty) =>
    Object.values(faculty).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Check admin
  let isAdmin = false;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      if (Array.isArray(user.role)) isAdmin = user.role.map(r => r && r.toLowerCase()).includes('admin');
      else if (typeof user.role === 'string') isAdmin = user.role.toLowerCase() === 'admin';
    }
  } catch {}

  // Fetch department map if admin
  const { deptMap } = useDepartments(isAdmin);

  // Table columns with department for admin
  const columns = [
    {
      title: 'Faculty ID',
      dataIndex: 'facultyId',
      key: 'facultyId',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Faculty Name',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    // Department column for admins
    ...(isAdmin ? [{
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg'],
      render: (dep) => {
        if (!dep) return '-';
        if (typeof dep === 'object' && dep.name) return dep.name;
        if (typeof dep === 'string' && deptMap[dep]) return deptMap[dep];
        return dep;
      },
    }] : []),
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg'],
      render: (role) => {
        if (!role || (Array.isArray(role) && role.length === 0)) return '';
        // If exactly ['Faculty'] (case-insensitive)
        if (Array.isArray(role) && role.length === 1 && role[0].toLowerCase() === 'faculty') return 'Faculty';
        // If exactly ['Faculty', 'Class Advisor'] or ['Class Advisor', 'Faculty'] (case-insensitive, order-insensitive)
        if (Array.isArray(role) && role.length === 2) {
          const lowerRoles = role.map(r => r.toLowerCase());
          if (lowerRoles.includes('faculty') && lowerRoles.includes('class advisor')) {
            return 'Class Advisor';
          }
        }
        if (Array.isArray(role)) return role.join(', ');
        return String(role);
      }
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'left',
      responsive: ['sm', 'md', 'lg'],
    },
    {
      title: 'Contact Number',
      dataIndex: 'contact',
      key: 'contact',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditFaculty(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this faculty?"
            onConfirm={() => handleRemoveFaculty(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Remove
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Use columns directly in Table below (remove columnsWithDept duplicate logic)


  // Bulk Upload State
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Download Faculty Template
  const handleDownloadTemplate = () => {
    const wbout = generateFacultyTemplate();
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle Bulk Upload
  const handleBulkUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // Remove header row
      const [header, ...body] = rows;
      // Map to objects
      const faculties = body
        .filter(row => row.some(cell => cell && cell.toString().trim() !== '')) // skip empty rows
        .map(row => ({
          name: row[0] || '',
          email: row[1] || '',
          facultyId: row[2] || '',
          contact: row[3] || ''
        }));
      setBulkPreview(faculties);
      setBulkModalVisible(true);
    };
    reader.readAsArrayBuffer(file);
    return false; // Prevent upload
  };

  // Confirm Bulk Upload
  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculties: bulkPreview }),
        credentials: 'include'
      });
      if (res.ok) {
        
        setBulkModalVisible(false);
        setBulkPreview([]);
        // Optionally refetch
        window.location.reload();
      } else {
        
      }
    } catch {
      
    }
    setBulkLoading(false);
  };



  return (
    <div>
      <h2>Manage Faculties</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          Download Faculty Template
        </Button>
        <Upload
          accept=".xlsx, .xls"
          showUploadList={false}
          beforeUpload={handleBulkUpload}
        >
          <Button icon={<UploadOutlined />}>Bulk Upload XLSX</Button>
        </Upload>
        <Input
          placeholder="Search faculties"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setIsEditMode(false);
            setIsModalVisible(true);
            form.resetFields();
          }}
        >
          Add Faculty
        </Button>
      </Space>
      <Modal
        title="Preview Bulk Faculties"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBulkModalVisible(false)}>Cancel</Button>,
          <Button key="confirm" type="primary" loading={bulkLoading} onClick={handleBulkConfirm}>Confirm Upload</Button>
        ]}
        width={700}
        zIndex={99999}
      >
        <Table
          dataSource={bulkPreview.map((f, i) => ({ ...f, key: i }))}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Faculty ID', dataIndex: 'facultyId' },
            { title: 'Phone Number', dataIndex: 'contact' },
            { title: 'Role', dataIndex: 'role',
              render: (role) => {
                if (!role || (Array.isArray(role) && role.length === 0)) return '';
                if (Array.isArray(role) && role.length === 1 && role[0].toLowerCase() === 'faculty') return 'Faculty';
                if (Array.isArray(role)) return role.join(', ');
                return String(role);
              }
            }
          ]}
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
      <Table
        dataSource={filteredFaculties}
        columns={columns}
        pagination={{ pageSize: 5 }}
        bordered
        scroll={{ x: '100%' }}
      />
      <Modal
        title={isEditMode ? 'Edit Faculty' : 'Add Faculty'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        zIndex={99999}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFaculty}>
          <Form.Item
            name="name"
            label="Faculty Name"
            rules={[{ required: true, message: 'Please enter the faculty name' }]}
          >
            <Input placeholder="Enter faculty name" />
          </Form.Item>
          <Form.Item
            name="facultyId"
            label="Faculty ID"
            rules={[{ required: true, message: 'Please enter the faculty ID' }]}
          >
            <Input placeholder="Enter faculty ID" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter the faculty email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter faculty email" />
          </Form.Item>
          <Form.Item
            name="contact"
            label="Contact Number"
            rules={[
              { required: true, message: 'Please enter the contact number' },
              { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit contact number' },
            ]}
          >
            <Input placeholder="Enter contact number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditMode ? 'Save Changes' : 'Add Faculty'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageFaculties;
