const express = require('express');
const mongoose = require('mongoose');
const ClassTimetable = require('../models/ClassTimetable');
const Classes = require('../models/Classes');
const FacultyTimetable = require('../models/FacultyTimetable');
const Subject = require('../models/Subject');
const { authorizeRoles } = require('../middleware/roleAuth');

const router = express.Router();

// Helper function to update faculty timetables
const updateFacultyTimetables = async (classId, timetable) => {
  try {
    if (!classId || !Array.isArray(timetable)) return;

    const hourKeys = [
      'firstHour',
      'secondHour',
      'thirdHour',
      'fourthHour',
      'fifthHour',
      'sixthHour',
      'seventhHour'
    ];

    console.log(`Starting faculty timetable update for class ${classId}`);

    // STEP 1: Clear previous occurrences of this class from ALL faculty timetables
    // This ensures that if a subject is removed from the class timetable, it's also removed from faculty timetables
    const matchQuery = {
      $or: hourKeys.map(hk => ({ [`timetable.${hk}.class`]: classId }))
    };

    console.log(`Finding faculty timetables with class ${classId}`);
    const prevTimetables = await FacultyTimetable.find(matchQuery);
    console.log(`Found ${prevTimetables.length} faculty timetables with class ${classId}`);

    for (const ft of prevTimetables) {
      let changed = false;
      ft.timetable.forEach(dayEntry => {
        hourKeys.forEach(hk => {
          if (dayEntry[hk] && dayEntry[hk].class && dayEntry[hk].class.toString() === classId.toString()) {
            console.log(`Clearing entry for faculty ${ft.faculty} on ${dayEntry.day} ${hk}`);
            dayEntry[hk] = { subject: null, class: null };
            changed = true;
          }
        });
      });
      if (changed) {
        console.log(`Saving updated timetable for faculty ${ft.faculty}`);
        await ft.save();
      }
    }

    // STEP 2: Apply new assignments from class timetable
    console.log(`Applying new assignments from class timetable`);
    for (const dayEntry of timetable) {
      const dayName = dayEntry.day;
      for (const hk of hourKeys) {
        const hour = dayEntry[hk];
          if (hour && hour.subject) {
            // Assign for primaryFaculty if present
            if (hour.primaryFaculty) {
              console.log(`Adding assignment for primary faculty ${hour.primaryFaculty} on ${dayName} ${hk}`);
              
              let ft = await FacultyTimetable.findOne({ faculty: hour.primaryFaculty });
              if (!ft) {
                console.log(`Creating new timetable for primary faculty ${hour.primaryFaculty}`);
                ft = new FacultyTimetable({
                  faculty: hour.primaryFaculty,
                  timetable: ['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d=>{
                    const obj={day:d};
                    hourKeys.forEach(h=>{obj[h]={ subject:null, class:null };});
                    return obj;
                  })
                });
              }
              const dayObj = ft.timetable.find(d => d.day === dayName);
              if (dayObj) {
                dayObj[hk] = { subject: hour.subject, class: classId };
                ft.markModified('timetable');
                await ft.save();
                console.log(`Updated timetable for primary faculty ${hour.primaryFaculty}`);
              }
            }
            // Assign for secondaryFaculty if present
            if (hour.secondaryFaculty) {
              console.log(`Adding assignment for secondary faculty ${hour.secondaryFaculty} on ${dayName} ${hk}`);
              
              let ft = await FacultyTimetable.findOne({ faculty: hour.secondaryFaculty });
              if (!ft) {
                console.log(`Creating new timetable for secondary faculty ${hour.secondaryFaculty}`);
                ft = new FacultyTimetable({
                  faculty: hour.secondaryFaculty,
                  timetable: ['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d=>{
                    const obj={day:d};
                    hourKeys.forEach(h=>{obj[h]={ subject:null, class:null };});
                    return obj;
                  })
                });
              }
              const dayObj = ft.timetable.find(d => d.day === dayName);
              if (dayObj) {
                dayObj[hk] = { subject: hour.subject, class: classId };
                ft.markModified('timetable');
                await ft.save();
                console.log(`Updated timetable for secondary faculty ${hour.secondaryFaculty}`);
              }
            }
          }
      }
    }
    
    console.log(`Completed faculty timetable update for class ${classId}`);
  } catch (error) {
    console.error('Error in updateFacultyTimetables', error);
  }
};

// Helper function to check faculty conflicts
const checkFacultyConflicts = async (facultyId, dayName, hourName, classId) => {
  try {
    // Skip if any required parameter is missing
    if (!facultyId || !dayName || !hourName || !classId) {
      console.log('Missing parameter in checkFacultyConflicts:', { facultyId, dayName, hourName, classId });
      return { hasConflict: false };
    }

    console.log('Checking faculty conflicts for:', { facultyId, dayName, hourName, classId });

    // Find existing faculty timetable
    const facultyTimetable = await FacultyTimetable.findOne({ faculty: facultyId });
    
    if (!facultyTimetable) {
      console.log('No faculty timetable found for:', facultyId);
      return { hasConflict: false };
    }

    // Find the specific day in the timetable
    const dayTimetable = facultyTimetable.timetable.find(d => d.day === dayName);
    if (!dayTimetable) {
      console.log('No day timetable found for:', dayName);
      return { hasConflict: false };
    }

    // Check if the faculty is already assigned to a different class for this hour
    const hourData = dayTimetable[hourName];
    
    console.log('Hour data found:', JSON.stringify(hourData, null, 2));
    
    // Make sure we have both class and class._id before comparing
    if (hourData && hourData.class) {
      // Convert to string if it's an ObjectId
      const hourClassId = typeof hourData.class === 'object' && hourData.class._id 
        ? hourData.class._id.toString() 
        : String(hourData.class);
      
      const currentClassId = String(classId);
      
      console.log('Comparing class IDs:', { hourClassId, currentClassId, isEqual: hourClassId === currentClassId });
      
      if (hourClassId && hourClassId !== currentClassId) {
        // There's a conflict - faculty is already assigned to a different class
        const conflictClass = await Classes.findById(hourClassId);
        const conflictClassSubject = hourData.subject;
        
        console.log('Conflict detected!', {
          conflictClass: conflictClass ? conflictClass.name : 'Unknown',
          conflictSubject: conflictClassSubject
        });
        
        return {
          hasConflict: true,
          conflictDetails: {
            day: dayName,
            hour: hourName,
            className: conflictClass ? `${conflictClass.year} ${conflictClass.department?.name || ''} ${conflictClass.section}` : 'Unknown class',
            subject: conflictClassSubject || 'Unknown subject',
            classId: hourClassId
          }
        };
      }
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking faculty conflicts:', error);
    return { hasConflict: false, error: error.message };
  }
};

// Get timetable for a class
router.get('/:classId', async (req, res) => {
  const { classId } = req.params;

  try {
    // Validate class ID
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: 'Invalid class ID format' });
    }

    // Find timetable with populated subject and faculty details
    const timetable = await ClassTimetable.findOne({ class: classId })
      .populate({
        path: 'timetable',
        populate: {
          path: 'firstHour.subject secondHour.subject thirdHour.subject fourthHour.subject fifthHour.subject sixthHour.subject seventhHour.subject',
          model: 'Subject'
        }
      })
      .populate({
        path: 'timetable',
        populate: {
          path: 'firstHour.faculty secondHour.faculty thirdHour.faculty fourthHour.faculty fifthHour.faculty sixthHour.faculty seventhHour.faculty',
          model: 'User'
        }
      });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found for this class' });
    }

    console.log('Timetable Found:', {
      classId,
      timetable: JSON.stringify(timetable, null, 2)
    });

    res.status(200).json(timetable);
  } catch (error) {
    console.error('Error fetching class timetable:', {
      error: error.message,
      stack: error.stack,
      classId
    });
    res.status(500).json({ error: error.message });
  }
});

// Create or update timetable for a class
router.post('/:classId', authorizeRoles('HOD', 'TTIncharge'), async (req, res) => {
  // Extensive logging for debugging
  const requestTimestamp = new Date().toISOString();
  console.log('Timetable Save Request:', {
    timestamp: requestTimestamp,
    params: req.params,
    body: JSON.stringify(req.body, null, 2),
    user: {
      id: req.session?.user?._id,
      department: req.session?.user?.department,
      role: req.session?.user?.role
    }
  });

  const { classId } = req.params;
  const { timetable } = req.body;

  // Validate input structure
  if (!timetable || !Array.isArray(timetable)) {
    console.error('Invalid timetable input', {
      timestamp: requestTimestamp,
      timetable,
      timetableType: typeof timetable
    });
    return res.status(400).json({
      error: 'Invalid timetable format',
      details: {
        message: 'Timetable must be an array',
        receivedType: typeof timetable
      }
    });
  }

  // Comprehensive input validation
  if (!classId) {
    console.error('Missing class ID');
    return res.status(400).json({ error: 'Missing class ID' });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    console.error('Invalid class ID', { classId });
    return res.status(400).json({ error: 'Invalid class ID format' });
  }

  try {
    // Find the class to ensure it exists
    const classDoc = await Classes.findById(classId);
    if (!classDoc) {
      console.error('Class not found', { classId });
      return res.status(404).json({ error: 'Class not found' });
    }

    // Track faculty conflicts for reporting
    const facultyConflicts = [];

    // Process the timetable to convert string subjects to ObjectIds
    const processedTimetable = await Promise.all(timetable.map(async (day) => {
      const hourNames = [
        'firstHour', 'secondHour', 'thirdHour', 'fourthHour',
        'fifthHour', 'sixthHour', 'seventhHour'
      ];
      
      const processedDay = { day: day.day };
      
      // Process each hour in the day
      for (const hourName of hourNames) {
        if (!day[hourName]) {
          processedDay[hourName] = { subject: null, faculty: null };
          continue;
        }
        
        const hour = day[hourName];
        processedDay[hourName] = { faculty: null }; // Default faculty to null
        
        // Handle subject - find or create as needed
        if (hour.subject) {
          // If it's already an ObjectId, use it directly
          if (mongoose.Types.ObjectId.isValid(hour.subject)) {
            processedDay[hourName].subject = hour.subject;
          } else {
            // Try to find the subject by name or code
            const subject = await Subject.findOne({
              $or: [
                { subjectName: hour.subject },
                { subjectCode: hour.subject }
              ]
            });
            
            if (subject) {
              // Found the subject, use its ID
              processedDay[hourName].subject = subject._id;
              console.log(`Found subject for ${hour.subject}:`, subject.subjectName);
            } else {
              // Subject not found, set to null
              processedDay[hourName].subject = null;
              console.log(`Subject not found: ${hour.subject}`);
            }
          }
        } else {
          processedDay[hourName].subject = null;
        }
        
        // Handle faculty if provided
        if (hour.primaryFaculty || hour.secondaryFaculty) {
          if (hour.primaryFaculty) {
            processedDay[hourName].primaryFaculty = hour.primaryFaculty;
            
            // Check for conflicts if both faculty and subject are assigned
            if (processedDay[hourName].subject && hour.primaryFaculty) {
              const conflict = await checkFacultyConflicts(
                hour.primaryFaculty, 
                day.day, 
                hourName, 
                classId
              );
              
              if (conflict.hasConflict) {
                // Get subject name for better reporting
                let subjectName = hour.subject;
                try {
                  const subjectDoc = await Subject.findById(processedDay[hourName].subject);
                  if (subjectDoc) {
                    subjectName = subjectDoc.subjectName || subjectDoc.subjectCode || hour.subject;
                  }
                } catch (err) {
                  console.error('Error getting subject details:', err);
                }
                
                // Store conflict for reporting in response
                facultyConflicts.push({
                  ...conflict.conflictDetails,
                  assignedSubject: subjectName,
                  assignedFaculty: hour.primaryFaculty,
                  conflictHour: hourName,
                  conflictDay: day.day
                });
                
                console.warn('Faculty conflict detected:', {
                  faculty: hour.primaryFaculty,
                  day: day.day,
                  hour: hourName,
                  conflict: conflict.conflictDetails
                });
              }
            }
          }
          if (hour.secondaryFaculty) {
            processedDay[hourName].secondaryFaculty = hour.secondaryFaculty;
            
            // Check for conflicts if both faculty and subject are assigned
            if (processedDay[hourName].subject && hour.secondaryFaculty) {
              const conflict = await checkFacultyConflicts(
                hour.secondaryFaculty, 
                day.day, 
                hourName, 
                classId
              );
              
              if (conflict.hasConflict) {
                // Get subject name for better reporting
                let subjectName = hour.subject;
                try {
                  const subjectDoc = await Subject.findById(processedDay[hourName].subject);
                  if (subjectDoc) {
                    subjectName = subjectDoc.subjectName || subjectDoc.subjectCode || hour.subject;
                  }
                } catch (err) {
                  console.error('Error getting subject details:', err);
                }
                
                // Store conflict for reporting in response
                facultyConflicts.push({
                  ...conflict.conflictDetails,
                  assignedSubject: subjectName,
                  assignedFaculty: hour.secondaryFaculty,
                  conflictHour: hourName,
                  conflictDay: day.day
                });
                
                console.warn('Faculty conflict detected:', {
                  faculty: hour.secondaryFaculty,
                  day: day.day,
                  hour: hourName,
                  conflict: conflict.conflictDetails
                });
              }
            }
          }
        } else if (hour.subject) {
          // Try to find faculty from class's subjectFaculties
          try {
            const subject = await Subject.findById(processedDay[hourName].subject);
            if (subject && subject.subjectCode) {
              const facultyAssignment = classDoc.subjectFaculties?.find(sf => 
                sf.subjectCode === subject.subjectCode
              );
              
              if (facultyAssignment && facultyAssignment.primaryFaculty) {
                processedDay[hourName].primaryFaculty = facultyAssignment.primaryFaculty;
                console.log(`Auto-assigned primary faculty ${facultyAssignment.primaryFaculty} for subject ${subject.subjectCode}`);
                
                // Check for conflicts with auto-assigned faculty
                const conflict = await checkFacultyConflicts(
                  facultyAssignment.primaryFaculty,
                  day.day,
                  hourName,
                  classId
                );
                
                if (conflict.hasConflict) {
                  // Store conflict for reporting in response
                  facultyConflicts.push({
                    ...conflict.conflictDetails,
                    assignedSubject: subject.subjectName || subject.subjectCode,
                    assignedFaculty: facultyAssignment.primaryFaculty,
                    conflictHour: hourName,
                    conflictDay: day.day,
                    autoAssigned: true
                  });
                  
                  console.warn('Faculty conflict detected with auto-assigned primary faculty:', {
                    faculty: facultyAssignment.primaryFaculty,
                    day: day.day,
                    hour: hourName,
                    conflict: conflict.conflictDetails
                  });
                }
              }
              if (facultyAssignment && facultyAssignment.secondaryFaculty) {
                processedDay[hourName].secondaryFaculty = facultyAssignment.secondaryFaculty;
                console.log(`Auto-assigned secondary faculty ${facultyAssignment.secondaryFaculty} for subject ${subject.subjectCode}`);
                
                // Check for conflicts with auto-assigned secondary faculty
                const conflict = await checkFacultyConflicts(
                  facultyAssignment.secondaryFaculty,
                  day.day,
                  hourName,
                  classId
                );
                
                if (conflict.hasConflict) {
                  // Store conflict for reporting in response
                  facultyConflicts.push({
                    ...conflict.conflictDetails,
                    assignedSubject: subject.subjectName || subject.subjectCode,
                    assignedFaculty: facultyAssignment.secondaryFaculty,
                    conflictHour: hourName,
                    conflictDay: day.day,
                    autoAssigned: true
                  });
                  
                  console.warn('Faculty conflict detected with auto-assigned secondary faculty:', {
                    faculty: facultyAssignment.secondaryFaculty,
                    day: day.day,
                    hour: hourName,
                    conflict: conflict.conflictDetails
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Error finding faculty for subject: ${err.message}`);
          }
        }
      }
      
      return processedDay;
    }));
    
    console.log('Processed timetable:', {
      original: JSON.stringify(timetable, null, 2),
      processed: JSON.stringify(processedTimetable, null, 2)
    });

    // Directly use the timetable data as received from frontend
    // The schema validation will ensure the structure is correct
    const updated = await ClassTimetable.findOneAndUpdate(
      { class: classId },
      { timetable: processedTimetable }, // Use the processed timetable
      { 
        new: true, 
        upsert: true,
        runValidators: true // Ensure schema validation
      }
    );

    // Log successful save
    console.log('Timetable Saved Successfully', {
      classId,
      timetableLength: timetable.length,
      facultyConflictsCount: facultyConflicts.length,
      savedTimetable: JSON.stringify(updated, null, 2)
    });

    // Send success response
    res.status(200).json({ 
      message: 'Timetable saved successfully',
      timetable: updated,
      facultyConflicts
    });
    
    // After sending response, update faculty timetables asynchronously
    try {
      console.log('Starting faculty timetable update process after class timetable save');
      await updateFacultyTimetables(classId, processedTimetable);
      console.log('Faculty timetable update process completed successfully');
    } catch (error) {
      console.error('Error updating faculty timetables:', {
        error: error.message,
        stack: error.stack,
        classId
      });
    }
  } catch (error) {
    // Detailed error logging
    console.error('Unhandled Save Timetable Error', {
      timestamp: requestTimestamp,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      classId,
      timetable: JSON.stringify(timetable, null, 2),
      sessionUser: {
        id: req.session?.user?._id,
        department: req.session?.user?.department,
        role: req.session?.user?.role
      }
    });

    // Send error response
    res.status(500).json({ 
      error: 'Failed to save timetable',
      details: {
        message: error.message,
        classId,
        errorType: error.name
      }
    });
  }
});

module.exports = router;
