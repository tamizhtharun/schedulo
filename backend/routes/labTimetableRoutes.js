const express = require('express');
const router = express.Router();
const ClassTimetable = require('../models/ClassTimetable');
const FacultyTimetable = require('../models/FacultyTimetable');
const LabTimetable = require('../models/LabTimetable');

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const validHours = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 'fifthHour', 'sixthHour', 'seventhHour'];

// Helper function to check lab conflicts
const checkLabConflicts = async (labId, day, hour, classId) => {
  try {
    if (!labId || !day || !hour || !classId) {
      console.log('Missing parameter in checkLabConflicts:', { labId, day, hour, classId });
      return { hasConflict: false };
    }

    const labTimetable = await LabTimetable.findOne({ lab: labId });
    if (!labTimetable) {
      console.log('No lab timetable found for:', labId);
      return { hasConflict: false };
    }

    const dayTimetable = labTimetable.timetable.find(d => d.day === day);
    if (!dayTimetable) {
      console.log('No day timetable found for:', day);
      return { hasConflict: false };
    }

    const hourData = dayTimetable[hour];
    if (hourData && hourData.class) {
      const hourClassId = typeof hourData.class === 'object' && hourData.class._id
        ? hourData.class._id.toString()
        : String(hourData.class);
      const currentClassId = String(classId);

      if (hourClassId && hourClassId !== currentClassId) {
        // Conflict detected
        return {
          hasConflict: true,
          conflictDetails: {
            day,
            hour,
            classId: hourClassId,
            subject: hourData.subject || 'Unknown subject'
          }
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking lab conflicts:', error);
    return { hasConflict: false, error: error.message };
  }
};

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
    // Check for lab conflicts before assignment
    const conflict = await checkLabConflicts(labId, day, hour, classId);
    if (conflict.hasConflict) {
      return res.status(409).json({
        message: 'Lab conflict detected',
        conflictDetails: conflict.conflictDetails
      });
    }

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
    try {
      console.log('Saving lab timetable for lab:', labId);
      await labTimetable.save();
      console.log('Lab timetable saved successfully for lab:', labId);
    } catch (saveError) {
      console.error('Error saving lab timetable:', saveError);
      return res.status(500).json({ message: 'Failed to save lab timetable', error: saveError.message });
    }

    res.json({ message: 'Lab subject assigned and timetables updated successfully' });
  } catch (error) {
    console.error('Error assigning lab subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// New GET /class/:classId - Get lab timetable entries for a class
router.get('/class/:classId', async (req, res) => {
  const { classId } = req.params;
  if (!classId) {
    return res.status(400).json({ message: 'Missing classId parameter' });
  }

  try {
    // Find all lab timetables where the class appears in any day/hour
    const labTimetables = await LabTimetable.find({}).populate('lab');

    // Filter timetable entries for the given classId
    const result = [];

    labTimetables.forEach(labTimetable => {
      const labId = labTimetable.lab._id.toString();
      labTimetable.timetable.forEach(dayEntry => {
        const day = dayEntry.day;
        validHours.forEach(hour => {
          const period = dayEntry[hour];
          if (period && period.class && period.class.toString() === classId) {
            result.push({
              labId,
              day,
              hour,
              subject: period.subject,
              class: period.class
            });
          }
        });
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching lab timetable for class:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /lab-timetables/lab/:labId - Get lab timetable for a specific lab
router.get('/lab/:labId', async (req, res) => {
  const { labId } = req.params;
  if (!labId) {
    return res.status(400).json({ message: 'Missing labId parameter' });
  }

  try {
    // Populate subject fields in timetable for each hour
    const labTimetable = await LabTimetable.findOne({ lab: labId })
      .populate('lab')
      .populate('timetable.firstHour.subject')
      .populate('timetable.secondHour.subject')
      .populate('timetable.thirdHour.subject')
      .populate('timetable.fourthHour.subject')
      .populate('timetable.fifthHour.subject')
      .populate('timetable.sixthHour.subject')
      .populate('timetable.seventhHour.subject');
    if (!labTimetable) {
      return res.status(404).json({ message: 'Lab timetable not found' });
    }
    res.json(labTimetable.timetable);
  } catch (error) {
    console.error('Error fetching lab timetable for lab:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
