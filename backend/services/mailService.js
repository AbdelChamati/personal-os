import nodemailer from 'nodemailer';

function getMailConfig() {
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = nodemailer.createTransport(getMailConfig());
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your Personal OS password',
    text: `Hi ${name || 'there'},\n\nReset your Personal OS password by opening this link within 30 minutes:\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Hi ${name || 'there'},</p><p>Reset your Personal OS password by opening this link within 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

export async function sendReminderEmail({ to, name, task, scheduledAt }) {
  const transporter = nodemailer.createTransport(getMailConfig());
  const dueText = task.due_at ? new Date(task.due_at).toLocaleString() : 'No due date';
  const scheduledText = new Date(scheduledAt).toLocaleString();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Reminder: ${task.title}`,
    text: `Hi ${name || 'there'},\n\nReminder for: ${task.title}\nDue: ${dueText}\nScheduled reminder: ${scheduledText}${task.description ? `\n\n${task.description}` : ''}`,
    html: `<p>Hi ${name || 'there'},</p><p><strong>Reminder:</strong> ${task.title}</p><p><strong>Due:</strong> ${dueText}</p><p><strong>Scheduled reminder:</strong> ${scheduledText}</p>${task.description ? `<p>${task.description}</p>` : ''}`,
  });
}