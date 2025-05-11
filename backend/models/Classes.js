const mongoose = require('mongoose');

// Assuming the User model is called 'User' and has an ObjectId for each user.
const classesSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    classVenue: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,  // Store the ObjectId of the Department
        ref: 'Department',  // Reference to the 'Department' model
        required: true
    },
    classAdvisor: {
        type: mongoose.Schema.Types.ObjectId,  // Store the ObjectId of the User (class advisor)
        ref: 'User',  // Reference to the 'User' model (class advisor)
        required: true
    },
    subjects: [{
        type: String,  // Store the subject codes as strings
        required: true
    }],
    // Subject-to-Faculty assignments with primary and optional secondary
    subjectFaculties: [{
      subjectCode: {
        type: String,
        required: true
      },
      primaryFaculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // made optional to allow null values
      },
      secondaryFaculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
});

module.exports = mongoose.model('Classes', classesSchema);
