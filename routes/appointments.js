const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { sendEmail } = require('../utils/email');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');

// Doctors list (same as booking page)
const DOCTORS = [
  { id: 'doc-001', name: 'Dr. Anika Sharma',  specialty: 'Cardiology',    hospital: 'Apollo Hospital'  },
  { id: 'doc-002', name: 'Dr. Rohan Mehta',   specialty: 'Neurology',     hospital: 'Fortis Hospital'  },
  { id: 'doc-003', name: 'Dr. Priya Nair',    specialty: 'Pediatrics',    hospital: 'AIIMS'            },
  { id: 'doc-004', name: 'Dr. Suresh Patel',  specialty: 'Orthopedics',   hospital: 'Medanta'          },
  { id: 'doc-005', name: 'Dr. Kavitha Rao',   specialty: 'Dermatology',   hospital: 'Manipal Hospital' }
];

const router = express.Router();

function requirePatient(req, res, next) {
  if (!req.user || req.user.role !== 'patient') return res.redirect('/auth/login');
  next();
}

router.get('/book', requirePatient, (req, res) => {
  res.render('booking', { doctors: DOCTORS, success: null, error: null });
});

router.post('/book', requirePatient, async (req, res) => {
  const { doctorId, date, time, reason } = req.body;
  const doctor = DOCTORS.find(d => d.id === doctorId);

  if (!doctor) {
    return res.render('booking', { doctors: DOCTORS, success: null, error: 'Invalid doctor selected.' });
  }

  try {
    const appt = new Appointment({
      patientEmail: req.user.email,
      patientName: req.user.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      hospital: doctor.hospital,
      date,
      time,
      reason: reason || '',
      status: 'Pending'
    });
    await appt.save();

    const doctorsFile = path.join(__dirname, '..', 'data', 'doctors.json');
    try {
      const doctorsList = JSON.parse(fs.readFileSync(doctorsFile, 'utf8'));
      const docData = doctorsList.find(d => d.id === doctor.id);
      if (docData && docData.email) {
        sendEmail(
          docData.email,
          'New Appointment Booking',
          `Hello ${doctor.name},\n\nYou have a new appointment booked by patient ${req.user.name} on ${date} at ${time}.\nReason for visit: ${reason || 'Not specified'}\n\nPlease confirm or cancel it via your dashboard.\n\nRegards,\nMediConnect System`
        );
      }
    } catch (e) {
      console.error('Error reading doctors data for email:', e);
    }

    res.render('booking', {
      doctors: DOCTORS,
      success: `Appointment booked with ${doctor.name} on ${date} at ${time}.`,
      error:   null
    });
  } catch (err) {
    console.error(err);
    res.render('booking', { doctors: DOCTORS, success: null, error: 'Failed to book appointment' });
  }
});

router.post('/cancel/:id', requirePatient, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, patientEmail: req.user.email });
    if (appt && appt.status.toLowerCase() === 'pending') {
      appt.status = 'Cancelled';
      await appt.save();
    }
  } catch (err) {
    console.error(err);
  }
  res.redirect('/appointments/my');
});

router.get('/my', requirePatient, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientEmail: req.user.email }).sort({ bookedAt: -1 });
    const reports = await Report.find({ patientEmail: req.user.email }).sort({ uploadedAt: -1 });
    // Pass as lean obj or simply use in EJS (EJS will use them just fine)
    // Make sure id maps to _id for older templates
    const apptsWithId = appointments.map(a => ({...a.toObject(), id: a._id.toString()}));
    const reportsWithId = reports.map(r => ({...r.toObject(), id: r._id.toString()}));
    
    res.render('my-appointments', { appointments: apptsWithId, reports: reportsWithId });
  } catch (err) {
    console.error(err);
    res.render('my-appointments', { appointments: [], reports: [] });
  }
});

module.exports = router;
