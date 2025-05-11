const express = require('express');
const router = express.Router();
const Lab = require('../models/Lab');

// GET /labs - Get all labs
router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find();
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /labs - Add a new lab
router.post('/', async (req, res) => {
  const { labName, labNumber, department } = req.body;
  if (!labName || !labNumber || !department) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const newLab = new Lab({ labName, labNumber, department });
    const savedLab = await newLab.save();
    res.status(201).json(savedLab);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /labs/:id - Update a lab
router.put('/:id', async (req, res) => {
  const { labName, labNumber, department } = req.body;
  try {
    const updatedLab = await Lab.findByIdAndUpdate(
      req.params.id,
      { labName, labNumber, department },
      { new: true, runValidators: true }
    );
    if (!updatedLab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json(updatedLab);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /labs/:id - Delete a lab
router.delete('/:id', async (req, res) => {
  try {
    const deletedLab = await Lab.findByIdAndDelete(req.params.id);
    if (!deletedLab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json({ message: 'Lab deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /labs/bulk - Bulk add labs
router.post('/bulk', async (req, res) => {
  const labs = req.body;
  if (!Array.isArray(labs) || labs.length === 0) {
    return res.status(400).json({ message: 'Invalid labs data' });
  }
  try {
    const insertedLabs = await Lab.insertMany(labs);
    res.status(201).json(insertedLabs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
