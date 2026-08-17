export function getReasonForScore(task) {
  const reasons = [];
  const now = new Date();

  // Priority reason
  if (task.priority === 'high') {
    reasons.push('High priority');
  } else if (task.priority === 'medium') {
    reasons.push('Medium priority');
  }

  // Due date reason
  if (task.due_at) {
    const dueDate = new Date(task.due_at);
    const diffMs = dueDate - now;
    const diffMins = diffMs / (1000 * 60);

    if (diffMs < 0) {
      reasons.push('Overdue - needs immediate attention');
    } else if (diffMins <= 30) {
      reasons.push('Deadline approaching in less than 30 minutes');
    } else if (diffMins <= 120) {
      reasons.push('Deadline within next 2 hours');
    } else if (diffMins <= 24 * 60) {
      reasons.push('Due today');
    }
  }

  // Escalation reason
  if (task.escalation_level > 0) {
    reasons.push(`Escalation level ${task.escalation_level}`);
  }

  // Age reason
  if (task.created_at) {
    const createdDate = new Date(task.created_at);
    const ageDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    if (ageDays > 3) {
      reasons.push(`Pending for ${ageDays} days`);
    }
  }

  return reasons.length > 0 ? reasons : ['Selected for focus'];
}

export function formatTaskDueDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function isTaskOverdue(task) {
  if (!task.due_at) return false;
  return new Date(task.due_at) < new Date();
}