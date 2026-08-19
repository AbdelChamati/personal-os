import React, { useState } from "react";
import ReactDOM from "react-dom";

export default function RescheduleModal({ task, onConfirm, onCancel }) {
  const [dateTime, setDateTime] = useState(task.due_at || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(dateTime);
  };

  const handleClear = () => {
    onConfirm("");
  };

  return ReactDOM.createPortal(
    <>
      <div className="confirm-overlay" onClick={onCancel} />
      <div className="confirm-dialog reschedule-modal">
        <h3>Reschedule Task</h3>
        <p className="modal-subtitle">{task.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!dateTime}
            >
              Reschedule
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
            >
              Clear Due Date
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
