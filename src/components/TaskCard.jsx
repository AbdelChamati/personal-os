import React, { useState } from 'react';
import * as authApi from '../api/authApi';
import '../styles/task-card.css';

export default function TaskCard({ task, onTaskUpdated, onTaskDeleted }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState(task.estimated_minutes || '');
  const [editDueAt, setEditDueAt] = useState(task.due_at || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    try {
      const updated = await authApi.completeTask(task.id);
      onTaskUpdated(updated);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await authApi.deleteTask(task.id);
      onTaskDeleted(task.id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updates = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory,
        priority: editPriority,
        estimated_minutes: editEstimatedMinutes ? parseInt(editEstimatedMinutes) : null,
        due_at: editDueAt || null,
      };

      const updated = await authApi.updateTask(task.id, updates);
      onTaskUpdated(updated);
      setShowEditForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityEmoji = () => {
    switch (task.priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getStatusIcon = () => {
    if (task.status === 'completed') return '✅';
    if (task.status === 'archived') return '📦';
    return '⭕';
  };

  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'completed';

  if (showEditForm) {
    return (
      <div className="task-card task-card-edit">
        <form onSubmit={handleSaveEdit}>
          {error && <div className="task-error">{error}</div>}

          <div className="form-group">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              rows="2"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} disabled={loading}>
              <option value="Personal">Personal</option>
              <option value="Professional">Professional</option>
              <option value="Family">Family</option>
              <option value="Home">Home</option>
              <option value="Finance">Finance</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} disabled={loading}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-row">
            <input
              type="number"
              value={editEstimatedMinutes}
              onChange={(e) => setEditEstimatedMinutes(e.target.value)}
              placeholder="Minutes"
              min="1"
              disabled={loading}
            />
            <input
              type="datetime-local"
              value={editDueAt}
              onChange={(e) => setEditDueAt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowEditForm(false)} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`task-card ${task.status} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-header">
        <div className="task-title-section">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={handleComplete}
            className="task-checkbox"
          />
          <h3 className="task-title">{task.title}</h3>
          <span className="task-priority">{getPriorityEmoji()}</span>
          {isOverdue && <span className="overdue-badge">⚠️ Overdue</span>}
        </div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className="task-category">{task.category}</span>
        {task.due_at && (
          <span className="task-due-date">
            📅 {new Date(task.due_at).toLocaleDateString()} {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {task.estimated_minutes && <span className="task-time">⏱️ {task.estimated_minutes} min</span>}
      </div>

      <div className="task-actions">
        <button className="task-btn edit-btn" onClick={() => setShowEditForm(true)} title="Edit">
          ✏️
        </button>
        <button className="task-btn delete-btn" onClick={handleDelete} title="Delete">
          🗑️
        </button>
      </div>
    </div>
  );
}
