import React, { useState, useRef, useEffect } from 'react';
import { createTask } from '../api/api';

export default function QuickCapture({ onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const taskData = {
        title: title.trim(),
        category,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        due_at: dueDate ? new Date(dueDate).toISOString() : null,
      };

      await createTask(taskData);

      // Reset form
      setTitle('');
      setCategory('Personal');
      setPriority('medium');
      setEstimatedMinutes('');
      setDueDate('');

      titleInputRef.current?.focus();
      onTaskCreated();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="quick-capture-section">
      <h2>QUICK CAPTURE</h2>
      
      <form onSubmit={handleSubmit} className="quick-capture-form">
        <div className="form-group">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="What do you need to do?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <input
              type="number"
              placeholder="Minutes"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="form-input"
              min="1"
            />
          </div>

          <div className="form-group">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : '+ Add Task'}
          </button>
        </div>
      </form>
    </section>
  );
}