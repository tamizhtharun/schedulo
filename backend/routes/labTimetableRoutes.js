const express = require('express');
const router = express.Router();
const ClassTimetable = require('../models/ClassTimetable');
const FacultyTimetable = require('../models/FacultyTimetable');
const LabTimetable = require('../models/LabTimetable');

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const validHours = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 'fifthHour', 'sixthHour', 'seventhHour'];

// POST /labTimetable/assign - Assign a lab subject for an hour and update all timetables
router.post('/assign', async (req, res) => {
  const { classId, facultyId, labId, subjectId, day, hour } = req.body;

  if (!classId || !facultyId || !labId || !subjectId || !day || !hour) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!validDays.includes(day)) {
    return res.status(400).json({ message: 'Invalid day' });
  }
  if (!validHours.includes(hour)) {
    return res.status(400).json({ message: 'Invalid hour' });
  }

  try {
    // Update ClassTimetable
    let classTimetable = await ClassTimetable.findOne({ class: classId });
    if (!classTimetable) {
      classTimetable = new ClassTimetable({ class: classId, timetable: [] });
    }
    let classDayEntry = classTimetable.timetable.find(d => d.day === day);
    if (!classDayEntry) {
      classDayEntry = { day };
      validHours.forEach(h => {
        classDayEntry[h] = { subject: null, primaryFaculty: null, secondaryFaculty: null };
      });
      classTimetable.timetable.push(classDayEntry);
    }
    classDayEntry[hour] = { subject: subjectId, primaryFaculty: facultyId, secondaryFaculty: null };
    await classTimetable.save();

    // Update FacultyTimetable
    let facultyTimetable = await FacultyTimetable.findOne({ faculty: facultyId });
    if (!facultyTimetable) {
      facultyTimetable = new FacultyTimetable({ faculty: facultyId, timetable: [], year: new Date().getFullYear() });
    }
    let facultyDayEntry = facultyTimetable.timetable.find(d => d.day === day);
    if (!facultyDayEntry) {
      facultyDayEntry = { day };
      validHours.forEach(h => {
        facultyDayEntry[h] = { subject: null, class: null };
      });
      facultyTimetable.timetable.push(facultyDayEntry);
    }
    facultyDayEntry[hour] = { subject: subjectId, class: classId };
    await facultyTimetable.save();

    // Update LabTimetable
    let labTimetable = await LabTimetable.findOne({ lab: labId });
    if (!labTimetable) {
      labTimetable = new LabTimetable({ lab: labId, timetable: [] });
    }
    let labDayEntry = labTimetable.timetable.find(d => d.day === day);
    if (!labDayEntry) {
      labDayEntry = { day };
      validHours.forEach(h => {
        labDayEntry[h] = { subject: null, class: null };
      });
      labTimetable.timetable.push(labDayEntry);
    }
    labDayEntry[hour] = { subject: subjectId, class: classId };
    await labTimetable.save();

    res.json({ message: 'Lab subject assigned and timetables updated successfully' });
  } catch (error) {
    console.error('Error assigning lab subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
