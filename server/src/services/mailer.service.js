// server/src/services/mailer.service.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Device Tracker <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[mailer] Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err) {
    console.error('[mailer] Unexpected error sending email:', err.message);
    throw err;
  }
}

export async function sendVerificationEmail(to, verifyUrl) {
  return sendEmail({
    to,
    subject: 'Verify your Device Tracker account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your account. This link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;">
          Verify Email
        </a>
        <p style="margin-top:16px;color:#666;font-size:13px;">If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your Device Tracker password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#666;font-size:13px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}