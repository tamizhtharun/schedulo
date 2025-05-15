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
const labTimetableRoutes = require('./routes/labTimetableRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(bodyParser.json());

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Middleware to set user object in request
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

// Basic route for health check
app.get('/', (req, res) => {
  res.send('API is running');
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
app.use('/api/lab-timetables', labTimetableRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));
