const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FacultyTimetable = require('../models/FacultyTimetable');
const Classes = require('../models/Classes');
const User = require('../models/User');
const Subject = require('../models/Subject'); // Import Subject model

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// Get all faculty timetables
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const timetables = await FacultyTimetable.find()
      .populate('faculty', 'username facultyId');
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for logged-in faculty user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id; // changed from _id to id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const facultyTimetable = await FacultyTimetable.findOne({ faculty: userId })
      .populate({
        path: 'timetable.firstHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.secondHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.thirdHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.fourthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.fifthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.sixthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.seventhHour.class',
        populate: { path: 'department', select: 'name' }
      });

    if (!facultyTimetable) {
      return res.status(200).json({
        message: 'No timetable found for this faculty',
        timetable: []
      });
    }

    res.status(200).json({
      message: 'Faculty timetable retrieved successfully',
      timetable: facultyTimetable.timetable
    });
  } catch (error) {
    console.error('Error retrieving faculty timetable:', error);
    res.status(500).json({
      message: 'Error retrieving faculty timetable',
      error: error.message
    });
  }
});

// Get timetable for a specific faculty
router.get('/faculty/:facultyId', isAuthenticated, async (req, res) => {
  try {
    const timetable = await FacultyTimetable.findOne({ faculty: req.params.facultyId })
      .populate('faculty', 'username facultyId');
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found for this faculty' });
    }
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new faculty timetable
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { facultyId, timetable, year } = req.body;

        // Validate input
        if (!facultyId) {
            return res.status(400).json({ message: 'Faculty ID is required' });
        }

        // Check if faculty exists
        const faculty = await User.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }

        // Check if timetable already exists
        const existingTimetable = await FacultyTimetable.findOne({ faculty: facultyId });
        if (existingTimetable) {
            return res.status(400).json({ message: 'Timetable already exists for this faculty' });
        }

        // Transform input timetable to match schema
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Group input by day
        const dayGroups = {};
        (timetable || []).forEach(entry => {
            if (!dayGroups[entry.day]) {
                dayGroups[entry.day] = [];
            }
            dayGroups[entry.day].push(entry);
        });

        // Create schema-compliant timetable
        const transformedTimetable = days.map(day => ({
            day,
            firstHour: {
                subject: dayGroups[day]?.[0]?.subject || null,
                class: dayGroups[day]?.[0]?.class || null
            },
            secondHour: {
                subject: dayGroups[day]?.[1]?.subject || null,
                class: dayGroups[day]?.[1]?.class || null
            },
            thirdHour: {
                subject: dayGroups[day]?.[2]?.subject || null,
                class: dayGroups[day]?.[2]?.class || null
            },
            fourthHour: {
                subject: dayGroups[day]?.[3]?.subject || null,
                class: dayGroups[day]?.[3]?.class || null
            },
            fifthHour: {
                subject: dayGroups[day]?.[4]?.subject || null,
                class: dayGroups[day]?.[4]?.class || null
            },
            sixthHour: {
                subject: dayGroups[day]?.[5]?.subject || null,
                class: dayGroups[day]?.[5]?.class || null
            },
            seventhHour: {
                subject: dayGroups[day]?.[6]?.subject || null,
                class: dayGroups[day]?.[6]?.class || null
            }
        }));

        // Create new timetable
        const newTimetable = new FacultyTimetable({
            faculty: facultyId,
            timetable: transformedTimetable,
            year: year || new Date().getFullYear()
        });

        await newTimetable.save();

        res.status(200).json({ message: 'Timetable created successfully', timetable: newTimetable });
    } catch (error) {
        console.error('Error creating faculty timetable:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a specific period in a faculty timetable
router.post('/update-period', isAuthenticated, async (req, res) => {
    try {
        const { facultyId, day, period, subject, class: classId } = req.body;

        console.log('Received update-period request:', { 
            facultyId, 
            day, 
            period, 
            subject: typeof subject === 'object' ? subject?._id : subject, 
            classId 
        });

        // Validate input
        if (!facultyId || !day || !period) {
            console.log('Invalid input: Missing required parameters');
            return res.status(400).json({ message: 'Faculty ID, day, and period are required' });
        }

        // Find or create the faculty timetable
        let facultyTimetable = await FacultyTimetable.findOne({ faculty: facultyId });

        if (!facultyTimetable) {
            console.log('No existing timetable found, creating new timetable');
            // Create a new timetable with empty hours
            facultyTimetable = new FacultyTimetable({
                faculty: facultyId,
                year: new Date().getFullYear(),
                timetable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
                    day,
                    firstHour: { subject: null, class: null, faculty: null },
                    secondHour: { subject: null, class: null, faculty: null },
                    thirdHour: { subject: null, class: null, faculty: null },
                    fourthHour: { subject: null, class: null, faculty: null },
                    fifthHour: { subject: null, class: null, faculty: null },
                    sixthHour: { subject: null, class: null, faculty: null },
                    seventhHour: { subject: null, class: null, faculty: null }
                }))
            });
            await facultyTimetable.save();
            console.log('New timetable created and saved');
        }

        // Define hour keys
        const hourKeys = ['firstHour', 'secondHour', 'thirdHour', 'fourthHour', 'fifthHour', 'sixthHour', 'seventhHour'];

        // Find the specific day in the timetable
        const dayTimetable = facultyTimetable.timetable.find(t => t.day === day);

        if (!dayTimetable) {
            console.log(`Day ${day} not found in timetable`);
            return res.status(404).json({ message: 'Day not found in timetable' });
        }

        // Update the specific period (period is 1-indexed)
        const periodIndex = period - 1;

        if (periodIndex < 0 || periodIndex >= hourKeys.length) {
            console.log(`Invalid period index: ${periodIndex}`);
            return res.status(404).json({ message: 'Period not found' });
        }

        // Get the hour key
        const hourKey = hourKeys[periodIndex];

        // Normalize subject
        const normalizedSubject = typeof subject === 'object' ? subject?._id : subject;

        console.log('Updating hour:', { 
            hourKey, 
            subject: normalizedSubject, 
            classId,
            facultyId 
        });

        // Update the period
        dayTimetable[hourKey] = {
            subject: normalizedSubject || null,
            class: classId || null,
            faculty: facultyId || null
        };

        // Save the updated timetable
        const savedTimetable = await facultyTimetable.save();

        console.log('Timetable saved successfully', {
            day: day,
            hourKey: hourKey,
            updatedPeriod: dayTimetable[hourKey]
        });

        res.status(200).json({ 
            message: 'Period updated successfully', 
            updatedPeriod: dayTimetable[hourKey] 
        });
    } catch (error) {
        console.error('Error updating faculty timetable period:', error);
        res.status(500).json({ message: error.message });
    }
});

// Check faculty availability for a specific day and period
router.get('/check-availability', isAuthenticated, async (req, res) => {
  try {
    const { facultyId, day, period, currentClassId } = req.query;
    
    console.log('Received availability check request:', { facultyId, day, period, currentClassId });
    
    // Validate input
    if (!facultyId || !day || !period) {
      console.log('Invalid input: Missing required parameters');
      return res.status(400).json({ message: 'Faculty ID, day, and period are required' });
    }
    
    // Find faculty timetable
    const facultyTimetable = await FacultyTimetable.findOne({ faculty: facultyId });
    
    if (!facultyTimetable) {
      // No timetable found, faculty is available
      console.log('No timetable found for faculty, they are available');
      return res.status(200).json({ available: true });
    }
    
    // Find the day in the timetable
    const daySchedule = facultyTimetable.timetable.find(d => d.day === day);
    
    if (!daySchedule) {
      // No schedule for this day, faculty is available
      console.log('No schedule found for this day, faculty is available');
      return res.status(200).json({ available: true });
    }
    
    // Get the hour name from the period number (1-indexed)
    const hourKeys = [
      'firstHour', 'secondHour', 'thirdHour', 'fourthHour', 
      'fifthHour', 'sixthHour', 'seventhHour'
    ];
    
    const hourKey = hourKeys[parseInt(period) - 1];
    
    if (!hourKey) {
      console.log('Invalid period:', period);
      return res.status(400).json({ message: 'Invalid period. Must be between 1 and 7.' });
    }
    
    const hourData = daySchedule[hourKey];
    
    // If there's a class assigned for this hour, faculty is not available
    // But if the class is the same as currentClassId, that's not a conflict
    if (hourData && hourData.class) {
      const hourClassId = hourData.class.toString();
      const currentClass = currentClassId ? currentClassId.toString() : null;
      
      // Skip conflict detection if we're checking for the same class
      if (currentClass && hourClassId === currentClass) {
        console.log('Faculty is assigned to the same class, not a conflict');
        return res.status(200).json({ available: true });
      }
      
      console.log('Faculty is already assigned for this period:', hourData);
      
      // Get class details for better response
      const classInfo = await Classes.findById(hourData.class)
        .populate('department', 'name'); // Populate department to get the name
      
      console.log('Class info for conflict:', classInfo);
      
      // Get subject details to provide acronym
      let subjectInfo = null;
      let subjectAcronym = '';
      
      if (hourData.subject) {
        try {
          // Try to find subject by code
          subjectInfo = await Subject.findOne({ subjectCode: hourData.subject });
          
          if (subjectInfo && subjectInfo.subjectName) {
            // Create acronym from subject name
            subjectAcronym = subjectInfo.subjectName
              .split(' ')
              .map(word => word.charAt(0).toUpperCase())
              .join('');
          }
        } catch (err) {
          console.error('Error getting subject details:', err);
        }
      }
      
      // Format response with conflict details
      return res.status(200).json({
        available: false,
        conflict: {
          className: classInfo ? (classInfo.className || classInfo.department?.name || 'Unknown') : 'Unknown',
          year: classInfo ? classInfo.year || '' : '',
          section: classInfo ? classInfo.section || '' : '',
          subject: hourData.subject || 'Unknown subject',
          subjectAcronym: subjectAcronym || hourData.subject || 'Unknown',
          day: day,
          period: period,
          hourKey: hourKey
        }
      });
    }
    
    // No conflict found, faculty is available
    console.log('Faculty is available for this period');
    return res.status(200).json({ available: true });
  } catch (error) {
    console.error('Error checking faculty availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update or create faculty timetable entry
router.post('/update-entry', isAuthenticated, async (req, res) => {
  try {
    const { facultyId, day, period, classId, subject, action } = req.body;
    
    if (!facultyId || !day || !period) {
      return res.status(400).json({ message: 'Faculty ID, day, and period are required' });
    }
    
    let timetable = await FacultyTimetable.findOne({ faculty: facultyId });
    
    // If no timetable exists for this faculty, create one
    if (!timetable && action !== 'remove') {
      timetable = new FacultyTimetable({
        faculty: facultyId,
        timetable: [
          {
            day,
            periods: []
          }
        ]
      });
    } else if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this faculty' });
    }
    
    // Find the day entry or create it
    let dayEntry = timetable.timetable.find(t => t.day === day);
    
    if (!dayEntry && action !== 'remove') {
      dayEntry = { day, periods: [] };
      timetable.timetable.push(dayEntry);
    } else if (!dayEntry) {
      return res.json({ message: 'No entry found for this day' });
    }
    
    if (action === 'add') {
      // Check if period already exists
      const periodIndex = dayEntry.periods.findIndex(p => p.period === parseInt(period));
      
      if (periodIndex >= 0) {
        // Update existing period
        dayEntry.periods[periodIndex] = {
          period: parseInt(period),
          class: classId,
          subject
        };
      } else {
        // Add new period
        dayEntry.periods.push({
          period: parseInt(period),
          class: classId,
          subject
        });
      }
    } else if (action === 'remove') {
      // Remove period entry
      if (dayEntry) {
        dayEntry.periods = dayEntry.periods.filter(p => p.period !== parseInt(period));
      }
    }
    
    await timetable.save();
    res.json({ message: 'Faculty timetable updated successfully', timetable });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get faculty timetable by faculty ID
router.get('/:facultyId', isAuthenticated, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Validate faculty ID
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ message: 'Invalid faculty ID' });
    }

    // Find the faculty timetable and populate class and subject details
    const facultyTimetable = await FacultyTimetable.findOne({ faculty: facultyId })
      .populate({
        path: 'timetable.firstHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.secondHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.thirdHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.fourthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.fifthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.sixthHour.class',
        populate: { path: 'department', select: 'name' }
      })
      .populate({
        path: 'timetable.seventhHour.class',
        populate: { path: 'department', select: 'name' }
      });

    // If no timetable found, return empty timetable
    if (!facultyTimetable) {
      return res.status(200).json({ 
        message: 'No timetable found for this faculty',
        timetable: [] 
      });
    }

    // Return the populated timetable
    res.status(200).json({
      message: 'Faculty timetable retrieved successfully',
      timetable: facultyTimetable.timetable
    });

  } catch (error) {
    console.error('Error retrieving faculty timetable:', error);
    res.status(500).json({ 
      message: 'Error retrieving faculty timetable', 
      error: error.message 
    });
  }
});

module.exports = router;
