import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';

const RECURRENCE_TYPES = ['daily', 'weekly', 'monthly'];

export function parseRecurrenceRule(rule) {
  if (!rule || !RECURRENCE_TYPES.includes(rule)) return null;
  return rule;
}

export function calculateNextOccurrence(task, completedAt) {
  if (!task.recurrence_rule) return null;
  
  const completed = new Date(completedAt);
  const next = new Date(completed);
  
  switch (task.recurrence_rule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      return null;
  }
  
  return next.toISOString();
}

export function createNextOccurrence(task) {
  if (!task.recurrence_rule || task.status !== 'completed') {
    return null;
  }
  
  const nextDueAt = calculateNextOccurrence(task, task.completed_at);
  if (!nextDueAt) return null;
  
  const db = getDatabase();
  const newTask = {
    id: uuidv4(),
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: 'pending',
    estimated_minutes: task.estimated_minutes,
    due_at: nextDueAt,
    expires_at: task.expires_at ? new Date(new Date(task.expires_at).getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    recurrence_rule: task.recurrence_rule,
    created_at: new Date().toISOString(),
    completed_at: null,
    escalation_level: 0,
  };
  
  db.prepare(`
    INSERT INTO tasks (id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newTask.id,
    newTask.title,
    newTask.description,
    newTask.category,
    newTask.priority,
    newTask.status,
    newTask.estimated_minutes,
    newTask.due_at,
    newTask.expires_at,
    newTask.recurrence_rule,
    newTask.created_at,
    newTask.completed_at,
    newTask.escalation_level
  );
  
  return newTask;
}