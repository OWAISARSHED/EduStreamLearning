const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"EduStream" <noreply@edustream.app>',
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] To: ${to}, Subject: ${subject}`);
  } catch (error) {
    console.error('[Email Error]', error.message);
  }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: 'Password Reset - EduStream',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7030e0;">EduStream Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7030e0; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendNotificationEmail = async (email, subject, message, ctaLabel, ctaUrl) => {
  await sendEmail({
    to: email,
    subject: `EduStream - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7030e0;">${subject}</h2>
        <p>${message}</p>
        ${ctaLabel && ctaUrl ? `<a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; background: #7030e0; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">${ctaLabel}</a>` : ''}
        <p style="color: #666; font-size: 12px;">This is an automated notification from EduStream.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendNotificationEmail };
