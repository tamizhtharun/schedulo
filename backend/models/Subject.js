const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true
  },
  acronym: {
    type: String,
    required: true
  },
  credit: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    required: true
  }
});

module.exports = mongoose.model('Subject', subjectSchema);
