import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select } from 'antd';
import { PrinterOutlined, EditOutlined } from '@ant-design/icons';

const FacultyTimetable = () => {
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Faculty details
  const [facultyDetails, setFacultyDetails] = useState({
    department: "DEPARTMENT OF ………………………………(Full Name)",
    academicYear: "2024-2025 (Odd Semester)",
    effectiveDate: "22.07.2024",
    labName: "",
    labInCharge: "",
    labInstructor: ""
  });
  
  // Schedule data
  const [scheduleData, setScheduleData] = useState([
    {
      day: "Monday",
      periods: [
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "ES Lab", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" }
      ]
    },
    {
      day: "Tuesday",
      periods: [
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" }
      ]
    },
    {
      day: "Wednesday",
      periods: [
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "ES Lab", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" }
      ]
    },
    {
      day: "Thursday",
      periods: [
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" }
      ]
    },
    {
      day: "Friday",
      periods: [
        { subject: "NM", class: "III/ECE/A", venue: "RK 201" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" },
        { subject: "", class: "", venue: "" }
      ]
    }
  ]);
  
  // Course details
  const [courseDetails, setCourseDetails] = useState([
    {
      type: "T",
      subjectCode: "16BS403",
      subjectName: "Numerical Methods (NM)",
      credit: "4",
      yearBranchSec: "III / ECE / A",
      periods: "5"
    },
    {
      type: "L",
      subjectCode: "16EI612",
      subjectName: "Embedded Systems Laboratory (ES Lab)",
      credit: "1",
      yearBranchSec: "",
      periods: ""
    }
  ]);

  const handlePrint = () => {
    window.print();
  };
  
  const showPrintModal = () => {
    setPrintModalVisible(true);
  };
  
  const showEditModal = () => {
    form.setFieldsValue(facultyDetails);
    setEditModalVisible(true);
  };
  
  const handleEditSave = (values) => {
    setFacultyDetails(values);
    setEditModalVisible(false);
  };

  // Time slots
  const timeSlots = [
    "8:45 AM - 9:45 AM",
    "9:45 AM - 10:45 AM",
    "11:05 AM - 12:05 AM",
    "12:05 AM - 01:05 PM",
    "01:55 PM - 02:45 PM",
    "03:00 PM - 03:50 PM",
    "03:50 PM - 04:40 PM"
  ];
  
  // Break times
  const breakTimes = [
    "10:45 AM - 11:05 AM",
    "01:05 PM - 01:55 PM",
    "02:45 PM - 03:00 PM"
  ];

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4 space-x-2">
        <Button type="primary" icon={<EditOutlined />} onClick={showEditModal}>
          Edit Details
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={showPrintModal}>
          Print View
        </Button>
      </div>
      
      <div className="border border-gray-300 p-6 bg-white">
        {/* Header */}
        <div className="mb-4">
          <div className="text-center font-bold text-lg mb-1">Format No: ACD06_F_01</div>
          <div className="text-center">Issue : 05</div>
          <div className="text-center mb-4">Issue date : 21.06.2024</div>
          
          <div className="text-center font-bold text-xl mb-1">{facultyDetails.department}</div>
          <div className="text-center font-bold text-lg mb-4">INDIVIDUAL FACULTY TIME TABLE</div>
          <div className="text-center">(with effect from: {facultyDetails.effectiveDate})</div>
          <div className="text-center mb-4">Academic Year: {facultyDetails.academicYear}</div>
          
          <div className="flex justify-between mb-2">
            <div>Name of the Laboratory: {facultyDetails.labName}</div>
          </div>
          <div className="flex justify-between mb-2">
            <div>Lab in-charge: {facultyDetails.labInCharge}</div>
          </div>
          <div className="flex justify-between mb-4">
            <div>Lab Instructor: {facultyDetails.labInstructor}</div>
          </div>
        </div>
        
        {/* Timetable */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-sm font-bold" rowSpan="2">Period &<br />Time /<br />Day</th>
                <th className="border border-gray-300 p-2 text-sm font-bold">I</th>
                <th className="border border-gray-300 p-2 text-sm font-bold">II</th>
                <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                  <div className="font-bold">{breakTimes[0]}</div>
                </th>
                <th className="border border-gray-300 p-2 text-sm font-bold">III</th>
                <th className="border border-gray-300 p-2 text-sm font-bold">IV</th>
                <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                  <div className="font-bold">{breakTimes[1]}</div>
                </th>
                <th className="border border-gray-300 p-2 text-sm font-bold">V</th>
                <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                  <div className="font-bold">{breakTimes[2]}</div>
                </th>
                <th className="border border-gray-300 p-2 text-sm font-bold">VI</th>
                <th className="border border-gray-300 p-2 text-sm font-bold">VII</th>
              </tr>
              <tr>
                {timeSlots.map((slot, index) => (
                  index === 2 || index === 4 || index === 6 ? null : (
                    <th key={index} className="border border-gray-300 p-1 text-xs font-normal">{slot}</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((day, dayIndex) => (
                <tr key={dayIndex}>
                  <td className="border border-gray-300 p-2 font-bold">{day.day}</td>
                  {day.periods.map((period, periodIndex) => {
                    // Skip cells where breaks would be
                    if (periodIndex === 2 || periodIndex === 4 || periodIndex === 6) {
                      return null;
                    }
                    
                    // Calculate actual index for rendering
                    let displayIndex = periodIndex;
                    if (periodIndex > 2) displayIndex--;
                    if (periodIndex > 4) displayIndex--;
                    if (periodIndex > 6) displayIndex--;
                    
                    return (
                      <td key={periodIndex} className="border border-gray-300 p-2 text-center">
                        {period.subject && (
                          <div>
                            <div className="font-bold">{period.subject}</div>
                            {period.class && <div className="text-xs">{period.class}</div>}
                            {period.venue && <div className="text-xs">{period.venue}</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {/* Add break cells */}
                  <td className="border border-gray-300 bg-gray-200"></td>
                  <td className="border border-gray-300 bg-gray-200 text-center">
                    {dayIndex === 0 ? "Break" : ""}
                  </td>
                  <td className="border border-gray-300 bg-gray-200"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Subject Details */}
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2">S.No</th>
                <th className="border border-gray-300 p-2">T/L</th>
                <th className="border border-gray-300 p-2">Subject Code-Subject Name</th>
                <th className="border border-gray-300 p-2">Credit</th>
                <th className="border border-gray-300 p-2">Year / Branch / Sec</th>
                <th className="border border-gray-300 p-2">No. of<br />Periods</th>
              </tr>
            </thead>
            <tbody>
              {courseDetails.map((course, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{course.type}</td>
                  <td className="border border-gray-300 p-2">{course.subjectCode}-{course.subjectName}</td>
                  <td className="border border-gray-300 p-2">{course.credit}</td>
                  <td className="border border-gray-300 p-2">{course.yearBranchSec}</td>
                  <td className="border border-gray-300 p-2">{course.periods}</td>
                </tr>
              ))}
              {/* Empty rows to match the PDF */}
              {[...Array(4)].map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border border-gray-300 p-2">{courseDetails.length + index + 1}</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Signature Line */}
        <div className="flex justify-between mt-8">
          <div className="text-center w-64">
            <div className="border-t border-black pt-1">Signature of Faculty member</div>
          </div>
          <div className="text-center w-64">
            <div className="border-t border-black pt-1">HoD</div>
          </div>
        </div>
      </div>
      
      {/* Print Modal */}
      <Modal
        title="Print Preview"
        visible={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="print" onClick={handlePrint} icon={<PrinterOutlined />}>
            Print
          </Button>,
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>
            Cancel
          </Button>
        ]}
        width={1000}
        className="print-modal"
      >
        <div className="print-container">
          {/* Similar content as above, formatted for printing */}
          <div className="border-0 p-6 bg-white">
            {/* Header */}
            <div className="mb-4">
              <div className="text-center font-bold text-lg mb-1">Format No: ACD06_F_01</div>
              <div className="text-center">Issue : 05</div>
              <div className="text-center mb-4">Issue date : 21.06.2024</div>
              
              <div className="text-center font-bold text-xl mb-1">{facultyDetails.department}</div>
              <div className="text-center font-bold text-lg mb-4">INDIVIDUAL FACULTY TIME TABLE</div>
              <div className="text-center">(with effect from: {facultyDetails.effectiveDate})</div>
              <div className="text-center mb-4">Academic Year: {facultyDetails.academicYear}</div>
              
              <div className="flex justify-between mb-2">
                <div>Name of the Laboratory: {facultyDetails.labName}</div>
              </div>
              <div className="flex justify-between mb-2">
                <div>Lab in-charge: {facultyDetails.labInCharge}</div>
              </div>
              <div className="flex justify-between mb-4">
                <div>Lab Instructor: {facultyDetails.labInstructor}</div>
              </div>
            </div>
            
            {/* Timetable */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2 text-sm font-bold" rowSpan="2">Period &<br />Time /<br />Day</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">I</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">II</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                      <div className="font-bold">{breakTimes[0]}</div>
                    </th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">III</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">IV</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                      <div className="font-bold">{breakTimes[1]}</div>
                    </th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">V</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold text-center bg-gray-200" rowSpan="2">
                      <div className="font-bold">{breakTimes[2]}</div>
                    </th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">VI</th>
                    <th className="border border-gray-300 p-2 text-sm font-bold">VII</th>
                  </tr>
                  <tr>
                    {timeSlots.map((slot, index) => (
                      index === 2 || index === 4 || index === 6 ? null : (
                        <th key={index} className="border border-gray-300 p-1 text-xs font-normal">{slot}</th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.map((day, dayIndex) => (
                    <tr key={dayIndex}>
                      <td className="border border-gray-300 p-2 font-bold">{day.day}</td>
                      {day.periods.map((period, periodIndex) => {
                        // Skip cells where breaks would be
                        if (periodIndex === 2 || periodIndex === 4 || periodIndex === 6) {
                          return null;
                        }
                        
                        return (
                          <td key={periodIndex} className="border border-gray-300 p-2 text-center">
                            {period.subject && (
                              <div>
                                <div className="font-bold">{period.subject}</div>
                                {period.class && <div className="text-xs">{period.class}</div>}
                                {period.venue && <div className="text-xs">{period.venue}</div>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      {/* Add break cells */}
                      <td className="border border-gray-300 bg-gray-200"></td>
                      <td className="border border-gray-300 bg-gray-200 text-center">
                        {dayIndex === 0 ? "Break" : ""}
                      </td>
                      <td className="border border-gray-300 bg-gray-200"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Subject Details */}
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2">S.No</th>
                    <th className="border border-gray-300 p-2">T/L</th>
                    <th className="border border-gray-300 p-2">Subject Code-Subject Name</th>
                    <th className="border border-gray-300 p-2">Credit</th>
                    <th className="border border-gray-300 p-2">Year / Branch / Sec</th>
                    <th className="border border-gray-300 p-2">No. of<br />Periods</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDetails.map((course, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{index + 1}</td>
                      <td className="border border-gray-300 p-2">{course.type}</td>
                      <td className="border border-gray-300 p-2">{course.subjectCode}-{course.subjectName}</td>
                      <td className="border border-gray-300 p-2">{course.credit}</td>
                      <td className="border border-gray-300 p-2">{course.yearBranchSec}</td>
                      <td className="border border-gray-300 p-2">{course.periods}</td>
                    </tr>
                  ))}
                  {/* Empty rows to match the PDF */}
                  {[...Array(4)].map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="border border-gray-300 p-2">{courseDetails.length + index + 1}</td>
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Signature Line */}
            <div className="flex justify-between mt-8">
              <div className="text-center w-64">
                <div className="border-t border-black pt-1">Signature of Faculty member</div>
              </div>
              <div className="text-center w-64">
                <div className="border-t border-black pt-1">HoD</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        title="Edit Details"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSave}
          initialValues={facultyDetails}
        >
          <Form.Item
            label="Department"
            name="department"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="Academic Year"
            name="academicYear"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="Effective Date"
            name="effectiveDate"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="Laboratory Name"
            name="labName"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="Lab In-charge"
            name="labInCharge"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="Lab Instructor"
            name="labInstructor"
          >
            <Input />
          </Form.Item>
          
          <Form.Item>
            <div className="flex justify-end">
              <Button htmlType="button" onClick={() => setEditModalVisible(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacultyTimetable;