const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const { authorizeRoles } = require('../middleware/roleAuth');
const Department = require('../models/Department');
const router = express.Router();

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }
}

// Add a new user (Admin or HOD)
router.post('/add', isAuthenticated, authorizeRoles('Admin', 'HOD'), async (req, res) => {
  try {
    console.log('POST /add route matched');
    const { role } = req.body;

    // Validation for Admin and Faculty roles
    if (role === 'Admin' && (req.body.facultyId || req.body.contact || req.body.email)) {
      return res.status(400).json({ error: 'Admin should not have faculty-specific fields' });
    }
    if (role !== 'Admin' && (!req.body.facultyId || !req.body.contact || !req.body.email)) {
      return res.status(400).json({ error: 'Faculty-specific fields are required for non-Admin roles' });
    }

    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User added successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    console.log('Login attempt:', { facultyId, password });

    // Find user without department population first
    const user = await User.findOne({ facultyId, password });
    console.log('User found:', user);

    if (user) {
      // Create session
      req.session.user = {
        id: user._id,
        facultyId: user.facultyId,
        username: user.username,
        role: Array.isArray(user.role) ? user.role : [user.role],
        department: user.role.includes('Admin') 
          ? null // Admins don't need department
          : {
              _id: user.department._id.toString(),
              name: user.department.name
            }
      };

      // Prepare response
      const response = {
        success: true,
        message: "Login successful",
        role: req.session.user.role,
        username: req.session.user.username,
        facultyId: req.session.user.facultyId,
        _id: user._id, // include MongoDB ObjectId for frontend
        department: req.session.user.department // include department in response
      };

      // For non-admin users, populate department before sending response
      if (!user.role.includes('Admin')) {
        await user.populate('department', 'name');
        console.log('Populated department:', user.department);
      }

      res.json(response);
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Optional: clear session cookie
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Get all users (protected)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('GET / route matched');
    const { role, department } = req.session.user;
    let users;
    if (Array.isArray(role) ? role.includes('Admin') : role === 'Admin') {
      users = await User.find();
    } else if (Array.isArray(role) ? role.includes('HOD') : role === 'HOD') {
      users = await User.find({ department });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user by ID (protected)
router.get('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  // Validate if `id` is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    console.log(`GET /:id route matched with id: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user (protected)
router.put('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  // Validate if `id` is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    let update = { ...req.body };
    if (update.role) {
      // Ensure role is always an array
      if (!Array.isArray(update.role)) {
        update.role = [update.role];
      }
      // Remove duplicates and ensure only allowed roles
      update.role = Array.from(new Set(update.role)).filter(r =>
        ['Admin', 'HOD', 'TTIncharge', 'ClassAdvisor', 'Faculty'].includes(r)
      );
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a user (protected)
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  // Validate if `id` is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk add faculties (HOD only, department from session, role default 'Faculty')
router.post('/bulk', isAuthenticated, authorizeRoles('HOD'), async (req, res) => {
  try {
    const departmentSession = req.session.user.department;
    console.log('[BULK UPLOAD] department from session:', departmentSession);
    if (!departmentSession) return res.status(400).json({ error: 'No department in session' });

    // Find department by _id or name
    let departmentDoc = await Department.findOne({
      $or: [
        { _id: departmentSession },
        { name: departmentSession }
      ]
    });
    console.log('[BULK UPLOAD] departmentDoc found:', departmentDoc);
    if (!departmentDoc) return res.status(400).json({ error: 'Invalid department in session', debug: departmentSession });

    const faculties = req.body.faculties || [];
    if (!Array.isArray(faculties) || faculties.length === 0) {
      return res.status(400).json({ error: 'No faculty records provided' });
    }
    // Validate and prepare
    const toInsert = faculties.map(fac => ({
      username: fac.name,
      email: fac.email,
      facultyId: fac.facultyId,
      contact: fac.contact,
      department: departmentDoc._id,
      role: ['Faculty'],
      password: fac.facultyId // default password
    }));
    // Insert many
    const inserted = await User.insertMany(toInsert);
    res.status(201).json({ success: true, inserted });
  } catch (error) {
    console.error('[BULK UPLOAD ERROR]', error);
    res.status(400).json({ success: false, error: error.message, stack: error.stack });
  }
});

// Get departmental faculties for HOD or ClassAdvisor
router.get('/faculty', isAuthenticated, authorizeRoles('HOD', 'ClassAdvisor', 'Admin'), async (req, res) => {
  try {
    // Extensive logging for debugging
    console.log('Full Request Headers:', req.headers);
    console.log('Full Session Object:', req.session);

    // Try to get user info from session first
    const sessionUser = req.session.user;
    
    // If session user is not available, try to use custom headers
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    console.log('Session User:', sessionUser);
    console.log('User ID from Headers:', userId);
    console.log('User Role from Headers:', userRole);

    // Determine department and role
    const department = sessionUser?.department || null;
    const role = sessionUser?.role || userRole;

    console.log('Determined Department:', department);
    console.log('Determined Role:', role);

    // Fetch faculties based on role
    let faculties;
    if (role === 'Admin') {
      faculties = await User.find({ role: 'Faculty' });
      console.log('Fetched All Faculty Users');
    } else if (department) {
      faculties = await User.find({ department, role: 'Faculty' });
      console.log('Fetched Department Faculty Users');
    } else {
      console.error('Invalid user or insufficient permissions');
      return res.status(400).json({ 
        error: 'Invalid user or insufficient permissions',
        details: {
          sessionUser,
          userId,
          userRole,
          department,
          role
        }
      });
    }

    console.log('Faculty Count:', faculties.length);
    res.status(200).json(faculties);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Get departmental faculties for a specific department (HOD or ClassAdvisor)
router.get('/faculty/:deptId', isAuthenticated, authorizeRoles('HOD', 'ClassAdvisor'), async (req, res) => {
  const { deptId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(deptId)) {
    return res.status(400).json({ error: 'Invalid department ID' });
  }
  try {
    const faculties = await User.find({ department: deptId, role: 'Faculty' });
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch usernames for multiple user IDs
router.post('/usernames', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty user IDs' });
    }
    
    // Find users with the given IDs and create a map of ID to username
    const users = await User.find({ 
      _id: { $in: userIds } 
    }, '_id username');
    
    const usernamesMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});
    
    res.json(usernamesMap);
  } catch (error) {
    console.error('Error fetching usernames:', error);
    res.status(500).json({ error: 'Failed to fetch usernames' });
  }
});

module.exports = router;
