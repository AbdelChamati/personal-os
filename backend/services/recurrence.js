import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const RECURRENCE_PATTERNS = {
  daily: (date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  },
  weekly: (date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    return next;
  },
  biweekly: (date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 14);
    return next;
  },
  monthly: (date) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next;
  },
  yearly: (date) => {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  },
};

export function createNextOccurrence(task) {
  if (!task.recurrence_rule) return null;

  const pattern = RECURRENCE_PATTERNS[task.recurrence_rule];
  if (!pattern) return null;

  const db = getDatabase();
  const dueDate = task.due_at ? new Date(task.due_at) : new Date();
  const nextDueDate = pattern(dueDate);

  const newTaskId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newTaskId,
    task.user_id,
    task.title,
    task.description,
    task.category,
    task.priority,
    'pending',
    task.estimated_minutes,
    nextDueDate.toISOString(),
    task.expires_at,
    task.recurrence_rule,
    now,
    null,
    0
  );

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(newTaskId);
}

export function getRecurringTasks(userId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? AND recurrence_rule IS NOT NULL AND status = "pending"').all(userId);
}
