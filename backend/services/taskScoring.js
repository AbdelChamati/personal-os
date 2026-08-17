export function calculateTaskScore(task) {
  let score = 0;
  const now = new Date();
  
  // Priority scoring
  const priorityScores = {
    high: 30,
    medium: 15,
    low: 5,
  };
  score += priorityScores[task.priority] || 5;
  
  // Due date scoring
  if (task.due_at) {
    const dueDate = new Date(task.due_at);
    const diffMs = dueDate - now;
    const diffMins = diffMs / (1000 * 60);
    
    if (diffMs < 0) {
      // Overdue
      score += 60;
      // Add extra points for how overdue
      const daysPast = Math.floor(-diffMs / (1000 * 60 * 60 * 24));
      score += Math.min(daysPast * 5, 20);
    } else if (diffMins <= 30) {
      score += 45;
    } else if (diffMins <= 120) {
      score += 35;
    } else if (diffMins <= 24 * 60) {
      score += 25;
    } else if (diffMins <= 48 * 60) {
      score += 12;
    } else {
      score += 5;
    }
  }
  
  // Expiration date scoring
  if (task.expires_at) {
    const expiresDate = new Date(task.expires_at);
    const diffMs = expiresDate - now;
    
    if (diffMs < 24 * 60 * 60 * 1000) {
      score += 25;
    } else if (diffMs < 48 * 60 * 60 * 1000) {
      score += 15;
    }
  }
  
  // Escalation level scoring
  const escalationScores = {
    0: 0,
    1: 10,
    2: 20,
    3: 35,
  };
  score += escalationScores[task.escalation_level] || 0;
  
  // Age bonus (older pending tasks get slight boost)
  const createdDate = new Date(task.created_at);
  const ageMs = now - createdDate;
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  score += Math.min(ageDays * 1, 5);
  
  return Math.round(score);
}

export function scoreAndSortTasks(tasks) {
  const scored = tasks.map(task => ({
    ...task,
    score: calculateTaskScore(task),
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored;
}