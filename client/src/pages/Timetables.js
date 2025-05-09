import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Select, Space, message, 
  Tooltip, notification, Alert, Spin, Typography 
} from 'antd';
import TimetableGrid from '../components/TimetableGrid';
import API_BASE_URL from '../api/config';

const { Title, Text } = Typography;

/**
 * Timetables Component - Manages class timetables for TTIncharge users
 * Supports viewing, creating, and editing timetables with faculty availability checking
 */
const Timetables = () => {
  // State variables
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState({});
  const [loading, setLoading] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [facultyConflicts, setFacultyConflicts] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [existingTimetable, setExistingTimetable] = useState([]);

  const [form] = Form.useForm();

  // Reset modal state
  const resetModal = () => {
    setFacultyConflicts({});
    setSelectedSubjects({});
  };

  // Fetch classes from backend on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch classes from backend
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/classes`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      
      const transformedClasses = data.map(cls => ({
        ...cls,
        key: cls._id
      }));
      
      setClasses(transformedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      message.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Timetable Button Click
  const handleCreateTimetable = async (record) => {
    try {
      setLoading(true);
      setSelectedClass(record);
      
      const response = await fetch(`${API_BASE_URL}/class-timetables/${record._id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      let existingTimetable = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.timetable) {
          existingTimetable = data.timetable;
        }
      }
      
      const facultyAssignmentsResponse = await fetch(`${API_BASE_URL}/classes/${record._id}/faculty-assignments`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const subjectFacultyMap = {};
      
      if (facultyAssignmentsResponse.ok) {
        const facultyAssignments = await facultyAssignmentsResponse.json();
        facultyAssignments.forEach(assignment => {
          if (assignment.subjectCode && assignment.primaryFaculty) {
            const facultyId = typeof assignment.primaryFaculty === 'string' 
              ? assignment.primaryFaculty 
              : assignment.primaryFaculty.$oid || assignment.primaryFaculty;
            
            let secondaryFacultyId = null;
            if (assignment.secondaryFaculty) {
              secondaryFacultyId = typeof assignment.secondaryFaculty === 'string'
                ? assignment.secondaryFaculty
                : assignment.secondaryFaculty.$oid || assignment.secondaryFaculty;
            }
            
            subjectFacultyMap[assignment.subjectCode] = {
              facultyId,
              facultyName: null,
              facultyEmployeeId: null,
              secondaryFacultyId,
              secondaryFacultyName: null
            };
          }
        });
      } else {
        console.warn('Failed to fetch faculty assignments, continuing without them');
      }
      
      try {
        const facultyIds = Object.values(subjectFacultyMap)
          .flatMap(mapping => [mapping.facultyId, mapping.secondaryFacultyId])
          .filter(id => id);
        
        if (facultyIds.length > 0) {
          const usernamesResponse = await fetch(`${API_BASE_URL}/users/usernames`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userIds: facultyIds })
          });
          
          let usernamesMap = {};
          if (usernamesResponse.ok) {
            usernamesMap = await usernamesResponse.json();
          }
          
          Object.keys(subjectFacultyMap).forEach(subjectCode => {
            const mapping = subjectFacultyMap[subjectCode];
            mapping.facultyName = usernamesMap[mapping.facultyId] || mapping.facultyId;
            mapping.facultyEmployeeId = mapping.facultyId;
            if (mapping.secondaryFacultyId) {
              mapping.secondaryFacultyName = usernamesMap[mapping.secondaryFacultyId] || mapping.secondaryFacultyId;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching faculty usernames:', error);
        Object.keys(subjectFacultyMap).forEach(subjectCode => {
          const mapping = subjectFacultyMap[subjectCode];
          mapping.facultyName = mapping.facultyId;
          mapping.facultyEmployeeId = mapping.facultyId;
          if (mapping.secondaryFacultyId) {
            mapping.secondaryFacultyName = mapping.secondaryFacultyId;
          }
        });
      }
      
      const subjectsResponse = await fetch(`${API_BASE_URL}/subjects/class/${record._id}`, {
        credentials: 'include'
      });
      
      if (!subjectsResponse.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const subjectsData = await subjectsResponse.json();
      
const subjectOptions = subjectsData.map(subject => {
  const facultyInfo = subjectFacultyMap[subject.subjectCode] || {};
  const acronym = subject.acronym ;
  return {
    value: subject.subjectCode,
    label: `${subject.subjectCode} - ${subject.subjectName}`,
    shortLabel: `${acronym} - ${subject.subjectCode}`,
    code: subject.subjectCode,
    _id: subject._id,
    subjectName: subject.subjectName,
    acronym: acronym,
    facultyId: facultyInfo.facultyId || null,
    facultyName: facultyInfo.facultyName || 'Not Assigned',
    facultyEmployeeId: facultyInfo.facultyEmployeeId || '',
    secondaryFacultyId: facultyInfo.secondaryFacultyId || null,
    secondaryFacultyName: facultyInfo.secondaryFacultyName || null
  };
});
      
      setSubjects(subjectOptions);
      
      const initialValues = {};
      const initialSubjects = {};
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const hourNames = [
        'firstHour', 'secondHour', 'thirdHour', 'fourthHour', 
        'fifthHour', 'sixthHour', 'seventhHour'
      ];
      
      days.forEach(day => {
        const daySchedule = existingTimetable.find(d => d.day === day);
        if (daySchedule) {
          hourNames.forEach((hourName, index) => {
            const hour = daySchedule[hourName];
            const periodKey = `${day}-period-${index + 1}`;
            if (hour && hour.subject) {
              const matchingSubject = subjectOptions.find(opt => 
                opt._id === hour.subject._id || 
                opt.code === hour.subject.subjectCode
              );
              if (matchingSubject) {
                initialValues[periodKey] = matchingSubject.value;
                initialSubjects[periodKey] = matchingSubject;
              }
            }
          });
        }
      });
      
      form.setFieldsValue(initialValues);
      setSelectedSubjects(initialSubjects);
      
      setIsCreateModalVisible(true);
    } catch (error) {
      console.error('Error preparing timetable form:', error);
      message.error('Failed to prepare timetable form');
    } finally {
      setLoading(false);
    }
  };

  // Generate acronym from a subject name
  const generateAcronym = (subjectName) => {
    if (!subjectName) return '';
    return subjectName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  // Handle form submission for saving timetable
  const handleSubmit = async () => {
    try {
      const values = {};
      Object.keys(selectedSubjects).forEach(key => {
        values[key] = selectedSubjects[key];
      });
      await handleSaveTimetable(values);
    } catch (error) {
      console.error('Error saving timetable:', error);
      message.error('Failed to save timetable');
    }
  };

  // Handle saving timetable to backend
  const handleSaveTimetable = async (values) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const hourNames = [
      'firstHour', 'secondHour', 'thirdHour', 'fourthHour', 
      'fifthHour', 'sixthHour', 'seventhHour'
    ];

    const timetable = days.map(day => {
      const dayTimetable = { day };
      for (let i = 0; i < 7; i++) {
        const periodKey = `${day}-period-${i + 1}`;
        let periodValue = values[periodKey];

        // If periodValue is a string (subject code), find full subject object
        if (typeof periodValue === 'string') {
          const foundSubject = subjects.find(s => s.value === periodValue);
          if (foundSubject) {
            periodValue = foundSubject;
          }
        }

        if (periodValue) {
          let subjectId = null;
          let primaryFacultyId = null;
          let secondaryFacultyId = null;

          if (typeof periodValue === 'object') {
            if (periodValue._id) {
              subjectId = periodValue._id;
            } else if (periodValue.code) {
              subjectId = periodValue.code;
            }
            primaryFacultyId = periodValue.primaryFacultyId || periodValue.facultyId || null;
            secondaryFacultyId = periodValue.secondaryFacultyId || null;
          } else {
            subjectId = periodValue;
          }

          dayTimetable[hourNames[i]] = {
            subject: subjectId,
            primaryFaculty: primaryFacultyId,
            secondaryFaculty: secondaryFacultyId,
            venue: periodValue.classVenue || null
          };
        } else {
          dayTimetable[hourNames[i]] = {
            subject: null,
            primaryFaculty: null,
            secondaryFaculty: null,
            venue: null
          };
        }
      }
      return dayTimetable;
    });

    // Debug log to verify primaryFaculty presence
    console.log('Constructed timetable for saving:', timetable);

    const facultyUpdatePromises = [];

    days.forEach(day => {
      hourNames.forEach((hourName, index) => {
        const periodData = timetable.find(t => t.day === day)?.[hourName];
        if (periodData && (periodData.primaryFaculty || periodData.secondaryFaculty)) {
          const updatePayloads = [];
          if (periodData.primaryFaculty) {
            updatePayloads.push({
              facultyId: periodData.primaryFaculty,
              day: day,
              period: index + 1,
              subject: periodData.subject?._id || periodData.subject || null,
              class: selectedClass._id
            });
          }
          if (periodData.secondaryFaculty) {
            updatePayloads.push({
              facultyId: periodData.secondaryFaculty,
              day: day,
              period: index + 1,
              subject: periodData.subject?._id || periodData.subject || null,
              class: selectedClass._id
            });
          }
          updatePayloads.forEach(updatePayload => {
            const updatePromise = fetch(`${API_BASE_URL}/faculty-timetables/update-period`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload)
            }).then(async response => {
              const responseBody = await response.json();
              if (!response.ok) {
                console.error('Faculty timetable update failed:', {
                  status: response.status,
                  payload: updatePayload,
                  response: responseBody
                });
                throw new Error(responseBody.message || 'Update failed');
              }
              return responseBody;
            });
            facultyUpdatePromises.push(updatePromise);
          });
        }
      });
    });

    try {
      const updateResults = await Promise.allSettled(facultyUpdatePromises);
      const successfulUpdates = updateResults.filter(result => result.status === 'fulfilled');
      const failedUpdates = updateResults.filter(result => result.status === 'rejected');

      if (failedUpdates.length > 0) {
        notification.warning({
          message: 'Partial Update',
          description: `${failedUpdates.length} faculty timetable updates failed. Check console for details.`
        });
      }
    } catch (error) {
      notification.error({
        message: 'Update Error',
        description: 'Could not update faculty timetables. Please try again.'
      });
    }

    const response = await fetch(`${API_BASE_URL}/class-timetables/${selectedClass._id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timetable })
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: responseText };
    }

    if (response.ok) {
      setClasses(prev => prev.map(cls => 
        cls.key === selectedClass.key 
          ? { ...cls, timetable: timetable } 
          : cls
      ));
      message.success(responseData.message || 'Timetable saved successfully');
      if (responseData.facultyConflicts && responseData.facultyConflicts.length > 0) {
        // Handle conflicts display if needed
      }
      setIsCreateModalVisible(false);
      form.resetFields();
      setSelectedSubjects({});
    } else {
      message.error(responseData.error || 'Failed to save timetable');
    }
  };

  // Handle subject selection in timetable grid
  const handleSubjectSelect = async (day, periodIndex, value) => {
    const hourKeys = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 'fifthHour', 'sixthHour', 'seventhHour'];
    const key = `${day}-period-${periodIndex + 1}`;
    const selectedSubject = subjects.find(s => s.value === value);

    setFacultyConflicts(prev => {
      const newConflicts = { ...prev };
      Object.keys(newConflicts).forEach(conflictKey => {
        if (conflictKey.startsWith(`${day}-${periodIndex}-`)) {
          delete newConflicts[conflictKey];
          try {
            notification.destroy(`conflict-${day}-${periodIndex}`);
          } catch (err) {}
        }
      });
      return newConflicts;
    });

    if (!value) {
      setSelectedSubjects(prev => ({ ...prev, [key]: null }));
      return;
    }

    if (selectedSubject && selectedSubject.facultyId) {
      try {
        const response = await fetch(`${API_BASE_URL}/faculty-timetables/check-availability?facultyId=${selectedSubject.facultyId}&day=${day}&period=${periodIndex + 1}&currentClassId=${selectedClass._id}`, {
          credentials: 'include'
        });
        if (!response.ok) return;
        const result = await response.json();
        if (!result.available && result.conflict) {
          setFacultyConflicts(prev => ({
            ...prev,
            [`${day}-${periodIndex}-${selectedSubject._id}`]: {
              faculty: selectedSubject.facultyName || selectedSubject.facultyId,
              day,
              period: periodIndex + 1,
              className: result.conflict.className || 'Another class',
              subject: result.conflict.subject || 'Unknown subject'
            }
          }));
          notification.warning({
            message: 'Faculty Schedule Conflict',
            description: (
              <div style={{ fontSize: '12px' }}>
                <p>
                  <b>{selectedSubject.facultyName}</b> is already assigned to{' '}
                  <b>
                    {result.conflict.year || ''} {result.conflict.className || ''}
                    {result.conflict.section && result.conflict.section !== 'N/A' ? ` ${result.conflict.section}` : ''}
                  </b>{' '}
                  for the subject <b>{subjects.find(s => s._id === result.conflict.subject)?.acronym || result.conflict.subject}</b>.
                </p>
              </div>
            ),
            duration: 4,
            key: `conflict-${day}-${periodIndex}`,
            style: { width: 300 }
          });
        }
      } catch (error) {
        console.error('Error checking faculty availability:', error);
      }
    }

    setSelectedSubjects(prev => ({ ...prev, [key]: selectedSubject }));
  };

  // Show view modal
const showViewModal = async (record) => {
    try {
      setLoading(true);
      setSelectedClass(record);
      const response = await fetch(`${API_BASE_URL}/class-timetables/${record._id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const timetableData = await response.json();
      if (!response.ok) throw new Error('Failed to fetch timetable');

      // Fetch subjects for the class to get stored acronyms
      const subjectsResponse = await fetch(`${API_BASE_URL}/subjects/class/${record._id}`, {
        credentials: 'include'
      });
      let subjectsData = [];
      if (subjectsResponse.ok) {
        subjectsData = await subjectsResponse.json();
      } else {
        console.warn('Failed to fetch subjects for acronym mapping');
      }

      // Create a map of subjectCode or _id to subject object including acronym
      const subjectMap = {};
      subjectsData.forEach(subject => {
        subjectMap[subject.subjectCode] = subject;
        subjectMap[subject._id] = subject;
      });

      // Enrich timetable with stored acronym in each period's subject
      const enrichedTimetable = (timetableData.timetable || []).map(daySchedule => {
        const hourKeys = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 'fifthHour', 'sixthHour', 'seventhHour'];
        const newDaySchedule = { ...daySchedule };
        hourKeys.forEach(hourKey => {
          const period = newDaySchedule[hourKey];
          if (period && period.subject) {
            let subjectObj = null;
            if (typeof period.subject === 'object') {
              // If subject is object, try to find in map by _id or subjectCode
              subjectObj = subjectMap[period.subject._id] || subjectMap[period.subject.subjectCode] || period.subject;
            } else {
              // If subject is string id or code
              subjectObj = subjectMap[period.subject] || { subjectName: period.subject, acronym: '' };
            }
            newDaySchedule[hourKey] = {
              ...period,
              subject: subjectObj
            };
          }
        });
        return newDaySchedule;
      });

      setExistingTimetable(timetableData.timetable || []);
      setSelectedTimetable(enrichedTimetable);
      setIsViewModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  // Show edit modal
  const showEditModal = async (record) => {
    await handleCreateTimetable(record);
  };

  // Table columns
  const columns = [
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Class Name',
      dataIndex: 'className',
      key: 'className',
      render: (text, record) => record.className || 'Unknown Class'
    },
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showViewModal(record)}>View</Button>
          <Button type="default" size="small" onClick={() => showEditModal(record)}>Create/Edit</Button>
        </Space>
      )
    }
  ];

  // Generate columns for timetable edit grid
  const generateTimetableEditColumns = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodTimes = [
      '8:45 AM - 9:45 AM',
      '9:45 AM - 10:45 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 1:00 PM',
      '1:45 PM - 2:45 PM',
      '2:45 PM - 3:45 PM',
      '3:45 PM - 4:45 PM'
    ];
    
    return [
      {
        title: 'Day',
        dataIndex: 'day',
        key: 'day',
        width: 100,
        render: text => <strong>{text}</strong>,
        fixed: 'left',
      },
      ...Array(7).fill().map((_, i) => ({
        title: (
          <div>
            <strong>{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]} Hour</strong>
            <br />
            {periodTimes[i]}
          </div>
        ),
        dataIndex: 'periods',
        key: `period${i+1}`,
        width: 120,
        render: (_, record) => {
          const day = record.day;
          const periodKey = `${day}-period-${i+1}`;
          const selectedValue = selectedSubjects[periodKey];
          
          const hasConflict = Object.keys(facultyConflicts).some(key => 
            key === `${day}-${i}-${selectedValue?._id}`
          );
          
          const getTooltipContent = () => {
            if (!selectedValue || typeof selectedValue !== 'object') return null;

            let facultyNames = selectedValue.facultyName || 'Not assigned';
            if (selectedValue.secondaryFacultyName) {
              facultyNames += `, ${selectedValue.secondaryFacultyName}`;
            }

            return (
              <div style={{ fontSize: '12px' }}>
                <p><strong>Subject:</strong> {selectedValue.subjectName || selectedValue.label || 'Unknown'}</p>
                <p><strong>Subject Code:</strong> {selectedValue.code}</p>
                <p><strong>Faculty:</strong> {facultyNames}</p>
                {selectedValue.facultyEmployeeId && <p><strong>Faculty ID:</strong> {selectedValue.facultyEmployeeId}</p>}
                {hasConflict && (
                  <div style={{ marginTop: '8px', color: '#faad14' }}>
                    <p><strong>Warning:</strong> Faculty scheduling conflict detected!</p>
                    {facultyConflicts[`${day}-${i}-${selectedValue._id}`]?.conflict && (
                      <p>Already assigned to: {facultyConflicts[`${day}-${i}-${selectedValue._id}`].conflict.className}</p>
                    )}
                  </div>
                )}
              </div>
            );
          };
          
          const selectedDisplay = selectedValue && typeof selectedValue === 'object' ? (
            <Tooltip title={getTooltipContent()} placement="right">
              <span>{selectedValue.acronym || selectedValue.code}</span>
            </Tooltip>
          ) : null;
          
          return (
            <Select
              allowClear
              showSearch
              placeholder="Select subject"
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={subjects.map(subject => ({
                ...subject,
                label: (
                  <Tooltip title={
                    <div style={{ fontSize: '12px' }}>
                      <p><strong>Subject:</strong> {subject.subjectName}</p>
                      <p><strong>Faculty:</strong> {subject.facultyName || 'Not assigned'}</p>
                    </div>
                  } placement="right">
                    <span>{subject.acronym} - {subject.code}</span>
                  </Tooltip>
                )
              }))}
              value={selectedValue?.value || selectedValue}
              onChange={(value) => handleSubjectSelect(day, i, value)}
              dropdownMatchSelectWidth={false}
              status={hasConflict ? 'warning' : undefined}
              dropdownRender={menu => (
                <div>
                  {menu}
                  {hasConflict && (
                    <Alert 
                      message="Faculty scheduling conflict!" 
                      type="warning" 
                      showIcon 
                      style={{ margin: '8px' }}
                    />
                  )}
                </div>
              )}
            />
          );
        }
      }))
    ];
  };

  // Generate data for timetable edit grid
  const generateTimetableEditData = () => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
      key: day,
      day
    }));
  };

  // Close view modal
  const handleViewCancel = () => {
    setIsViewModalVisible(false);
    setSelectedTimetable(null);
    setSelectedClass(null);
  };

  // Close create/edit modal
  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
    setSelectedClass(null);
    form.resetFields();
    setSelectedSubjects({});
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Class Timetables</Title>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Manage timetables for classes in your department. View, create, or edit timetables.
        </Text>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={classes} 
        loading={loading}
        rowKey="key"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50']
        }}
      />

      <Modal
        title={selectedClass ? `Timetable for ${selectedClass.year} ${selectedClass.className || selectedClass.department?.name || 'Class'} ${(selectedClass.section == 'N/A')? selectedClass.section : ''}` : 'View Timetable'}
        visible={isViewModalVisible}
        onCancel={() => {
          handleViewCancel();
          resetModal();
        }}
        footer={null}
        width={800}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading timetable...</div>
          </div>
        ) : selectedTimetable && selectedTimetable.length > 0 ? (
          <TimetableGrid timetables={selectedTimetable} useAcronyms={true} />
        ) : (
          <Alert 
            message="No timetable available" 
            description="No timetable has been created for this class yet." 
            type="info" 
          />
        )}
      </Modal>

      <Modal
        title={selectedClass ? `Edit Timetable for ${selectedClass.year} ${selectedClass.className || selectedClass.department?.name || 'Class'} ${(selectedClass.section == 'N/A') ? '' : selectedClass.subject}` : 'Create Timetable'}
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          resetModal();
        }}
        footer={null}
        width='70%'
      >
        <Spin spinning={loading}>
          {Object.keys(facultyConflicts).length > 0 && (
            <Alert 
              message="Faculty Schedule Conflicts Detected"
              description="There are faculty scheduling conflicts. Please resolve them before saving."
              type="warning"
              showIcon
              style={{ marginBottom: 10}}
            />
          )}
          
          <div style={{ marginBottom: 16 }}>
            <Table
              columns={generateTimetableEditColumns()}
              dataSource={generateTimetableEditData()}
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 960 }}
              style={{ overflow: 'visible' }}
            />
          </div>
          
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                resetModal();
              }}>Cancel</Button>
              <Button 
                type="primary" 
                onClick={handleSubmit}
                disabled={Object.keys(facultyConflicts).length > 0}
                loading={loading}
              >
                Save Timetable
              </Button>
            </Space>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default Timetables;
