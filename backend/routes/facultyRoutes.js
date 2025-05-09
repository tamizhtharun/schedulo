const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all faculties (users with Faculty role and other teaching roles)
router.get('/', async (req, res) => {
  try {
    // Get the current user from the session
    const currentUser = req.user;
    
    // Build the query based on user's role
    const query = {
      role: { $in: ['Faculty', 'HOD', 'TTIncharge', 'ClassAdvisor'] }
    };

    // If user is not Admin, filter by their department
    if (!currentUser?.role?.includes('Admin')) {
      if (currentUser?.role?.includes('HOD') || currentUser?.role?.includes('TTIncharge')) {
        query.department = currentUser.department;
      } else {
        return res.status(403).json({ message: 'Unauthorized. Only Admin, HOD, and TTIncharge can view faculty timetables.' });
      }
    }
    
    // Find faculties with the query
    const faculties = await User.find(query)
      .populate('department', 'name') // Populate department information
      .select('-password'); // Exclude password field for security
    
    res.json(faculties);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({ message: 'Error fetching faculties', error: error.message });
  }
});

// Get a specific faculty by ID
router.get('/:id', async (req, res) => {
  try {
    const faculty = await User.findOne({ 
      _id: req.params.id,
      role: { $in: ['Faculty', 'HOD', 'TTIncharge', 'ClassAdvisor'] }
    })
    .populate('department', 'name')
    .select('-password');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Error fetching faculty', error: error.message });
  }
});

// Get all faculties without department filtering (accessible to all logged-in users)
router.get('/all-faculties', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(403).json({ message: 'Unauthorized. Please login.' });
    }
    const faculties = await User.find({
      role: { $in: ['Faculty', 'HOD', 'TTIncharge', 'ClassAdvisor'] }
    })
    .populate('department', 'name')
    .select('-password');
    res.json(faculties);
  } catch (error) {
    console.error('Error fetching all faculties:', error);
    res.status(500).json({ message: 'Error fetching all faculties', error: error.message });
  }
});

// Get all faculties without department filtering (accessible to all logged-in users)
router.get('/all-faculties', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(403).json({ message: 'Unauthorized. Please login.' });
    }
    const faculties = await User.find({
      role: { $in: ['Faculty', 'HOD', 'TTIncharge', 'ClassAdvisor'] }
    })
    .populate('department', 'name')
    .select('-password');
    res.json(faculties);
  } catch (error) {
    console.error('Error fetching all faculties:', error);
    res.status(500).json({ message: 'Error fetching all faculties', error: error.message });
  }
});

module.exports = router;
