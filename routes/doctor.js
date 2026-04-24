const express = require('express');
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const jwt     = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mediconnect_reports',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png']
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

function getDoctors() {
  const file = path.join(__dirname, '..', 'data', 'doctors.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function requireDoctor(req, res, next) {
  if (!req.doctor) return res.redirect('/doctor/login');
  next();
}

router.get('/login', (req, res) => {
  if (req.doctor) return res.redirect('/doctor/dashboard');
  res.render('doctor/login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const doctors = getDoctors();
  const doctor  = doctors.find(d => d.email === email && d.password === password);

  if (!doctor) {
    return res.render('doctor/login', { error: 'Invalid doctor credentials.' });
  }

  const token = jwt.sign({ id: doctor.id, role: 'doctor', name: doctor.name, email: doctor.email, specialty: doctor.specialty }, process.env.SESSION_SECRET || 'supersecret_jwt_key_please_change');
  // Set cookie for doctors
  res.cookie('token', token, { httpOnly: true, path: '/' });
  res.redirect('/doctor/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.redirect('/doctor/login');
});

router.get('/dashboard', requireDoctor, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.doctor.id }).sort({ bookedAt: -1 });
    const apptsWithId = appointments.map(a => ({...a.toObject(), id: a._id.toString()}));
    res.render('doctor/dashboard', { doctor: req.doctor, appointments: apptsWithId });
  } catch (err) {
    console.error(err);
    res.render('doctor/dashboard', { doctor: req.doctor, appointments: [] });
  }
});

router.post('/appointment/:id/status', requireDoctor, async (req, res) => {
  const { status } = req.body;
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.doctor.id });
    if (appt) {
      appt.status = status; // Confirmed, Cancelled
      await appt.save();

      if (appt.patientEmail && ['Confirmed', 'Completed', 'Cancelled'].includes(status)) {
        await sendEmail(
          appt.patientEmail,
          `Appointment ${status}`,
          `Hello ${appt.patientName},\n\nYour appointment with ${req.doctor.name} on ${appt.date} at ${appt.time} has been ${status}.\n\nRegards,\nMediConnect System`
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
  res.redirect('/doctor/dashboard');
});

router.get('/appointment/:id/upload', requireDoctor, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.doctor.id });
    if (!appt) return res.redirect('/doctor/dashboard');
    res.render('doctor/upload-report', { doctor: req.doctor, appt: {...appt.toObject(), id: appt._id.toString()}, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.redirect('/doctor/dashboard');
  }
});

router.post('/appointment/:id/upload', requireDoctor, upload.single('report'), async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.doctor.id });
    if (!appt) return res.redirect('/doctor/dashboard');

    if (!req.file) {
      return res.render('doctor/upload-report', {
        doctor: req.doctor, appt: {...appt.toObject(), id: appt._id.toString()},
        error: 'Please select a file to upload.', success: null
      });
    }

    const report = new Report({
      appointmentId: appt._id.toString(),
      patientEmail: appt.patientEmail,
      patientName: appt.patientName,
      doctorId: req.doctor.id,
      doctorName: req.doctor.name,
      specialty: req.doctor.specialty,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: req.file.path, // Cloudinary uses req.file.path for the URL
      notes: req.body.notes || ''
    });
    await report.save();

    if (appt.patientEmail) {
      await sendEmail(
        appt.patientEmail,
        'New Medical Report Uploaded',
        `Hello ${appt.patientName},\n\nDr. ${req.doctor.name} has uploaded a medical report for your appointment on ${appt.date}.\n\nPlease log in to MediConnect to view and download your report.\n\nRegards,\nMediConnect System`
      );
    }

    res.render('doctor/upload-report', {
      doctor: req.doctor, appt: {...appt.toObject(), id: appt._id.toString()},
      error: null, success: 'Report uploaded successfully!'
    });
  } catch (err) {
    console.error(err);
    res.redirect('/doctor/dashboard');
  }
});

router.get('/reports', requireDoctor, async (req, res) => {
  try {
    const reports = await Report.find({ doctorId: req.doctor.id }).sort({ uploadedAt: -1 });
    const reportsWithId = reports.map(r => ({...r.toObject(), id: r._id.toString()}));
    res.render('doctor/reports', { doctor: req.doctor, reports: reportsWithId });
  } catch (err) {
    console.error(err);
    res.render('doctor/reports', { doctor: req.doctor, reports: [] });
  }
});

router.post('/report/delete/:id', requireDoctor, async (req, res) => {
  try {
    await Report.deleteOne({ _id: req.params.id, doctorId: req.doctor.id });
  } catch (err) {
    console.error(err);
  }
  res.redirect('/doctor/reports');
});

router.post('/appointment/delete/:id', requireDoctor, async (req, res) => {
  try {
    // Doctors can delete records that are cancelled or completed
    await Appointment.deleteOne({ 
      _id: req.params.id, 
      doctorId: req.doctor.id,
      status: { $in: ['Cancelled', 'Completed'] }
    });
  } catch (err) {
    console.error(err);
  }
  res.redirect('/doctor/dashboard');
});

router.get('/api/appointments/count', requireDoctor, async (req, res) => {
  try {
    const count = await Appointment.countDocuments({ doctorId: req.doctor.id });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.json({ count: 0 });
  }
});

module.exports = router;
