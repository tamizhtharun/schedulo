const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  labName: {
    type: String,
    required: true,
    trim: true
  },
  labNumber: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const Lab = mongoose.model('Lab', labSchema);

module.exports = Lab;
