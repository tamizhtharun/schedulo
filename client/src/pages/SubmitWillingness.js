import React, { useState, useEffect } from 'react';
import { Table, Switch, message, Spin, Input } from 'antd';
import axios from '../api/axios';

const { Search } = Input;

const SubmitWillingness = () => {
  const [classesSubjects, setClassesSubjects] = useState([]);
  const [willingnessMap, setWillingnessMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingMap, setSavingMap] = useState({});
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/classes/department/subject-classes');
        const classesData = res.data;
        console.log('Fetched classesData:', classesData);
        setClassesSubjects(classesData);

        const allWillingness = {};
        for (const cls of classesData) {
          try {
            const willRes = await axios.get(`/classes/${cls._id}/willingness/me`);
            if (willRes.data && willRes.data.subjectCode) {
              allWillingness[`${cls._id}_${willRes.data.subjectCode}`] = willRes.data.willing;
            }
          } catch (error) {
            if (error.response && error.response.status === 404) {
              // No willingness found for this class and faculty, treat as false
              // Explicitly set false to avoid undefined toggle state
              allWillingness[`${cls._id}_no_willingness`] = false;
            } else {
              throw error;
            }
          }
        }
        setWillingnessMap(allWillingness);
      } catch (error) {
        message.error('Failed to load data.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleToggle = async (classId, subjectCode, checked) => {
    setWillingnessMap(prev => ({ ...prev, [`${classId}_${subjectCode}`]: checked }));
    setSavingMap(prev => ({ ...prev, [`${classId}_${subjectCode}`]: true }));
    try {
      await axios.post(`/classes/${classId}/willingness`, {
        subjectCode,
        willing: checked
      });
      message.success('Willingness updated successfully!');
    } catch (error) {
      message.error('Failed to update willingness.');
      setWillingnessMap(prev => ({ ...prev, [`${classId}_${subjectCode}`]: !checked }));
    }
    setSavingMap(prev => ({ ...prev, [`${classId}_${subjectCode}`]: false }));
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'index',
      key: 'index',
      align: 'center',
      render: (_, __, idx) => idx + 1
    },
    {
      title: 'Subject Code',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      align: 'center'
    },
    {
      title: 'Subject Name',
      dataIndex: 'subjectName',
      key: 'subjectName',
      align: 'left'
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      align: 'center',
      render: text => <span>{text}</span>


    },
    {
      title: 'Class',
      dataIndex: 'className',
      key: 'className',
      align: 'center'
    },
    {
      title: 'Class Advisor',
      dataIndex: 'classAdvisor',
      key: 'classAdvisor',
      align: 'center'
    },
    {
      title: 'Willing',
      key: 'willing',
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={willingnessMap[`${record.classId}_${record.subjectCode}`] || false}
          onChange={checked => handleToggle(record.classId, record.subjectCode, checked)}
          loading={savingMap[`${record.classId}_${record.subjectCode}`] || false}
        />
      )
    }
  ];

  const dataSource = [];
  classesSubjects.forEach(cls => {
    cls.subjects.forEach(sub => {
      dataSource.push({
        key: `${cls._id}_${sub.subjectCode}`,
        classId: cls._id,
        subjectCode: sub.subjectCode,
        subjectName: sub.subjectName,
        credit: sub.credit,
        className: `${cls.year} - ${cls.className} ${`-`+ cls.section && cls.section !== 'N/A' ? ' ' + cls.section : ''}`,
        classAdvisor: cls.classAdvisor?.username || 'N/A'
      });
    });
  });

  // Filter dataSource based on searchText
  const filteredData = dataSource.filter(item => {
    const searchLower = searchText.toLowerCase();
    return (
      item.subjectCode.toLowerCase().includes(searchLower) ||
      item.subjectName.toLowerCase().includes(searchLower) ||
      item.className.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <h2>Submit Willingness for Subjects</h2>
      <Input
        placeholder="Search by Subject Code, Subject Name or Class"
        allowClear
        size="middle"
        onChange={e => setSearchText(e.target.value)}
        style={{ width: 400, marginBottom: 16 }}
      />
      {loading ? (
        <Spin size="large" tip="Loading classes and subjects..." style={{ margin: '50px auto', display: 'block' }} />
      ) : (
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 10 }}
          bordered
        />
      )}
    </div>
  );
};

export default SubmitWillingness;
