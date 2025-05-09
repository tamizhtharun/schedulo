const mongoose = require('mongoose');

const subjectWillingnessSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes',
    required: true
  },
  subjectCode: {
    type: String,
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  willing: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

subjectWillingnessSchema.index({ classId: 1, subjectCode: 1, facultyId: 1 }, { unique: true });

module.exports = mongoose.model('SubjectWillingness', subjectWillingnessSchema);
