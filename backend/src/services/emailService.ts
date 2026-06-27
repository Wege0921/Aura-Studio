import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@aurastudio.com';
const FROM_NAME = process.env.FROM_NAME || 'AURA Studio';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured. Emails will be logged to console.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;

  if (!mailer) {
    console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return;
  }

  await mailer.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
  });
}

export async function sendContactNotification({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await sendEmail({
    to: FROM_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
  });
}

export async function sendBookingConfirmation({
  to,
  userName,
  className,
  classDate,
  classTime,
}: {
  to: string;
  userName: string;
  className: string;
  classDate: string;
  classTime: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject: `Booking Confirmed — ${className}`,
    text: `Hi ${userName},\n\nYour booking for "${className}" on ${classDate} at ${classTime} is confirmed.\n\nSee you on the mat!\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your booking for <strong>${className}</strong> on ${classDate} at ${classTime} is confirmed.</p><p>See you on the mat!<br/>AURA Studio</p>`,
  });
}

export async function sendPaymentVerified({
  to,
  userName,
  amount,
}: {
  to: string;
  userName: string;
  amount: number;
}): Promise<void> {
  await sendEmail({
    to,
    subject: 'Payment Verified — AURA Studio',
    text: `Hi ${userName},\n\nYour payment of ETB ${amount.toLocaleString()} has been verified. Thank you!\n\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your payment of <strong>ETB ${amount.toLocaleString()}</strong> has been verified. Thank you!</p><p>AURA Studio</p>`,
  });
}

export async function sendPackageExpiryReminder({
  to,
  userName,
  packageName,
  daysLeft,
}: {
  to: string;
  userName: string;
  packageName: string;
  daysLeft: number;
}): Promise<void> {
  await sendEmail({
    to,
    subject: 'Package Expiry Reminder — AURA Studio',
    text: `Hi ${userName},\n\nYour ${packageName} package expires in ${daysLeft} day(s). Book your remaining sessions before it expires!\n\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your <strong>${packageName}</strong> package expires in <strong>${daysLeft} day(s)</strong>. Book your remaining sessions before it expires!</p><p>AURA Studio</p>`,
  });
}
