import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { isMailConfigured, sendReminderEmail } from './mailService.js';
import { sendReminderSms } from './smsService.js';

export function createReminder(userId, taskId, scheduledAt, channel = 'in-app') {
  const db = getDatabase();

  // Verify task belongs to user
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) {
    throw new Error('Task not found');
  }

  const reminderId = uuidv4();

  db.prepare(`
    INSERT INTO reminders (id, user_id, task_id, scheduled_at, sent_at, channel, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(reminderId, userId, taskId, scheduledAt, null, channel, 'pending');

  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(reminderId);
}

export function getPendingReminders() {
  const db = getDatabase();
  const now = new Date().toISOString();
  return db.prepare('SELECT * FROM reminders WHERE status = \'pending\' AND scheduled_at <= ?').all(now);
}

export function markReminderSent(reminderId) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare('UPDATE reminders SET status = \'sent\', sent_at = ?, error_message = NULL, attempts = attempts + 1 WHERE id = ?').run(now, reminderId);
}

function markReminderFailed(reminderId, error) {
  const db = getDatabase();
  db.prepare('UPDATE reminders SET status = \'failed\', error_message = ?, attempts = attempts + 1 WHERE id = ?').run(error.message, reminderId);
}

export async function sendReminder(reminder) {
  const db = getDatabase();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(reminder.task_id, reminder.user_id);
  const user = db.prepare('SELECT email, name, phone_number FROM users WHERE id = ?').get(reminder.user_id);

  if (!task || !user) {
    throw new Error('Reminder recipient or task not found');
  }

  if (reminder.channel === 'email') {
    if (!isMailConfigured()) throw new Error('Email delivery is not configured');
    await sendReminderEmail({ to: user.email, name: user.name, task, scheduledAt: reminder.scheduled_at });
  } else if (reminder.channel === 'sms') {
    await sendReminderSms({ to: user.phone_number, task });
  }

  markReminderSent(reminder.id);
}

export async function processDueReminders() {
  const reminders = getPendingReminders();
  for (const reminder of reminders) {
    try {
      await sendReminder(reminder);
    } catch (error) {
      console.error(`Reminder ${reminder.id} failed:`, error.message);
      markReminderFailed(reminder.id, error);
    }
  }
  return reminders.length;
}
