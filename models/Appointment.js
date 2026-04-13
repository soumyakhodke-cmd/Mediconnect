const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientEmail: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String },
  hospital: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'pending', 'confirmed', 'cancelled'], default: 'Pending' },
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
