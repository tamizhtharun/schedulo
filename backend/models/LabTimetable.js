const mongoose = require('mongoose');

const labTimetableSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    unique: true
  },
  timetable: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      required: true
    },
    firstHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject', 
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    secondHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    thirdHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    fourthHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    fifthHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    sixthHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    },
    seventhHour: { 
      subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject',
        default: null 
      },
      class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Classes', 
        default: null 
      }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('LabTimetable', labTimetableSchema);
