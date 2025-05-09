import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Upload, message, InputNumber, Select } from 'antd';
import notify from '../utils/notify';
import useDepartments from '../utils/useDepartments';
import { SearchOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import API_BASE_URL from '../api/config';
import * as XLSX from 'xlsx';
import { generateSubjectTemplate } from '../utils/bulkTemplates';
import axios from '../api/axios';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);

  // Fetch all subjects for Admin, or department subjects for HOD
  const fetchSubjects = async () => {
    try {
      let url = `${API_BASE_URL}/subjects`;
      let currentUser = null;
      try {
        currentUser = JSON.parse(localStorage.getItem('user'));
      } catch (e) { currentUser = null; }
      let isAdmin = false;
      if (currentUser && currentUser.role) {
        if (Array.isArray(currentUser.role)) {
          isAdmin = currentUser.role.map(r => r && r.toLowerCase()).includes('admin');
        } else if (typeof currentUser.role === 'string') {
          isAdmin = currentUser.role.toLowerCase() === 'admin';
        }
      }
      if (isAdmin) {
        url = `${API_BASE_URL}/subjects/all`;
      }
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setSubjects(data.map(sub => ({ ...sub, key: sub._id })));
    } catch (error) {
      // Optionally handle error
    }
  };


  useEffect(() => {
    fetchSubjects();
  }, []);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Add or Edit Subject
  const handleSaveSubject = async (values) => {
    if (isEditMode && editingSubject) {
      // EDIT
      try {
        await notify(
          axios.put(`${API_BASE_URL}/subjects/${editingSubject._id}`, values),
          { success: 'Subject updated successfully', error: 'Failed to update subject' }
        );
        fetchSubjects();
      } catch (error) {}
    } else {
      // ADD
      try {
        await notify(
          axios.post(`${API_BASE_URL}/subjects/add`, values),
          { success: 'Subject added successfully', error: 'Failed to add subject' }
        );
        fetchSubjects();
      } catch (error) {}
    }
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingSubject(null);
    form.resetFields();
  };

  // Remove Subject
  const handleRemoveSubject = async (key) => {
    try {
      await notify(
        axios.delete(`${API_BASE_URL}/subjects/${key}`),
        { success: 'Subject deleted successfully', error: 'Failed to delete subject' }
      );
      fetchSubjects();
    } catch (error) {}
  };

  // Open Edit Modal
  const handleEditSubject = (record) => {
    setIsEditMode(true);
    setEditingSubject(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Filtered Data for Search
  const filteredSubjects = subjects.filter((subject) =>
    Object.values(subject).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) => index + 1,
      align: 'center',
    },
    {
      title: 'Subject Code',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      align: 'center',
      responsive: ['xs', 'sm', 'md', 'lg'], // Visible on all screen sizes
    },
    {
      title: 'Subject Name',
      dataIndex: 'subjectName',
      key: 'subjectName',
      align: 'left',
      responsive: ['sm', 'md', 'lg'], // Hide on extra small screens
    },
    {
      title: 'Acronym',
      dataIndex: 'acronym',
      key: 'acronym',
      align: 'center',
    },
    {
      title: 'Category',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
    },
    
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditSubject(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this subject?"
            onConfirm={() => handleRemoveSubject(record.key)}
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

  // Bulk Upload State
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Download Subject Template
  const handleDownloadTemplate = () => {
    const wbout = generateSubjectTemplate();
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subject_template.xlsx';
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
      const subjects = body
        .filter(row => row.some(cell => cell && cell.toString().trim() !== ''))
        .map(row => ({
          subjectCode: row[0] || '',
          subjectName: row[1] || '',
          acronym: row[2] || '',
          credit: row[3] !== undefined ? Number(row[3]) : null,
          type: row[4] || '', // NEW
        }));

      setBulkPreview(subjects);
      setBulkModalVisible(true);
    };
    reader.readAsArrayBuffer(file);
    return false; // Prevent upload
  };

  // Confirm Bulk Upload
  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    try {
      await notify(
        axios.post(`${API_BASE_URL}/subjects/bulk`, { subjects: bulkPreview }),
        { success: 'Bulk subject upload successful', error: 'Failed to upload subjects' }
      );
      setBulkModalVisible(false);
      setBulkPreview([]);
      // Optionally refetch
      window.location.reload();
    } catch (error) {}
    setBulkLoading(false);
  };

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

  // Add Department column for admins
  const columnsWithDept = isAdmin ? [
    ...columns.slice(0, 1),
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      align: 'center',
      render: (dep) => {
        if (!dep) return '-';
        if (typeof dep === 'object' && dep.name) return dep.name;
        if (typeof dep === 'string' && deptMap[dep]) return deptMap[dep];
        return dep;
      },
    },
    ...columns.slice(1)
  ] : columns;

  return (
    <div>
      <h2>Manage Subjects</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          Download Subject Template
        </Button>
        <Upload
          accept=".xlsx, .xls"
          showUploadList={false}
          beforeUpload={handleBulkUpload}
        >
          <Button icon={<UploadOutlined />}>Bulk Upload XLSX</Button>
        </Upload>
        <Input
          placeholder="Search subjects"
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
          Add Subject
        </Button>
      </Space>
      <Modal
        title="Preview Bulk Subjects"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBulkModalVisible(false)}>Cancel</Button>,
          <Button key="confirm" type="primary" loading={bulkLoading} onClick={handleBulkConfirm}>Confirm Upload</Button>
        ]}
        width={700}
      >
        <Table
          dataSource={bulkPreview.map((f, i) => ({ ...f, key: i }))}
          columns={[
            { title: 'Subject Code', dataIndex: 'subjectCode' },
            { title: 'Subject Name', dataIndex: 'subjectName' },
            { title: 'Acronym', dataIndex: 'acronym' },
            { title: 'Credit', dataIndex: 'credit' },
            { title: 'Subject Type', dataIndex: 'type' },
          ]}
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
      <Table
        dataSource={filteredSubjects}
        columns={columnsWithDept}
        pagination={{ pageSize: 5 }}
        bordered
        scroll={{ x: '100%' }} // Enable horizontal scrolling for smaller screens
      />
      <Modal
        title={isEditMode ? 'Edit Subject' : 'Add Subject'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSubject}>
          <Form.Item
            name="subjectCode"
            label="Subject Code"
            rules={[{ required: true, message: 'Please enter the subject code' }]}
          >
            <Input placeholder="Enter subject code" />
          </Form.Item>
          <Form.Item
            name="subjectName"
            label="Subject Name"
            rules={[{ required: true, message: 'Please enter the subject name' }]}
          >
            <Input placeholder="Enter subject name" />
          </Form.Item>
          <Form.Item
            name="acronym"
            label="Acronym"
            rules={[{ required: true, message: 'Please enter the acronym' }]}
          >
            <Input placeholder="Enter acronym" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Subject Type"
            rules={[{ required: true, message: 'Please select the subject type' }]}
          >
            <Select placeholder="Select subject type">
              <Select.Option value="Theory">Theory</Select.Option>
              <Select.Option value="Laboratory">Laboratory</Select.Option>
            </Select>
          </Form.Item>


          <Form.Item
            name="credit"
            label="Credit"
            rules={[{ required: true, message: 'Please enter the credit value' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter credit" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditMode ? 'Save Changes' : 'Add Subject'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageSubjects;