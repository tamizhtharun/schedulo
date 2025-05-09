import React, { useState } from 'react';
import { Table } from 'antd';

const FacultiesList = () => {
  const [faculties] = useState([
    {
      key: '1',
      name: 'John Doe',
      facultyId: 'F001',
      email: 'john.doe@example.com',
      contact: '1234567890',
    },
    {
      key: '2',
      name: 'Jane Smith',
      facultyId: 'F002',
      email: 'jane.smith@example.com',
      contact: '9876543210',
    },
    {
      key: '3',
      name: 'Alice Johnson',
      facultyId: 'F003',
      email: 'alice.johnson@example.com',
      contact: '1122334455',
    },
  ]);

  return (
    <div>
      <h2>Faculties List</h2>
      <Table
        dataSource={faculties}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            align: 'left',
          },
          {
            title: 'Faculty ID',
            dataIndex: 'facultyId',
            key: 'facultyId',
            align: 'center',
          },
          {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            align: 'left',
          },
          {
            title: 'Contact Number',
            dataIndex: 'contact',
            key: 'contact',
            align: 'center',
          },
        ]}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </div>
  );
};

export default FacultiesList;