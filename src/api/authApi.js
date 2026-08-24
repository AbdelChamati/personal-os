const API_BASE = '/api';

async function parseAuthResponse(response, fallbackMessage) {
  const body = await response.text();
  let data = null;

  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(response.ok ? 'The server returned an invalid response' : fallbackMessage);
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  if (!data) {
    throw new Error('The server returned an empty response');
  }

  return data;
}

// Auth API
export async function register(email, password, confirmPassword, name) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword, name }),
  });
  return parseAuthResponse(response, 'Registration failed');
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseAuthResponse(response, 'Login failed');
}

export async function logout() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  return response.json();
}

export async function getCurrentUser() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }
  return response.json();
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send password reset');
  }
  return response.json();
}

export async function resetPassword(resetToken, newPassword, confirmPassword) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }
  return response.json();
}

export async function updateProfile(name, email, phoneNumber) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email, phoneNumber }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  return response.json();
}

export async function updateAvatar(avatarUrl) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/auth/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ avatarUrl }),
  });
  return parseAuthResponse(response, 'Failed to update avatar');
}

export async function deleteAccount(password) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete account');
  }
  return response.json();
}

// Task API (with auth)
export async function getTodayView() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/today`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch today view');
  return response.json();
}

export async function getStats() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function getAllTasks() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function getTask(id) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
}

export async function createTask(taskData) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }
  return response.json();
}

export async function updateTask(id, updates) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

export async function exportTasks() {
  const token = localStorage.getItem('authToken');
  const tasksResponse = await fetch(`${API_BASE}/tasks/export`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
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
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/tasks/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import tasks');
  }
  return response.json();
}
