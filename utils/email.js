const nodemailer = require('nodemailer');

let transporter;

async function initMailer() {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate chain errors
    },
  });
  console.log(`📧 Email service initialized for ${process.env.SMTP_USER}`);
}

initMailer().catch(console.error);

async function sendEmail(to, subject, text) {
  if (!transporter) {
    console.warn('Email transporter not ready yet.');
    return;
  }
  
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MediConnect" <noreply@mediconnect.com>',
      to: to,
      subject: subject,
      text: text,
      html: text.replace(/\n/g, '<br>')
    });

    console.log(`\n📩 EMAIL SENT to [${to}]`);
    console.log(`Subject: ${subject}`);
    // console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

module.exports = { sendEmail };
