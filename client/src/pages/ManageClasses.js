import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Select } from 'antd';
import notify from '../utils/notify';
import useDepartments from '../utils/useDepartments';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import API_BASE_URL from '../api/config';
import axios from '../api/axios';

const { Option } = Select;

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Fetch Classes (all for Admin, department for HOD)
  const fetchClasses = async () => {
    try {
      let url = `${API_BASE_URL}/classes`;
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
        url = `${API_BASE_URL}/classes/all`;
      }
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setClasses(data.map(cls => ({ ...cls, key: cls._id })));
    } catch (error) {
      console.error(error);
    }
  };


  // Fetch Faculties
  const fetchFaculties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include',
      });
      const users = await response.json();
      const facultyUsers = users.filter(user => {
        if (!user.role) return false;
        if (Array.isArray(user.role)) {
          return !user.role.map(r => (r || '').toString().trim().toLowerCase()).includes('admin');
        }
        return (user.role || '').toString().trim().toLowerCase() !== 'admin';
      });
      setFaculties(facultyUsers);
    } catch (error) {
      console.error(error);
      setFaculties([]);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchFaculties();
  }, []);

  // Add or Edit Class
  const handleSaveClass = async (values) => {
    if (isEditMode && editingClass) {
      const oldClassAdvisorId = editingClass.classAdvisor && typeof editingClass.classAdvisor === 'object'
        ? editingClass.classAdvisor._id
        : editingClass.classAdvisor;
      const newClassAdvisorId = values.classAdvisor;
      if (oldClassAdvisorId && oldClassAdvisorId.toString() !== newClassAdvisorId.toString()) {
        // Remove "ClassAdvisor" from old advisor
        const oldAdvisor = faculties.find(f => f._id.toString() === oldClassAdvisorId.toString());
        if (oldAdvisor) {
          let oldRoles = Array.isArray(oldAdvisor.role) ? [...oldAdvisor.role] : [oldAdvisor.role];
          oldRoles = oldRoles.filter(role => role !== 'ClassAdvisor');
          await fetch(`${API_BASE_URL}/users/${oldAdvisor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: oldRoles }),
            credentials: 'include',
          });
        }

        // Add "ClassAdvisor" to new advisor
        const newAdvisor = faculties.find(f => f._id.toString() === newClassAdvisorId.toString());
        if (newAdvisor) {
          let newRoles = Array.isArray(newAdvisor.role) ? [...newAdvisor.role] : [newAdvisor.role];
          if (!newRoles.includes('ClassAdvisor')) {
            newRoles.push('ClassAdvisor');
          }
          newRoles = Array.from(new Set(newRoles)).filter(r => ['Admin', 'HOD', 'TTIncharge', 'ClassAdvisor', 'Faculty'].includes(r));
          await fetch(`${API_BASE_URL}/users/${newAdvisor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRoles }),
            credentials: 'include',
          });
        }
      }

      // Edit the class
      await notify(
        axios.put(`${API_BASE_URL}/classes/${editingClass._id}`, { ...values, classAdvisor: values.classAdvisor }),
        { success: 'Class updated successfully', error: 'Failed to update class' }
      );
      fetchClasses();
    } else {
      // Add New Class
      await notify(
        axios.post(`${API_BASE_URL}/classes/add`, { ...values, classAdvisor: values.classAdvisor }),
        { success: 'Class added successfully', error: 'Failed to add class' }
      );
      // After class is created, update advisor's roles if needed
      const newAdvisorId = values.classAdvisor;
      const newAdvisor = faculties.find(f => f._id.toString() === newAdvisorId.toString());
      if (newAdvisor) {
        let newRoles = Array.isArray(newAdvisor.role) ? [...newAdvisor.role] : [newAdvisor.role];
        if (!newRoles.includes('ClassAdvisor')) {
          newRoles.push('ClassAdvisor');
        }
        newRoles = Array.from(new Set(newRoles)).filter(r => ['Admin', 'HOD', 'TTIncharge', 'ClassAdvisor', 'Faculty'].includes(r));
        await notify(
          fetch(`${API_BASE_URL}/users/${newAdvisor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRoles }),
            credentials: 'include',
          }),
          { success: 'Advisor role updated', error: 'Failed to update advisor role' }
        );
      }
      fetchClasses();
    }

    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingClass(null);
    form.resetFields();
  };

  // Remove Class
  const handleRemoveClass = async (key) => {
    try {
      const classToDelete = classes.find(cls => cls.key === key);
      if (!classToDelete) {
        console.error('Class not found');
        return;
      }

      const classAdvisorId = classToDelete.classAdvisor;

      const res = await fetch(`${API_BASE_URL}/classes/${key}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        const advisor = faculties.find(f => f._id === classAdvisorId);

        if (advisor) {
          let updatedRoles = Array.isArray(advisor.role) ? [...advisor.role] : [advisor.role];
          updatedRoles = updatedRoles.filter(role => role !== 'ClassAdvisor');

          await fetch(`${API_BASE_URL}/users/${advisor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: updatedRoles }),
            credentials: 'include',
          });
        }

        fetchClasses();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Open Edit Modal
  const handleEditClass = (record) => {
    setIsEditMode(true);
    setEditingClass(record);
    form.setFieldsValue({
      ...record,
      classAdvisor: record.classAdvisor && typeof record.classAdvisor === 'object'
        ? record.classAdvisor._id
        : record.classAdvisor,
    });
    setIsModalVisible(true);
  };

  const filteredClasses = classes.filter((classItem) =>
    Object.values(classItem).some((value) =>
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns = [
    {
      title: 'Class Name',
      dataIndex: 'className',
      key: 'className',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
      align: 'center',
    },
    {
      title: 'Class Venue',
      dataIndex: 'classVenue',
      key: 'classVenue',
      align: 'center',
    },
    {
      title: 'Class Advisor',
      dataIndex: 'classAdvisor',
      key: 'classAdvisor',
      align: 'left',
      render: (classAdvisor) => {
        // If populated, classAdvisor will be an object
        if (classAdvisor && typeof classAdvisor === 'object') {
          return classAdvisor.name || classAdvisor.username || 'N/A';
        }
        // Fallback: if not populated, try to find in faculties array
        const advisor = faculties.find(faculty => faculty._id === classAdvisor);
        return advisor ? advisor.name || advisor.username : 'N/A';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEditClass(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this class?"
            onConfirm={() => handleRemoveClass(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>Remove</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
      <h2>Manage Classes</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search classes"
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
          Add Class
        </Button>
      </Space>
      <Table
        dataSource={filteredClasses}
        columns={columnsWithDept}
        pagination={{ pageSize: 5 }}
        scroll={{ x: '100%' }}
        bordered
      />
      <Modal
        title={isEditMode ? 'Edit Class' : 'Add Class'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveClass}>
          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Please select the year' }]}
          >
            <Select placeholder="Select year">
              <Option value="II">II Year</Option>
              <Option value="III">III Year</Option>
              <Option value="Final Year">Final Year</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="className"
            label="Class Name"
            rules={[{ required: true, message: 'Please enter the class name' }]}
          >
            <Input placeholder="Enter class name" />
          </Form.Item>
          <Form.Item
            name="section"
            label="Section"
            rules={[{ required: true, message: 'Please select the section' }]}
          >
            <Select placeholder="Select Section">
              <Option value="N/A">N/A</Option>
              <Option value="A">A</Option>
              <Option value="B">B</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="classVenue"
            label="Class Venue"
            rules={[{ required: true, message: 'Please enter the class Venue' }]}
          >
            <Input placeholder="Enter class Venue" />
          </Form.Item>
          <Form.Item
            name="classAdvisor"
            label="Class Advisor"
            rules={[{ required: true, message: 'Please select the class advisor' }]}
          >
            {(() => {
              // Collect all assigned advisor IDs except for the current class in edit mode
              const assignedAdvisorIds = classes
                .filter(cls => !isEditMode || cls._id !== editingClass?._id)
                .map(cls => {
                  if (cls.classAdvisor && typeof cls.classAdvisor === 'object') {
                    return cls.classAdvisor._id;
                  }
                  return cls.classAdvisor;
                })
                .filter(Boolean);
              return (
                <Select placeholder="Select class advisor">
                  {faculties.map(faculty => (
                    <Option
                      key={faculty._id}
                      value={faculty._id}
                      disabled={assignedAdvisorIds.includes(faculty._id)}
                    >
                      {faculty.name || faculty.username} ({faculty.facultyId})
                      {assignedAdvisorIds.includes(faculty._id) ? 
                        ` (Already Advisor for ${classes.find(cls => {
                          const advisorId = typeof cls.classAdvisor === 'object' ? cls.classAdvisor._id : cls.classAdvisor;
                          return advisorId === faculty._id;
                        })?.year + '/' + (classes.find(cls => {
                          const advisorId = typeof cls.classAdvisor === 'object' ? cls.classAdvisor._id : cls.classAdvisor;
                          return advisorId === faculty._id;
                        })?.className || 'another class') +'/'+ (classes.find(cls => {
                          const advisorId = typeof cls.classAdvisor === 'object' ? cls.classAdvisor._id : cls.classAdvisor;
                          return advisorId === faculty._id;
                        })?.section || '')})` : 
                        ''}
                    </Option>
                  ))}
                </Select>
              );
            })()}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditMode ? 'Save Changes' : 'Add Class'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageClasses;
