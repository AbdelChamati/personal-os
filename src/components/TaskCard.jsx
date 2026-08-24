import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authApi from '../api/authApi';
import '../styles/task-card.css';

export default function TaskCard({ task, onTaskUpdated, onTaskDeleted }) {
  const { t, i18n } = useTranslation();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState(task.estimated_minutes || '');
  const [editDueAt, setEditDueAt] = useState(task.due_at || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleCompletion = async () => {
    try {
      const updated = task.status === 'completed'
        ? await authApi.updateTask(task.id, { status: 'pending', completed_at: null })
        : await authApi.completeTask(task.id);
      onTaskUpdated(updated);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDelete = async () => {
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
              placeholder={t('taskCard.titlePlaceholder')}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t('taskForm.description')}
              rows="2"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} disabled={loading}>
              {['Personal', 'Professional', 'Family', 'Home', 'Finance', 'Shopping', 'Health', 'Other'].map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}
            </select>
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} disabled={loading}>
              {['low', 'medium', 'high'].map((priority) => <option key={priority} value={priority}>{t(`priorities.${priority}`)}</option>)}
            </select>
          </div>

          <div className="form-row">
            <input
              type="number"
              value={editEstimatedMinutes}
              onChange={(e) => setEditEstimatedMinutes(e.target.value)}
              placeholder={t('taskForm.estimatedMinutes')}
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
              {loading ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => setShowEditForm(false)} disabled={loading}>
              {t('common.cancel')}
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
            onChange={handleToggleCompletion}
            className="task-checkbox"
            aria-label={task.status === 'completed' ? t('taskCard.markPending') : t('taskCard.markCompleted')}
          />
          <h3 className="task-title">{task.title}</h3>
          <span className="task-priority">{getPriorityEmoji()}</span>
          {isOverdue && <span className="overdue-badge">{t('taskCard.overdue')}</span>}
        </div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className="task-category">{t(`categories.${task.category}`, { defaultValue: task.category })}</span>
        {task.due_at && (
          <span className="task-due-date">
            {new Date(task.due_at).toLocaleDateString(i18n.language)} {new Date(task.due_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {task.estimated_minutes && <span className="task-time">{t('taskCard.minutes', { count: task.estimated_minutes })}</span>}
      </div>

      <div className="task-actions">
        <button className="task-btn edit-btn" onClick={() => setShowEditForm(true)} title={t('taskCard.edit')} aria-label={t('taskCard.edit')}>
          ✏️
        </button>
        <button className="task-btn delete-btn" onClick={() => setShowDeleteConfirm(true)} title={t('taskCard.delete')} aria-label={t('taskCard.delete')}>
          🗑️
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="task-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby={`delete-task-${task.id}`}>
          <div>
            <strong id={`delete-task-${task.id}`}>{t('taskCard.confirmDelete')}</strong>
            <p>{t('taskCard.deleteWarning')}</p>
          </div>
          <div className="task-delete-actions">
            <button type="button" className="task-delete-cancel" onClick={() => setShowDeleteConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="task-delete-confirm-btn" onClick={handleDelete}>
              {t('taskCard.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
