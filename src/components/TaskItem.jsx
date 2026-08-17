import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { completeTask, updateTask, deleteTask } from '../api/api';

export default function TaskItem({ task, onCompleted, showDelete = false }) {
  const [completing, setCompleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  /* useEffect(() => {
    if (showMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 150,
      });
    }
  }, [showMenu]); */

  useEffect(() => {
  if (showMenu && btnRef.current) {
    const rect = btnRef.current.getBoundingClientRect();
    const pos = {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX - 150,
    };
    console.log('Menu position:', pos);
    console.log('Button rect:', rect);
    console.log('Window scroll:', { scrollX: window.scrollX, scrollY: window.scrollY });
    setMenuPos(pos);
  }
}, [showMenu]);

  const toggleMenu = () => {
    console.log('Toggle menu for:', task.title);
    setShowMenu(prev => !prev);
  };

  const closeMenu = () => {
    console.log('Close menu');
    setShowMenu(false);
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      console.log('Completing task:', task.id);
      await completeTask(task.id);
      onCompleted();
    } catch (err) {
      console.error('Error completing:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setCompleting(true);
      console.log('Restoring task:', task.id);
      await updateTask(task.id, { status: 'pending', completed_at: null });
      closeMenu();
      onCompleted();
    } catch (err) {
      console.error('Error restoring:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setCompleting(true);
      console.log('Archiving task:', task.id);
      await updateTask(task.id, { status: 'archived' });
      closeMenu();
      onCompleted();
    } catch (err) {
      console.error('Error archiving:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleReschedule = async () => {
    const newDate = prompt('New due date:', task.due_at || '');
    if (newDate !== null) {
      try {
        setCompleting(true);
        console.log('Rescheduling task:', task.id);
        await updateTask(task.id, { due_at: newDate || null });
        closeMenu();
        onCompleted();
      } catch (err) {
        console.error('Error rescheduling:', err);
      } finally {
        setCompleting(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      setCompleting(true);
      console.log('Deleting task:', task.id);
      await deleteTask(task.id);
      closeMenu();
      setShowConfirm(false);
      onCompleted();
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setCompleting(false);
    }
  };

  const isOverdue = task.due_at && new Date(task.due_at) < new Date();

  console.log('Rendering task:', task.title, 'showMenu:', showMenu);

  return (
    <>
      <div className={`task-item ${task.status} ${isOverdue ? 'overdue' : ''}`}>
        <div className="task-checkbox">
          {task.status === 'pending' && (
            <button
              className="checkbox-btn"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? '...' : '○'}
            </button>
          )}
          {task.status === 'completed' && <div className="checkbox-completed">✓</div>}
          {task.status === 'archived' && <div className="checkbox-archived">📦</div>}
        </div>

        <div className="task-content">
          <div className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
            {task.title}
          </div>
          <div className="task-meta">
            <span className="meta-category">{task.category}</span>
            {task.estimated_minutes && (
              <span className="meta-duration">· {task.estimated_minutes} min</span>
            )}
          </div>
        </div>

        <div className="task-actions">
          <button
            ref={btnRef}
            className="task-menu-btn"
            onClick={toggleMenu}
          >
            ⋮
          </button>
        </div>

        <div className="task-priority">
          <span className={`priority-dot priority-${task.priority}`}></span>
        </div>
      </div>

      {showMenu ? (
        ReactDOM.createPortal(
          <>
            <div className="menu-overlay" onClick={closeMenu} />
            <div
              className="task-menu-portal"
              style={{
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
              }}
            >
              {task.status === 'pending' && (
                <>
                  <button className="menu-item" onClick={handleReschedule}>
                    📅 Reschedule
                  </button>
                  <button className="menu-item" onClick={handleArchive}>
                    🗑️ Archive
                  </button>
                </>
              )}
              {task.status === 'completed' && (
                <>
                  <button className="menu-item" onClick={handleRestore}>
                    ↩️ Restore
                  </button>
                  {showDelete && (
                    <button className="menu-item delete-btn" onClick={() => setShowConfirm(true)}>
                      ❌ Delete
                    </button>
                  )}
                </>
              )}
              {task.status === 'archived' && (
                <>
                  <button className="menu-item" onClick={handleRestore}>
                    ↩️ Restore
                  </button>
                  {showDelete && (
                    <button className="menu-item delete-btn" onClick={() => setShowConfirm(true)}>
                      ❌ Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </>,
          document.body
        )
      ) : null}

      {showConfirm ? (
        ReactDOM.createPortal(
          <>
            <div className="confirm-overlay" onClick={() => setShowConfirm(false)} />
            <div className="confirm-dialog">
              <h3>Delete Task?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-actions">
                <button className="btn btn-primary" onClick={handleDelete}>
                  Delete
                </button>
                <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </>,
          document.body
        )
      ) : null}
    </>
  );
}