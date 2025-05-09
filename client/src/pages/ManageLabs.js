import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Upload } from 'antd';
import { SearchOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import { generateLabTemplate } from '../utils/bulkTemplates';
import API_BASE_URL from '../api/config';
import notify from '../utils/notify';

const ManageLabs = () => {
  const [labs, setLabs] = useState([]);
  const [hodDepartment, setHodDepartment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLab, setEditingLab] = useState(null);

  // Bulk Upload State
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

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

  // Fetch Labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/labs`, {
          credentials: 'include',
        });
        if (response.ok) {
          const labData = await response.json();
          setLabs(labData.map(lab => ({
            key: lab._id,
            sno: labData.indexOf(lab) + 1,
            labName: lab.labName,
            labNumber: lab.labNumber,
            department: lab.department
          })));
        }
      } catch (error) {
        notify('error', 'Failed to fetch labs', error.message);
      }
    };

    fetchLabs();
  }, []);

  // Download Lab Template
  const handleDownloadTemplate = () => {
    const wbout = generateLabTemplate();
    const fileName = 'Lab_Upload_Template.xlsx';
    XLSX.writeFile(wbout, fileName);
  };

  // Add/Edit Lab
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        department: hodDepartment
      };

      if (editingLab) {
        // Update existing lab
        await axios.put(`${API_BASE_URL}/labs/${editingLab.key}`, payload);
        setLabs(labs.map(lab => 
          lab.key === editingLab.key ? { ...lab, ...payload } : lab
        ));
      } else {
        // Add new lab
        const response = await axios.post(`${API_BASE_URL}/labs`, payload);
        setLabs([...labs, { 
          key: response.data._id, 
          sno: labs.length + 1, 
          ...payload 
        }]);
      }
      
      setModalVisible(false);
      setEditingLab(null);
      notify('success', editingLab ? 'Lab Updated' : 'Lab Added');
    } catch (error) {
      notify('error', 'Operation Failed', error.message);
    }
  };

  // Bulk Upload Handler
  const handleBulkUpload = async (file) => {
    setBulkLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Validate and prepare data
        const validData = data.map(row => ({
          labName: row['Lab Name'],
          labNumber: row['Lab Number'],
          department: hodDepartment
        }));

        setBulkPreview(validData);
        setBulkModalVisible(true);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      notify('error', 'Bulk Upload Failed', error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Confirm Bulk Upload
  const confirmBulkUpload = async () => {
    setBulkLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/labs/bulk`, bulkPreview);
      setLabs([
        ...labs, 
        ...response.data.map((lab, index) => ({
          key: lab._id,
          sno: labs.length + index + 1,
          ...lab
        }))
      ]);
      setBulkModalVisible(false);
      notify('success', 'Bulk Upload Successful');
    } catch (error) {
      notify('error', 'Bulk Upload Failed', error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Delete Lab
  const handleDelete = async (record) => {
    try {
      await axios.delete(`${API_BASE_URL}/labs/${record.key}`);
      setLabs(labs.filter(lab => lab.key !== record.key));
      notify('success', 'Lab Deleted');
    } catch (error) {
      notify('error', 'Deletion Failed', error.message);
    }
  };

  // Table Columns
  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,
    },
    {
      title: 'Lab Name',
      dataIndex: 'labName',
      key: 'labName',
    },
    {
      title: 'Lab Number',
      dataIndex: 'labNumber',
      key: 'labNumber',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditingLab(record);
            setModalVisible(true);
          }}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this lab?"
            onConfirm={() => handleDelete(record)}
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setModalVisible(true)}
        >
          Add Lab
        </Button>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleBulkUpload(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Bulk Upload</Button>
        </Upload>
        <Button 
          icon={<DownloadOutlined />} 
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </Space>

      <Table 
        columns={columns} 
        dataSource={labs} 
        pagination={{ 
          showSizeChanger: true, 
          showQuickJumper: true 
        }}
      />

      {/* Add/Edit Lab Modal */}
      <Modal
        title={editingLab ? 'Edit Lab' : 'Add Lab'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLab(null);
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingLab || {}}
        >
          <Form.Item
            name="labName"
            label="Lab Name"
            rules={[{ required: true, message: 'Please input lab name!' }]}
          >
            <Input placeholder="Enter Lab Name" />
          </Form.Item>
          <Form.Item
            name="labNumber"
            label="Lab Number"
            rules={[{ required: true, message: 'Please input lab number!' }]}
          >
            <Input placeholder="Enter Lab Number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingLab ? 'Update' : 'Add'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Upload Preview Modal */}
      <Modal
        title="Bulk Upload Preview"
        visible={bulkModalVisible}
        onOk={confirmBulkUpload}
        onCancel={() => setBulkModalVisible(false)}
        confirmLoading={bulkLoading}
      >
        <Table 
          columns={[
            { title: 'Lab Name', dataIndex: 'labName' },
            { title: 'Lab Number', dataIndex: 'labNumber' }
          ]} 
          dataSource={bulkPreview} 
        />
      </Modal>
    </div>
  );
};

export default ManageLabs;
