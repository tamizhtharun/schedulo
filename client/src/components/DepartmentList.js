import React, { useEffect, useState } from 'react';
import { Tag, Spin, Space, Typography } from 'antd';
import axios from '../api/axios';

const { Title } = Typography;

const DepartmentList = ({ style }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/departments');
        setDepartments(res.data);
      } catch {
        setDepartments([]);
      }
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  if (loading) return <Spin size="small" />;
  if (!departments.length) return <span>No departments found</span>;

  return (
    <div style={style}>
      <Title level={5} style={{ marginBottom: 4 }}>Departments</Title>
      <Space wrap>
        {departments.map(dep => (
          <Tag key={dep._id || dep.name} color="blue">{dep.name}</Tag>
        ))}
      </Space>
    </div>
  );
};

export default DepartmentList;
