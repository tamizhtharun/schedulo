const express = require('express');
const mongoose = require('mongoose');
const SubjectWillingness = require('../models/SubjectWillingness');
const { authorizeRoles } = require('../middleware/roleAuth');
const router = express.Router();

// Get willingness for logged-in faculty for a class and subjectCode
router.get('/classes/:classId/willingness/me', authorizeRoles('Faculty'), async (req, res) => {
  const { classId } = req.params;
  const { subjectCode } = req.query;
  const facultyId = req.session.user.id;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  if (!subjectCode) {
    return res.status(400).json({ error: 'subjectCode query parameter is required' });
  }

  try {
    const willingness = await SubjectWillingness.findOne({ classId, subjectCode, facultyId });
    if (!willingness) {
      return res.status(404).json({ error: 'Willingness not found' });
    }
    res.status(200).json(willingness);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update willingness for logged-in faculty for a class and subjectCode
router.post('/classes/:classId/willingness', authorizeRoles('Faculty'), async (req, res) => {
  const { classId } = req.params;
  const { subjectCode, willing } = req.body;
  const facultyId = req.session.user.id;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }
  if (!subjectCode) {
    return res.status(400).json({ error: 'subjectCode is required' });
  }
  if (typeof willing !== 'boolean') {
    return res.status(400).json({ error: 'willing must be a boolean' });
  }

  try {
    const updated = await SubjectWillingness.findOneAndUpdate(
      { classId, subjectCode, facultyId },
      { willing },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/classes/:classId/willingness', authorizeRoles('HOD', 'TTIncharge', 'ClassAdvisor'), async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }

  try {
    const willingnessList = await SubjectWillingness.find({ classId });
    res.status(200).json(willingnessList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
