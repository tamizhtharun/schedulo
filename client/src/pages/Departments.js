import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from '../api/axios';

const Departments = ({ user }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form] = Form.useForm();

  // Fetch departments
  // Fetch all departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      message.error('Failed to load departments');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Admin check removed: All users can now access department management features.

  // Add or Edit
  // Add or Edit department
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingDepartment) {
        await axios.put(`/departments/${editingDepartment._id}`, values);
        message.success('Department updated');
      } else {
        await axios.post('/departments/add', values);
        message.success('Department added');
      }
      setModalVisible(false);
      setEditingDepartment(null);
      form.resetFields();
      fetchDepartments();
    } catch (err) {
      message.error(err.response?.data?.error || 'Operation failed');
    }
  };

  // Delete
  // Delete department
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/departments/${id}`);
      message.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      message.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    { title: 'S.No', render: (text, record, index) => index + 1 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Acronym', dataIndex: 'acronym', key: 'acronym' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];

  columns.push({
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <>
        <Button
          type="link"
          onClick={() => {
            setEditingDepartment(record);
            setModalVisible(true);
            form.setFieldsValue(record);
          }}
        >Edit</Button>
        <Popconfirm title="Delete this department?" onConfirm={() => handleDelete(record._id)}>
          <Button type="link" danger>Delete</Button>
        </Popconfirm>
      </>
    ),
  });

  return (
    <div>
      <h2>Departments</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDepartment(null);
            setModalVisible(true);
            form.resetFields();
          }}
        >
          Add Department
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={departments}
        rowKey="_id"
        loading={loading}
        pagination={false}
      />
      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        visible={modalVisible}
        onOk={handleOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingDepartment(null);
          form.resetFields();
        }}
        okText={editingDepartment ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Department Name" rules={[{ required: true, message: 'Please enter department name' }]}> 
            <Input placeholder="Enter department name" />
          </Form.Item>
          <Form.Item name="acronym" label="Acronym" rules={[{ required: true, message: 'Please enter department acronym' }]}> 
            <Input placeholder="Enter acronym" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Departments;
