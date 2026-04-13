const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  appointmentId: { type: String },
  patientEmail: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String },
  filename: { type: String },
  originalName: { type: String },
  fileUrl: { type: String, required: true },
  notes: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
