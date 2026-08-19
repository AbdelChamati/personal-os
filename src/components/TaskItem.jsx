import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import RescheduleModal from "./RescheduleModal";
import { completeTask, updateTask, deleteTask } from "../api/api";

export default function TaskItem({ task, onCompleted, showDelete = false }) {
  const [completing, setCompleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (showMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const newPos = {
        top: rect.bottom + 10,
        left: rect.left - 140,
      };
      setMenuPos(newPos);
    }
  }, [showMenu]);

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await completeTask(task.id);
      onCompleted();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setCompleting(true);
      await updateTask(task.id, { status: "pending", completed_at: null });
      closeMenu();
      onCompleted();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setCompleting(true);
      await updateTask(task.id, { status: "archived" });
      closeMenu();
      onCompleted();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleRescheduleClick = () => {
    closeMenu();
    setShowReschedule(true);
  };

  const handleRescheduleConfirm = async (newDateTime) => {
    try {
      setCompleting(true);
      await updateTask(task.id, { due_at: newDateTime || null });
      setShowReschedule(false);
      onCompleted();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to reschedule task");
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setCompleting(true);
      await deleteTask(task.id);
      closeMenu();
      setShowConfirm(false);
      onCompleted();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to delete task");
    } finally {
      setCompleting(false);
    }
  };

  const isOverdue = task.due_at && new Date(task.due_at) < new Date();

  return (
    <>
      <div className={`task-item ${task.status} ${isOverdue ? "overdue" : ""}`}>
        <div className="task-checkbox">
          {task.status === "pending" && (
            <button
              className="checkbox-btn"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? "..." : "○"}
            </button>
          )}
          {task.status === "completed" && (
            <div className="checkbox-completed">✓</div>
          )}
          {task.status === "archived" && (
            <div className="checkbox-archived">📦</div>
          )}
        </div>

        <div className="task-content">
          <div
            className={`task-title ${task.status === "completed" ? "completed" : ""}`}
          >
            {task.title}
          </div>
          <div className="task-meta">
            <span className="meta-category">{task.category}</span>
            {task.estimated_minutes && (
              <span className="meta-duration">
                · {task.estimated_minutes} min
              </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          <button ref={btnRef} className="task-menu-btn" onClick={toggleMenu}>
            ⋮
          </button>
        </div>

        <div className="task-priority">
          <span className={`priority-dot priority-${task.priority}`}></span>
        </div>
      </div>

      {showMenu &&
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
              {task.status === "pending" && (
                <>
                  <button className="menu-item" onClick={handleRescheduleClick}>
                    📅 Reschedule
                  </button>
                  <button className="menu-item" onClick={handleArchive}>
                    🗑️ Archive
                  </button>
                </>
              )}
              {task.status === "completed" && (
                <>
                  <button className="menu-item" onClick={handleRestore}>
                    ↩️ Restore
                  </button>
                  {showDelete && (
                    <button
                      className="menu-item delete-btn"
                      onClick={() => setShowConfirm(true)}
                    >
                      ❌ Delete
                    </button>
                  )}
                </>
              )}
              {task.status === "archived" && (
                <>
                  <button className="menu-item" onClick={handleRestore}>
                    ↩️ Restore
                  </button>
                  {showDelete && (
                    <button
                      className="menu-item delete-btn"
                      onClick={() => setShowConfirm(true)}
                    >
                      ❌ Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </>,
          document.body,
        )}

      {showReschedule && (
        <RescheduleModal
          task={task}
          onConfirm={handleRescheduleConfirm}
          onCancel={() => setShowReschedule(false)}
        />
      )}

      {showConfirm &&
        ReactDOM.createPortal(
          <>
            <div
              className="confirm-overlay"
              onClick={() => setShowConfirm(false)}
            />
            <div className="confirm-dialog">
              <h3>Delete Task?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleDelete}
                  disabled={completing}
                >
                  Delete
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
