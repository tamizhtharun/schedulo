const mongoose = require('mongoose');


const facultyTimetableSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }],
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  }
});

module.exports = mongoose.model('FacultyTimetable', facultyTimetableSchema);
