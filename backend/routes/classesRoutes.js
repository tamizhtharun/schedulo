const express = require('express');
const mongoose = require('mongoose');
const Classes = require('../models/Classes');
const User = require('../models/User');
const FacultyTimetable = require('../models/FacultyTimetable');
const SubjectWillingness = require('../models/SubjectWillingness');

const { authorizeRoles } = require('../middleware/roleAuth');
const router = express.Router();

// Add a new class
router.post('/add', authorizeRoles('HOD'), async (req, res) => {
  try {
    // Always use department from session
    const department = req.session.user.department;
    const newClass = new Classes({ ...req.body, department });
    await newClass.save();
    res.status(201).json({ message: 'Class added successfully', class: newClass });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all classes for Admin
router.get('/all', authorizeRoles('Admin'), async (req, res) => {
  try {
    const classes = await Classes.find();
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all classes for this department (HOD only)
router.get('/', authorizeRoles('HOD', 'TTIncharge', 'ClassAdvisor'), async (req, res) => {
  try {
    const department = req.session.user.department;
    const classes = await Classes.find({ department }).populate('classAdvisor');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a class (only if it belongs to this department)
router.put('/:id', authorizeRoles('HOD', 'TTIncharge'), async (req, res) => {
  const { id } = req.params;
  
  // Log full request details for debugging
  console.log('Full Class Update Request:', {
    params: req.params,
    body: req.body,
    session: req.session,
    headers: req.headers
  });

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error('Invalid Class ID', { id });
    return res.status(400).json({ 
      error: 'Invalid class ID',
      details: { id } 
    });
  }

  try {
    // Ensure session and user exist
    if (!req.session || !req.session.user) {
      console.error('No active session');
      return res.status(403).json({ 
        error: 'No active session', 
        details: 'User must be logged in to update class' 
      });
    }

    const department = req.session.user.department;
    const userRole = req.session.user.role;
    
    console.log('Update Class Request:', {
      id,
      department,
      userRole,
      body: req.body
    });
    
    // Only update if class is in this department
    const cls = await Classes.findOne({ _id: id, department });
    if (!cls) {
      console.error('Class not found in department', { id, department });
      return res.status(404).json({ 
        error: 'Class not found in your department', 
        details: { id, department, userRole } 
      });
    }
    
    // Prevent department change
    const updateData = { ...req.body };
    delete updateData.department;
    
    const updatedClass = await Classes.findByIdAndUpdate(id, updateData, { new: true });
    
    console.log('Class Updated Successfully:', updatedClass);
    
    res.status(200).json({ 
      message: 'Class updated successfully', 
      class: updatedClass 
    });
  } catch (error) {
    console.error('Class Update Error:', {
      error: error.message,
      stack: error.stack,
      id,
      department: req.session?.user?.department,
      userRole: req.session?.user?.role
    });
    res.status(400).json({ 
      error: error.message,
      details: {
        id,
        department: req.session?.user?.department,
        userRole: req.session?.user?.role
      }
    });
  }
});

// Delete a class (only if it belongs to this department)
router.delete('/:id', authorizeRoles('HOD'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  try {
    const department = req.session.user.department;
    const deletedClass = await Classes.findOneAndDelete({ _id: id, department });
    if (!deletedClass) {
      return res.status(404).json({ error: 'Class not found in your department' });
    }
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get class for logged-in class advisor
router.get('/my-class', authorizeRoles('ClassAdvisor'), async (req, res) => {
  console.log('Session user in /my-class:', req.session.user);
  try {
    const classAdvisorId = req.session.user.id;
    const myClass = await Classes.findOne({ classAdvisor: classAdvisorId });
    if (!myClass) {
      return res.status(404).json({ error: 'No class assigned to you' });
    }
    res.status(200).json(myClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subjects for a specific class (HOD or ClassAdvisor)
router.get('/:id/subjects', authorizeRoles('HOD', 'ClassAdvisor'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  try {
    const cls = await Classes.findById(id).select('subjects');
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json({ subjects: cls.subjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subjects for a specific class (HOD or ClassAdvisor)
router.put('/:id/subjects', authorizeRoles('HOD', 'ClassAdvisor'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  try {
    const updatedClass = await Classes.findByIdAndUpdate(id, { subjects: req.body.subjects }, { new: true });
    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json({ message: 'Subjects updated successfully', class: updatedClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subject-faculty assignments for a specific class
router.get('/:id/faculty-assignments', authorizeRoles('HOD', 'ClassAdvisor'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  try {
    const cls = await Classes.findById(id).select('subjectFaculties');
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json(cls.subjectFaculties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subject-faculty assignments for a specific class
router.put('/:id/faculty-assignments', authorizeRoles('HOD', 'ClassAdvisor'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  try {
    const assignments = req.body.subjectFaculties;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Invalid subjectFaculties format' });
    }
    const updatedClass = await Classes.findByIdAndUpdate(
      id,
      { subjectFaculties: assignments },
      { new: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json({
      message: 'Assignments updated successfully',
      subjectFaculties: updatedClass.subjectFaculties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all classes for a department (TTIncharge)
router.get('/department', authorizeRoles('HOD', 'TTIncharge'), async (req, res) => {
  try {
    const department = req.session.user.department;
    const classes = await Classes.find({ department })
      .populate('classAdvisor', 'username facultyId')
      .populate('department', 'name');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all classes with subjects and faculty assignments for a department (HOD, TTIncharge)
router.get('/department/classes-with-assignments', authorizeRoles('HOD', 'TTIncharge'), async (req, res) => {
  try {
    const department = req.session.user.department;
    console.log('Department in session:', department);
    const classes = await Classes.find({ department })
      .populate('classAdvisor', 'username facultyId')
      .populate('department', 'name')
      .populate({
        path: 'subjectFaculties.primaryFaculty',
        select: 'username facultyId'
      })
      .populate({
        path: 'subjectFaculties.secondaryFaculty',
        select: 'username facultyId'
      })
      .lean();

    console.log('Classes found:', classes.length);

    // Fetch all subjects in the department
    const Subject = require('../models/Subject');
    const subjects = await Subject.find({ department }).lean();

    // Map subjects by subjectCode for quick lookup
    const subjectMap = {};
    subjects.forEach(sub => {
      subjectMap[sub.subjectCode] = sub;
    });

    // Attach subjects details to each class based on class.subjects array
    classes.forEach(cls => {
      cls.subjectsDetails = cls.subjects.map(code => subjectMap[code]).filter(Boolean);
    });

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get faculty assignments with populated faculty details
router.get('/:id/faculty-assignments', authorizeRoles('HOD', 'ClassAdvisor', 'TTIncharge'), async (req, res) => {
  const { id } = req.params;
  console.log('Fetching faculty assignments for class:', id);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('Invalid class ID format');
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  
  try {
    const cls = await Classes.findById(id)
      .select('subjectFaculties')
      .populate('subjectFaculties.primaryFaculty', 'username facultyId _id')
      .populate('subjectFaculties.secondaryFaculty', 'username facultyId _id');
    
    if (!cls) {
      console.log('Class not found with ID:', id);
      return res.status(404).json({ error: 'Class not found' });
    }
    
    console.log('Found class with subject faculties:', cls.subjectFaculties);
    
    // Ensure each faculty object has a valid _id field
    const validatedFaculties = cls.subjectFaculties.map(assignment => {
      // Make sure primaryFaculty has an _id field
      if (assignment.primaryFaculty && !assignment.primaryFaculty._id) {
        console.log('Primary faculty missing _id:', assignment.primaryFaculty);
        // If it's a string, convert it to an object with _id
        if (typeof assignment.primaryFaculty === 'string') {
          assignment.primaryFaculty = { 
            _id: assignment.primaryFaculty,
            username: 'Unknown',
            facultyId: 'Unknown'
          };
        }
      }
      
      // Do the same for secondaryFaculty
      if (assignment.secondaryFaculty && !assignment.secondaryFaculty._id) {
        console.log('Secondary faculty missing _id:', assignment.secondaryFaculty);
        if (typeof assignment.secondaryFaculty === 'string') {
          assignment.secondaryFaculty = { 
            _id: assignment.secondaryFaculty,
            username: 'Unknown',
            facultyId: 'Unknown'
          };
        }
      }
      
      return assignment;
    });
    
    console.log('Sending validated faculty assignments:', validatedFaculties);
    res.status(200).json(validatedFaculties);
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update timetable for a class
router.put('/:id/timetable', authorizeRoles('HOD', 'TTIncharge'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  
  try {
    const { timetable } = req.body;
    
    if (!Array.isArray(timetable)) {
      return res.status(400).json({ error: 'Invalid timetable format' });
    }
    
    // First, find the class to make sure it exists and belongs to the user's department
    const cls = await Classes.findOne({ 
      _id: id, 
      department: req.session.user.department 
    });
    
    if (!cls) {
      return res.status(404).json({ error: 'Class not found in your department' });
    }
    
    // Update the class timetable
    const updatedClass = await Classes.findByIdAndUpdate(
      id,
      { timetable },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Timetable updated successfully',
      class: updatedClass
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
