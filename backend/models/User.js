const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: [String],
    required: true,
    enum: ['Admin', 'HOD', 'TTIncharge', 'ClassAdvisor', 'Faculty'], // Valid roles
    default: ['Faculty']
  },
  facultyId: {
    type: String,
    required: function () {
      return !this.role.includes('Admin'); // Required for non-Admin roles
    },
  },
  contact: {
    type: String,
    required: function () {
      return this.role !== 'Admin'; // Required for non-Admin roles
    },
    match: /^[0-9]{10}$/, // Validate 10-digit contact number
  },
  email: {
    type: String,
    required: function () {
      return this.role !== 'Admin'; // Required for non-Admin roles
    },
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Validate email format
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  }
});

module.exports = mongoose.model('User', userSchema);