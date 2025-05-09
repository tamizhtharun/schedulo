import React from 'react';
import { Table, Tooltip } from 'antd';

const TimetableGrid = ({ timetables, useAcronyms = false }) => {
  // Check if timetables is empty
  if (!timetables || timetables.length === 0) {
    return <p>No timetable data available</p>;
  }

  // Determine if we're using hour-based or periods-based structure
  const isHourBased = timetables[0] && 'firstHour' in timetables[0];
  
  // Function to get subject based on structure
  const getSubject = (record, index) => {
    if (isHourBased) {
      // Hour-based structure
      const hourKeys = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 
                        'fifthHour', 'sixthHour', 'seventhHour'];
      const hour = record[hourKeys[index]];
      if (!hour || !hour.subject) return null;
      
      // Return the full subject object if available
      if (typeof hour.subject === 'object') {
        return hour.subject;
      }
      return { subjectName: hour.subject, acronym: '' };
    } else {
      // Periods-based structure
      return record.periods && record.periods[index] ? record.periods[index] : null;
    }
  };

  const columns = [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      align: 'center',
      width: 120,
    },
    ...Array(7).fill().map((_, i) => ({
      title: (
        <div>
          <strong>{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]} Hour</strong>
          <br />
          {['8:45 AM - 9:45 AM', '9:45 AM - 10:45 AM', '10:45 AM - 11:05 AM', '11:05 AM - 12:05 PM', '12:05 PM - 1:05 PM', '1:05 PM - 2:05 PM', '2:05 PM - 3:05 PM'][i]}
        </div>
      ),
      dataIndex: 'periods',
      key: `period${i+1}`,
      render: (_, record) => {
        const subject = getSubject(record, i);
        if (!subject) return '-';
        
        if (useAcronyms) {
          const acronym = typeof subject === 'object' && typeof subject.acronym === 'string' && subject.acronym.trim() !== ''
            ? subject.acronym
            : '';
          const tooltipTitle = typeof subject === 'object' ? subject.subjectName || '' : '';
          return (
            <Tooltip title={tooltipTitle}>
              <span>{acronym || tooltipTitle}</span>
            </Tooltip>
          );
        }
        
        return typeof subject === 'object' ? subject.subjectName : '';
      },
      align: 'center',
    }))
  ];

  return (
    <Table
      dataSource={timetables || []}
      columns={columns}
      pagination={false}
      bordered
    />
  );
};

export default TimetableGrid;
