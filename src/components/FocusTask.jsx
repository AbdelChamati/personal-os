import React, { useState } from 'react';
import { completeTask, updateTask } from '../api/api';
import { getReasonForScore } from '../domain/taskHelpers';

export default function FocusTask({ task, onCompleted }) {
  const [completing, setCompleting] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    category: task.category,
    priority: task.priority,
    estimated_minutes: task.estimated_minutes || '',
    due_at: task.due_at || '',
  });
  const [error, setError] = useState(null);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await completeTask(task.id);
      onCompleted();
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setCompleting(true);
      await updateTask(task.id, {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        category: editData.category,
        priority: editData.priority,
        estimated_minutes: editData.estimated_minutes ? parseInt(editData.estimated_minutes, 10) : null,
        due_at: editData.due_at || null,
      });
      setShowEditPanel(false);
      setShowMenu(false);
      onCompleted();
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    } finally {
      setCompleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setCompleting(true);
      await updateTask(task.id, { status: 'archived' });
      setShowMenu(false);
      onCompleted();
    } catch (err) {
      console.error('Error archiving task:', err);
      setError('Failed to archive task');
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'No due time';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDueDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Due today at ' + formatTime(isoString);
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Due tomorrow at ' + formatTime(isoString);
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + formatTime(isoString);
    }
  };

  const reasons = getReasonForScore(task);

  if (showEditPanel) {
    return (
      <section className="focus-section">
        <div className="focus-header">
          <h2>EDIT TASK</h2>
        </div>
        
        <div className="focus-card edit-panel">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="form-input"
                placeholder="Task title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="form-textarea"
                placeholder="Task description (optional)"
                rows="3"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  className="form-select"
                >
                  <option value="Personal">Personal</option>
                  <option value="Professional">Professional</option>
                  <option value="Family">Family</option>
                  <option value="Home">Home</option>
                  <option value="Finance">Finance</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="form-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Est. Minutes</label>
                <input
                  type="number"
                  value={editData.estimated_minutes}
                  onChange={(e) => setEditData({ ...editData, estimated_minutes: e.target.value })}
                  className="form-input"
                  placeholder="Minutes"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={editData.due_at}
                  onChange={(e) => setEditData({ ...editData, due_at: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="edit-actions">
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={completing}
              >
                {completing ? 'Saving...' : '✓ Save'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditPanel(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="focus-section">
      <div className="focus-header">
        <h2>DO NOW</h2>
      </div>
      
      <div className="focus-card">
        <div className="focus-header-row">
          <h3 className="focus-title">{task.title}</h3>
          <div className="focus-menu-container">
            <button
              className="focus-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="menu-overlay" onClick={() => setShowMenu(false)}></div>
                <div className="focus-menu">
                  <button 
                    className="menu-item"
                    onClick={() => setShowEditPanel(true)}
                  >
                    ✏️ Edit Task
                  </button>
                  <button 
                    className="menu-item"
                    onClick={handleArchive}
                    disabled={completing}
                  >
                    🗑️ Archive
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="focus-meta">
          <div className="meta-row">
            <span className="meta-category">{task.category}</span>
            {task.estimated_minutes && (
              <span className="meta-duration">· {task.estimated_minutes} min</span>
            )}
          </div>
          {task.due_at && (
            <div className="meta-due">{formatDueDate(task.due_at)}</div>
          )}
        </div>

        {task.description && (
          <p className="focus-description">{task.description}</p>
        )}

        <div className="focus-priority">
          <span className={`priority-badge priority-${task.priority}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
        </div>

        <div className="focus-reasoning">
          <div className="reasoning-header">Why this task?</div>
          <ul className="reasoning-list">
            {reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="focus-actions">
          <button 
            className="btn btn-primary"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? 'Completing...' : '✓ Done'}
          </button>
        </div>
      </div>
    </section>
  );
}