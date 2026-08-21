const API_BASE = '/api';

export async function getTodayView() {
  const response = await fetch(`${API_BASE}/today`);
  if (!response.ok) throw new Error('Failed to fetch today view');
  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function getAllTasks() {
  const response = await fetch(`${API_BASE}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function getTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`);
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
}

export async function createTask(taskData) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }
  return response.json();
}

export async function updateTask(id, updates) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function completeTask(id) {
  return updateTask(id, { status: 'completed' });
}

export async function archiveTask(id) {
  return updateTask(id, { status: 'archived' });
}

export async function deleteTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

export async function exportTasks() {
  const tasksResponse = await fetch(`${API_BASE}/tasks`);
  if (!tasksResponse.ok) throw new Error('Failed to export tasks');
  const tasks = await tasksResponse.json();
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    count: Array.isArray(tasks) ? tasks.length : 0,
    tasks: Array.isArray(tasks) ? tasks : [],
  };
}

export async function importTasks(payload) {
  const response = await fetch(`${API_BASE}/tasks/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import tasks');
  }
  return response.json();
}