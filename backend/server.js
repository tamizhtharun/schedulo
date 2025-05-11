const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const subjectRoutes = require('./routes/subjectRoutes');
const classesRoutes = require('./routes/classesRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const facultyTimetableRoutes = require('./routes/facultyTimetableRoutes');
const classTimetableRoutes = require('./routes/classTimetableRoutes');
const labsRoutes = require('./routes/labsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true               // Allow cookies
}));

app.use(bodyParser.json());

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET, // Secret for signing session IDs
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, 
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,               // Prevent JS access to cookies
    secure: false                 // Set true if using HTTPS
  }
}));

// Middleware to set user object in request
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

  // Routes
  // Existing routes
  app.use('/api/users', userRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/faculty-timetables', facultyTimetableRoutes);
  app.use('/api/class-timetables', classTimetableRoutes);
  app.use('/api/labs', labsRoutes);
  const labTimetableRoutes = require('./routes/labTimetableRoutes');
  app.use('/api/lab-timetables', labTimetableRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(5000, '127.0.0.1', () => {
      console.log("Server is running on 127.0.0.1:5000");
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));
