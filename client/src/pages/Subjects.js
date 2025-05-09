import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Select, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import API_BASE_URL from '../api/config';
import axios from '../api/axios';

const { Option } = Select;

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [classId, setClassId] = useState(null);
  const [classDeptId, setClassDeptId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Retrieve class for this advisor
        const classRes = await axios.get('/classes/my-class');
        const classData = classRes.data;
        setClassId(classData._id);
        setClassDeptId(classData.department);
        setSelectedSubjects(Array.isArray(classData.subjects) ? classData.subjects : []);

        // Fetch all subjects
        const subjectsRes = await axios.get('/subjects/all');
        const subjectsData = subjectsRes.data;
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch (error) {
        message.error('Failed to fetch data.');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddSubjects = async (values) => {
    if (!classId) return;
    setLoading(true);
    try {
      const codes = [...(values.deptSubjectCodes || []), ...(values.otherSubjectCodes || [])];
      await axios.put(`/classes/${classId}/subjects`, { subjects: codes });
      setSelectedSubjects(codes);
      message.success('Subjects updated successfully!');
      form.resetFields();
    } catch (error) {
      message.error('Failed to update subjects.');
    }
    setLoading(false);
  };

  const handleRemoveSubject = async (subjectCode) => {
    if (!classId) return;
    setLoading(true);
    try {
      const updatedSubjects = selectedSubjects.filter(code => code !== subjectCode);
      await axios.put(`/classes/${classId}/subjects`, { subjects: updatedSubjects });
      setSelectedSubjects(updatedSubjects);
      message.success('Subject removed successfully!');
    } catch (error) {
      message.error('Failed to remove subject.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Assign Subjects to Your Class</h2>

      {/* Inline add sections */}
      <Form form={form} layout="vertical" onFinish={handleAddSubjects}>
        <h3>Department Subjects</h3>
        <Form.Item name="deptSubjectCodes" label="Department Subjects">
          <Select
            mode="multiple"
            placeholder="Select Department Subjects"
            loading={loading}
            allowClear
          >
            {subjects.filter(sub => sub.department._id === classDeptId).map(sub => (
              <Option key={sub.subjectCode} value={sub.subjectCode}>
                {sub.subjectName} ({sub.subjectCode})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <h3>Other Department Subjects</h3>
        <Form.Item name="otherSubjectCodes" label="Other Department Subjects">
          <Select
            mode="multiple"
            placeholder="Select Other Department Subjects"
            loading={loading}
            allowClear
          >
            {subjects.filter(sub => sub.department._id !== classDeptId).map(sub => (
              <Option key={sub.subjectCode} value={sub.subjectCode}>
                {sub.subjectName} ({sub.subjectCode}) - {sub.department.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Subjects
          </Button>
        </Form.Item>
      </Form>

      <Table
        dataSource={subjects.filter(sub => selectedSubjects.includes(sub.subjectCode)).map((subject, idx) => ({
          ...subject,
          key: subject.subjectCode || idx,
        }))}
        columns={[
          {
            title: 'S.No',
            render: (_, __, index) => index + 1,
            align: 'center',
          },
          {
            title: 'Subject Code',
            dataIndex: 'subjectCode',
            key: 'subjectCode',
            align: 'center',
          },
          {
            title: 'Subject Name',
            dataIndex: 'subjectName',
            key: 'subjectName',
            align: 'left',
          },
          {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
              <Popconfirm
                title="Are you sure you want to remove this subject?"
                onConfirm={() => handleRemoveSubject(record.subjectCode)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger>
                  Remove
                </Button>
              </Popconfirm>
            ),
          },
        ]}
        pagination={{ pageSize: 5 }}
        bordered
        loading={loading}
      />
    </div>
  );
};

export default Subjects;
