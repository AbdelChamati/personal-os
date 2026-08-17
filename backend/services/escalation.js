import { getDatabase } from '../database.js';

export function runEscalationCheck() {
  const db = getDatabase();
  const now = new Date();
  
  // Find pending tasks
  const pendingTasks = db.prepare(`
    SELECT * FROM tasks WHERE status = 'pending'
  `).all();
  
  for (const task of pendingTasks) {
    if (!task.due_at) continue;
    
    const dueDate = new Date(task.due_at);
    const isOverdue = dueDate < now;
    
    if (!isOverdue) continue;
    
    // Increase escalation level gradually
    let newLevel = task.escalation_level || 0;
    const diffMs = now - dueDate;
    const hrsOverdue = Math.floor(diffMs / (1000 * 60 * 60));
    
    // Escalate based on how overdue
    if (hrsOverdue >= 24) {
      newLevel = Math.min(3, 3); // Level 3 for very overdue
    } else if (hrsOverdue >= 4) {
      newLevel = Math.min(2, 3);
    } else if (hrsOverdue >= 1) {
      newLevel = Math.min(1, 3);
    }
    
    // Don't update if already at max level to avoid unnecessary writes
    if (newLevel !== task.escalation_level) {
      db.prepare(`
        UPDATE tasks SET escalation_level = ? WHERE id = ?
      `).run(newLevel, task.id);
    }
  }
  
  // Auto-archive tasks past their expiration date
  db.prepare(`
    UPDATE tasks
    SET status = 'archived'
    WHERE status = 'pending'
      AND expires_at < datetime('now')
  `).run();
}