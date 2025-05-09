import React, { useState } from 'react';
import { Table, Button, Modal } from 'antd';

const ClassesSubjectsList = () => {
  const [classes, setClasses] = useState([
    {
      key: '1',
      className: 'B.Sc Computer Science - A',
      year: '1st Year',
      subjects: ['Mathematics', 'Physics', 'Computer Science', 'English'],
    },
    {
      key: '2',
      className: 'B.Sc Mathematics - B',
      year: '2nd Year',
      subjects: ['Algebra', 'Calculus', 'Statistics', 'Geometry'],
    },
    {
      key: '3',
      className: 'B.Sc Physics - C',
      year: '3rd Year',
      subjects: ['Quantum Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism'],
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  // Handle View Subjects
  const handleViewSubjects = (className, subjects) => {
    setSelectedClass(className);
    setSelectedSubjects(subjects);
    setIsModalVisible(true);
  };

  return (
    <div>
      <h2>Classes and Subjects List</h2>
      <Table
        dataSource={classes}
        columns={[
          {
            title: 'Class Name',
            dataIndex: 'className',
            key: 'className',
            align: 'left',
          },
          {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            align: 'center',
          },
          {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
              <Button
                type="primary"
                onClick={() => handleViewSubjects(record.className, record.subjects)}
              >
                View Subjects
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 5 }}
        bordered
      />
      <Modal
        title={`Subjects for ${selectedClass}`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <ul>
          {selectedSubjects.map((subject, index) => (
            <li key={index}>{subject}</li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default ClassesSubjectsList;