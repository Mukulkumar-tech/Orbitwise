import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

/**
 * Email adapter.
 *
 * `console` (default) prints the message and — crucially — the action link to
 * the terminal, so email verification and password reset are fully testable
 * locally with no SMTP account. `smtp` sends through Nodemailer.
 *
 * Callers never know which provider is active; they just call sendEmail().
 */

const consoleProvider = {
  name: 'console',
  async send({ to, subject, text }) {
    const link = /https?:\/\/\S+/.exec(text)?.[0];
    logger.banner(`Email → ${to}`, [subject, ...(link ? ['', 'Action link:', link] : [])]);
    return { delivered: true, provider: 'console' };
  },
};

let transporter = null;

const smtpProvider = {
  name: 'smtp',
  async send({ to, subject, text, html }) {
    if (!transporter) {
      const nodemailer = await import('nodemailer');
      transporter = nodemailer.default.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    }
    const info = await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
    return { delivered: true, provider: 'smtp', messageId: info.messageId };
  },
};

const providers = { console: consoleProvider, smtp: smtpProvider };

const resolveProvider = () => {
  const requested = providers[env.EMAIL_PROVIDER];
  if (requested === smtpProvider && !env.SMTP_HOST) {
    logger.warn('EMAIL_PROVIDER=smtp but SMTP_HOST is empty — falling back to the console provider.');
    return consoleProvider;
  }
  return requested ?? consoleProvider;
};

/**
 * Sends an email. Delivery failure never rejects: a user who cannot receive a
 * welcome email should still have a working account, and an SMTP outage should
 * not turn a successful registration into a 500.
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    return await resolveProvider().send({ to, subject, text, html });
  } catch (error) {
    logger.error(`Email delivery failed (${to} · "${subject}"):`, error.message);
    return { delivered: false, error: error.message };
  }
}

export default sendEmail;
