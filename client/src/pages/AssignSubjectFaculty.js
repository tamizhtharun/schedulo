import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Table, Select, Button, message, Spin, Tooltip } from 'antd';
import axios from '../api/axios';

const { Option } = Select;

const AssignSubjectFaculty = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const { user } = useAuth();
  const [classSubjects, setClassSubjects] = useState([]); // array of subject objects
  const [assignments, setAssignments] = useState({}); // { subjectCode: { primaryFaculty, secondaryFaculty } }
  const [faculties, setFaculties] = useState([]); // flat list of all faculties
  const [loading, setLoading] = useState(false);
  const [willingnessMap, setWillingnessMap] = useState({}); // { subjectCode: { facultyId: true } }

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        // Use the endpoint that returns classes with subjects filtered by user's department
        const res = await axios.get('/classes/department/classes-with-assignments');
        const classesData = res.data;
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClassId(classesData[0]._id);
        }
      } catch (error) {
        message.error('Failed to load classes.');
      }
      setLoading(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await axios.get('/faculty');
        setFaculties(res.data || []);
      } catch (error) {
        message.error('Failed to load faculties.');
        setFaculties([]);
      }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedClassId) {
        setClassSubjects([]);
        setAssignments({});
        setWillingnessMap({});
        return;
      }
      setLoading(true);
      try {
        const selectedClass = classes.find(cls => cls._id === selectedClassId);
        if (!selectedClass) {
          setClassSubjects([]);
          setAssignments({});
          setWillingnessMap({});
          setLoading(false);
          return;
        }

        setClassSubjects(selectedClass.subjectsDetails || []);

        // Build assignments map from subjectFaculties
        const map = {};
        (selectedClass.subjectFaculties || []).forEach(a => {
          map[a.subjectCode] = {
            primaryFaculty: a.primaryFaculty?._id || null,
            secondaryFaculty: a.secondaryFaculty?._id || null
          };
        });
        setAssignments(map);

        // Fetch willingness for class subjects
        const willingnessRes = await axios.get(`/classes/${selectedClassId}/willingness`);
        const willingnessData = willingnessRes.data;
        // Map of subjectCode -> facultyId -> true
        const wMap = {};
        willingnessData.forEach(w => {
          if (w.subjectCode && w.facultyId && w.willing === true) {
            if (!wMap[w.subjectCode]) wMap[w.subjectCode] = {};
            wMap[w.subjectCode][w.facultyId._id || w.facultyId] = true;
          }
        });
        setWillingnessMap(wMap);

      } catch (error) {
        message.error('Failed to load class details.');
      }
      setLoading(false);
    };
    fetchClassDetails();
  }, [selectedClassId, classes]);

  const handleChange = (subjectCode, field, facultyId) => {
    // If selecting primary faculty, clear secondary if it's the same faculty
    if (field === 'primaryFaculty' && facultyId === assignments[subjectCode]?.secondaryFaculty) {
      setAssignments(prev => ({
        ...prev,
        [subjectCode]: {
          ...prev[subjectCode],
          primaryFaculty: facultyId,
          secondaryFaculty: null
        }
      }));
    } else {
      setAssignments(prev => ({ ...prev, [subjectCode]: { ...prev[subjectCode], [field]: facultyId } }));
    }
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const payload = classSubjects.map(sub => ({
        subjectCode: sub.subjectCode,
        primaryFaculty: assignments[sub.subjectCode]?.primaryFaculty || null,
        secondaryFaculty: assignments[sub.subjectCode]?.secondaryFaculty || null
      }));
      await axios.put(`/classes/${selectedClassId}/faculty-assignments`, { subjectFaculties: payload });
      message.success('Assignments saved successfully!');
    } catch (error) {
      message.error('Failed to assign faculties.');
    }
    setLoading(false);
  };

  const renderFacultyOption = (faculty, subjectCode) => {
    const hasWillingness = willingnessMap[subjectCode]?.[faculty._id];
    const username = typeof faculty.username === 'string' ? faculty.username : '';
    const facultyIdStr = typeof faculty.facultyId === 'string' ? faculty.facultyId : '';
    return (
      <Option key={faculty._id} value={faculty._id}>
        {hasWillingness ? (
          <Tooltip title="Faculty has submitted willingness" color="green">
            <span style={{ fontWeight: 'bold', color: 'green' }}>
              {username} ({facultyIdStr})
            </span>
          </Tooltip>
        ) : (
          `${username} (${facultyIdStr})`
        )}
      </Option>
    );
  };

  const columns = [
    {
      title: 'S.No',
      render: (_, __, idx) => idx + 1,
      align: 'center'
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
      title: 'Primary Faculty',
      key: 'primaryFaculty',
      align: 'center',
      render: (_, record) => (
        <Select
          value={assignments[record.subjectCode]?.primaryFaculty}
          onChange={val => handleChange(record.subjectCode, 'primaryFaculty', val)}
          style={{ width: 200 }}
          placeholder="Primary Faculty"
          allowClear
          loading={loading}
        >
          {faculties.map(fac => renderFacultyOption(fac, record.subjectCode))}
        </Select>
      )
    },
    {
      title: 'Secondary Faculty (Optional)',
      key: 'secondaryFaculty',
      align: 'center',
      render: (_, record) => (
      <Select
        value={assignments[record.subjectCode]?.secondaryFaculty}
        onChange={val => handleChange(record.subjectCode, 'secondaryFaculty', val)}
        style={{ width: 200 }}
        placeholder="Secondary Faculty"
        allowClear
        loading={loading}
      >
        {faculties.map(fac => {
          const isDisabled = fac._id === assignments[record.subjectCode]?.primaryFaculty;
          return (
            <Option key={fac._id} value={fac._id} disabled={isDisabled}>
              {willingnessMap[record.subjectCode]?.[fac._id] ? (
                <Tooltip title="Faculty has submitted willingness" color="green">
                  <span style={{ fontWeight: 'bold', color: 'green' }}>
                    {fac.username} ({fac.facultyId || ''})
                  </span>
                </Tooltip>
              ) : (
                `${fac.username} (${fac.facultyId || ''})`
              )}
            </Option>
          );
        })}
      </Select>
      )
    }
  ];

  const dataSource = classSubjects.map(sub => ({
    key: sub.subjectCode,
    subjectCode: sub.subjectCode,
    subjectName: sub.subjectName,
    department: sub.department
  }));

  return (
    <div>
      <h2>Assign Faculty to Subjects</h2>
      {loading ? (
        <Spin size="large" tip="Loading subject data..." style={{ margin: '50px auto', display: 'block' }} />
      ) : (
        <>
          <Select
            style={{ width: 300, marginBottom: 16 }}
            value={selectedClassId}
            onChange={setSelectedClassId}
            placeholder="Select Class"
          >
            {classes.map(cls => (
              <Option key={cls._id} value={cls._id}>
                {cls.year} {cls.className} {cls.section}
              </Option>
            ))}
          </Select>
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            rowClassName={(record) => willingnessMap[record.subjectCode] ? 'willingness-highlight' : ''}
          />
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            style={{ marginTop: 16 }}
          >
            Assign Faculties
          </Button>
        </>
      )}
    </div>
  );
};

export default AssignSubjectFaculty;
