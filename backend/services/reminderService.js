import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

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
  return db.prepare('SELECT * FROM reminders WHERE status = "pending" AND scheduled_at <= ?').all(now);
}

export function markReminderSent(reminderId) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare('UPDATE reminders SET status = "sent", sent_at = ? WHERE id = ?').run(now, reminderId);
}

export function sendReminder(reminder) {
  // In production, this would integrate with email, SMS, or push notification services
  // For now, just log
  console.log(`Reminder: Task due - Channel: ${reminder.channel}`);
  markReminderSent(reminder.id);
}
