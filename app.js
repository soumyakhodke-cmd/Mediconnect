require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const serverless = require('serverless-http');
const ejs = require('ejs'); // Force Netlify to bundle EJS

const app = express();

// Connect to MongoDB robustly for serverless functions
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000 // fail fast instead of buffering for 10s
      });
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }
  next();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// JWT Middleware
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'supersecret_jwt_key_please_change');
      req.user = decoded;
      req.doctor = decoded.role === 'doctor' ? decoded : null;
      res.locals.user = req.user;
      res.locals.doctor = req.doctor;
    } catch (err) {
      req.user = null;
      req.doctor = null;
      res.locals.user = null;
      res.locals.doctor = null;
    }
  } else {
    req.user = null;
    req.doctor = null;
    res.locals.user = null;
    res.locals.doctor = null;
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/',            require('./routes/index'));
app.use('/auth',        require('./routes/auth'));
app.use('/appointments',require('./routes/appointments'));
app.use('/doctor',      require('./routes/doctor'));

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(3000, () => {
    console.log('\n✅  MediConnect is running!');
    console.log('👉  Open http://localhost:3000 in your browser\n');
    console.log('🩺  Doctor portal: http://localhost:3000/doctor/login\n');
  });
}

module.exports = app;
module.exports.handler = serverless(app);
