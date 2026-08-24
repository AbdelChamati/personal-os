import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authApi from '../api/authApi';
import '../styles/task-form.css';

const CATEGORIES = ['Personal', 'Professional', 'Family', 'Home', 'Finance', 'Shopping', 'Health', 'Other'];
const PRIORITIES = ['low', 'medium', 'high'];
const REMINDER_OFFSETS = [
  { value: '60', label: 'oneHour' },
  { value: '1440', label: 'oneDay' },
  { value: '2880', label: 'twoDays' },
  { value: '10080', label: 'oneWeek' },
];

export default function TaskForm({ onTaskCreated, openSignal = 0 }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [reminderOffset, setReminderOffset] = useState('');
  const [reminderChannel, setReminderChannel] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (openSignal > 0) {
      setShowForm(true);
    }
  }, [openSignal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('taskForm.titleRequired'));
      return;
    }

    let reminder = null;
    if (reminderOffset) {
      if (!dueAt) {
        setError(t('taskForm.reminderNeedsDueDate'));
        return;
      }
      const scheduledAt = new Date(new Date(dueAt).getTime() - Number(reminderOffset) * 60 * 1000);
      if (scheduledAt <= new Date()) {
        setError(t('taskForm.reminderNeedsFutureDate'));
        return;
      }
      reminder = { channel: reminderChannel, scheduled_at: scheduledAt.toISOString() };
    }

    setLoading(true);

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        due_at: dueAt || null,
        reminder,
      };

      const newTask = await authApi.createTask(taskData);
      onTaskCreated(newTask);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setPriority('medium');
      setEstimatedMinutes('');
      setDueAt('');
      setReminderOffset('');
      setReminderChannel('email');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form-container">
      {!showForm ? (
        <button className="btn-new-task" onClick={() => setShowForm(true)}>
          {t('taskForm.newTask')}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="task-form">
          <h3>{t('taskForm.createNewTask')}</h3>

          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>{t('taskForm.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskForm.titlePlaceholder')}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('taskForm.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('taskForm.descriptionPlaceholder')}
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('taskForm.category')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('taskForm.priority')}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={loading}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`priorities.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row task-details-row">
            <div className="form-group">
              <label>{t('taskForm.estimatedMinutes')}</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder={t('taskForm.minutesPlaceholder')}
                min="1"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>{t('taskForm.dueDate')}</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="reminder-settings">
            <div className="reminder-heading">
              <label htmlFor="reminder-offset">{t('taskForm.reminder')}</label>
              <span>{t('taskForm.reminderHelp')}</span>
            </div>
            <div className="reminder-controls">
              <select id="reminder-offset" value={reminderOffset} onChange={(event) => setReminderOffset(event.target.value)} disabled={loading}>
                <option value="">{t('taskForm.noReminder')}</option>
                {REMINDER_OFFSETS.map((offset) => <option key={offset.value} value={offset.value}>{t(`taskForm.${offset.label}`)}</option>)}
              </select>
              <select value={reminderChannel} onChange={(event) => setReminderChannel(event.target.value)} disabled={loading || !reminderOffset} aria-label={t('taskForm.reminderChannel')}>
                <option value="email">{t('taskForm.emailReminder')}</option>
                <option value="sms">{t('taskForm.smsReminder')}</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? t('taskForm.creating') : t('taskForm.createTask')}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
