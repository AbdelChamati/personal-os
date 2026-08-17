import { getDatabase } from '../database.js';

export function scheduleReminder(taskId, minutesBeforeDue) {
  const db = getDatabase();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  
  if (!task || !task.due_at) return null;
  
  const dueDate = new Date(task.due_at);
  const scheduledDate = new Date(dueDate.getTime() - minutesBeforeDue * 60 * 1000);
  
  const reminder = {
    id: crypto.randomUUID(),
    task_id: taskId,
    scheduled_at: scheduledDate.toISOString(),
    sent_at: null,
    channel: 'in-app',
    status: 'pending',
  };
  
  db.prepare(`
    INSERT INTO reminders (id, task_id, scheduled_at, sent_at, channel, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reminder.id, reminder.task_id, reminder.scheduled_at, reminder.sent_at, reminder.channel, reminder.status);
  
  return reminder;
}

export function checkAndSendReminders() {
  const db = getDatabase();
  const now = new Date();
  
  const pendingReminders = db.prepare(`
    SELECT * FROM reminders
    WHERE status = 'pending'
      AND scheduled_at <= ?
  `).all(now.toISOString());
  
  for (const reminder of pendingReminders) {
    // Mark as sent
    db.prepare(`
      UPDATE reminders
      SET status = 'sent', sent_at = ?
      WHERE id = ?
    `).run(now.toISOString(), reminder.id);
  }
  
  return pendingReminders;
}