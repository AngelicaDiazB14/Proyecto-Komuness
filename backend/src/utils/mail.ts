// src/utils/mail.ts
import { createTransport } from 'nodemailer';

const transporter = createTransport({
  service: 'zoho',
  host: 'smtp.zoho.com',
  port: 2525,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.MAIL_USER || 'komuness334@zohomail.com',
    to,
    subject,
    text, // mantengo texto plano; si quieres HTML, cambia a 'html'
  };
  await transporter.sendMail(mailOptions);
};