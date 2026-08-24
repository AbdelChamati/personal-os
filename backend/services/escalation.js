import { getDatabase } from '../database.js';

const ESCALATION_RULES = [
  { hours: 24, level: 1, label: 'Due in 24 hours' },
  { hours: 12, level: 2, label: 'Due in 12 hours' },
  { hours: 6, level: 3, label: 'Due in 6 hours' },
  { hours: 0, level: 4, label: 'Overdue' },
];

export function runEscalationCheck() {
  const db = getDatabase();
  const now = new Date();

  // Get all pending tasks
  const tasks = db.prepare('SELECT * FROM tasks WHERE status = "pending" AND due_at IS NOT NULL').all();

  tasks.forEach((task) => {
    const dueDate = new Date(task.due_at);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

    let escalationLevel = 0;

    for (const rule of ESCALATION_RULES) {
      if (hoursUntilDue <= rule.hours) {
        escalationLevel = rule.level;
        break;
      }
    }

    if (escalationLevel !== task.escalation_level) {
      db.prepare('UPDATE tasks SET escalation_level = ? WHERE id = ?').run(escalationLevel, task.id);
    }
  });
}

export function getEscalatedTasks(userId) {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND status = "pending" AND escalation_level > 0 ORDER BY escalation_level DESC, due_at ASC'
    )
    .all(userId);
}
