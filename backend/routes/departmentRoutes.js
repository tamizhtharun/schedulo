const express = require('express');
const Department = require('../models/Department');
const { authorizeRoles } = require('../middleware/roleAuth');
const router = express.Router();


// Create Department
router.post('/add', authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, description, acronym } = req.body;
    const department = new Department({ name, description, acronym });
    await department.save();
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Departments (Anyone can view)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Department
router.put('/:id', authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, description, acronym } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, acronym },
      { new: true }
    );
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Department 
router.delete('/:id', authorizeRoles('Admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
