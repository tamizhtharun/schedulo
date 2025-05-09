const mongoose = require('mongoose');

const classTimetableSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Classes', required: true, unique: true },
  timetable: [{
    day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    firstHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    secondHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    thirdHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    fourthHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    fifthHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    sixthHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    seventhHour: { 
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
      primaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      secondaryFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassTimetable', classTimetableSchema);