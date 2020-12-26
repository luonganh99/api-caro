const nodemailer = require('nodemailer');

// Verify Account
module.exports = async (email, subject, html) => {
  console.log(email);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'Gmail',
    port: 587,
    secure: false,
    auth: {
      user: 'luonganhnguyen99@gmail.com',
      pass: 'luonganh0599',
    },
  });

  try {
    let info = await transporter.sendMail({
      from: 'luonganhnguyen99@gmail.com',
      to: email,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.log(error);
  }
};
