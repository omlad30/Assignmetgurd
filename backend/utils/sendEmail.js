const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
      console.log('Skipping email send. Credentials not configured.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `AssignGuard <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = sendEmail;
