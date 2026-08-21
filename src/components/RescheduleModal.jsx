import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

export default function RescheduleModal({ task, onConfirm, onCancel }) {
  const { t } = useTranslation();
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
        <h3>{t("reschedule.title")}</h3>
        <p className="modal-subtitle">{task.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reschedule-date-time">
              {t("reschedule.dateTime")}
            </label>
            <input
              id="reschedule-date-time"
              name="due_at"
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
              {t("reschedule.confirm")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
            >
              {t("reschedule.clearDueDate")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              {t("header.cancel")}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
