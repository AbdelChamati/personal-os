import { getDatabase } from '../database.js';

export function calculateTaskScore(task) {
  let score = 0;

  // Priority scoring
  const priorityScores = { high: 30, medium: 20, low: 10 };
  score += priorityScores[task.priority] || 0;

  // Due date scoring
  if (task.due_at) {
    const dueDate = new Date(task.due_at);
    const now = new Date();
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) {
      score += 50; // Overdue
    } else if (hoursUntilDue < 24) {
      score += 40; // Due today
    } else if (hoursUntilDue < 72) {
      score += 30; // Due soon
    } else if (hoursUntilDue < 168) {
      score += 20; // Due this week
    } else {
      score += 10; // Due later
    }
  }

  // Escalation level
  score += (task.escalation_level || 0) * 5;

  // Estimated time (smaller = higher score)
  if (task.estimated_minutes) {
    if (task.estimated_minutes <= 15) {
      score += 10;
    } else if (task.estimated_minutes <= 30) {
      score += 8;
    } else if (task.estimated_minutes <= 60) {
      score += 5;
    }
  }

  return score;
}

export function getTopPriorityTasks(userId, limit = 5) {
  const db = getDatabase();
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? AND status = "pending" ORDER BY created_at DESC')
    .all(userId);

  const scored = tasks.map((task) => ({
    ...task,
    score: calculateTaskScore(task),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
