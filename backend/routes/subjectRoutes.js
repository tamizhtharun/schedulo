const express = require('express');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Classes = require('../models/Classes');

const { authorizeRoles } = require('../middleware/roleAuth');
const router = express.Router();

// Bulk add subjects (department set from session, not client)
router.post('/bulk', authorizeRoles('HOD'), async (req, res) => {
  try {
    const department = req.user?.department || req.session?.user?.department;
    if (!department) return res.status(403).json({ error: 'No department found in session' });
    const subjects = req.body.subjects;
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'No subjects provided' });
    }
    // Add department to each subject
    const toInsert = subjects.map(sub => ({ ...sub, department }));
    const inserted = await Subject.insertMany(toInsert);
    res.status(201).json({ message: 'Bulk subject upload successful', inserted });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a new subject (department set from session, not client)
router.post('/add', authorizeRoles('HOD'), async (req, res) => {
  try {
    const department = req.user?.department || req.session?.user?.department;
    if (!department) return res.status(403).json({ error: 'No department found in session' });
    const subject = new Subject({ ...req.body, department });
    await subject.save();
    res.status(201).json({ message: 'Subject added successfully', subject });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all subjects for Admin, HOD, ClassAdvisor, or Faculty
router.get('/all', authorizeRoles('Admin','HOD','ClassAdvisor','Faculty'), async (req, res) => {
  try {
    // Populate department name for grouping
    const subjects = await Subject.find().populate('department', 'name');
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all subjects for the logged-in HOD's department, ClassAdvisor, TTIncharge, or Faculty
router.get('/', authorizeRoles('HOD', 'ClassAdvisor', 'TTIncharge', 'Faculty'), async (req, res) => {
  try {
    // Get department from session or user
    const department = req.user?.department || req.session?.user?.department;
    if (!department) return res.status(403).json({ error: 'No department found in session' });
    const subjects = await Subject.find({ department });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a subject (prevent department change)
router.put('/:id', authorizeRoles('HOD'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  try {
    // Remove department from update if present
    const update = { ...req.body };
    delete update.department;
    const subject = await Subject.findByIdAndUpdate(id, update, { new: true });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.status(200).json({ message: 'Subject updated successfully', subject });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a subject
router.delete('/:id', authorizeRoles('HOD'), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  try {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get subjects for a specific class
router.get('/class/:classId', authorizeRoles('HOD', 'ClassAdvisor', 'TTIncharge'), async (req, res) => {
  try {
    // Find the class first
    const classDoc = await Classes.findById(req.params.classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get all subjects selected by the class advisor (subject codes)
    const subjects = await Subject.find({ 
      subjectCode: { $in: classDoc.subjects }
    });

    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
