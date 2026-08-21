import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { completeTask, updateTask } from "../api/api";
import { getLocalizedTaskContent } from "../i18n/taskSamples";

const DATE_LOCALE_BY_LANGUAGE = {
  en: "en-US",
  de: "de-DE",
  it: "it-IT",
  fr: "fr-FR",
  es: "es-ES",
};

export default function FocusTask({ task, onCompleted }) {
  const { t, i18n } = useTranslation();
  const [completing, setCompleting] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    category: task.category,
    priority: task.priority,
    estimated_minutes: task.estimated_minutes || "",
    due_at: task.due_at || "",
  });
  const [error, setError] = useState(null);

  const currentLanguage = DATE_LOCALE_BY_LANGUAGE[i18n.resolvedLanguage]
    ? i18n.resolvedLanguage
    : "en";
  const dateLocale = DATE_LOCALE_BY_LANGUAGE[currentLanguage] || "en-US";
  const localizedTask = getLocalizedTaskContent(task, t);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await completeTask(task.id);
      onCompleted();
    } catch (err) {
      console.error("Error completing task:", err);
      setError(t("focus.failedComplete"));
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) {
      setError(t("quickCapture.titleRequired"));
      return;
    }

    try {
      setCompleting(true);
      await updateTask(task.id, {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        category: editData.category,
        priority: editData.priority,
        estimated_minutes: editData.estimated_minutes
          ? parseInt(editData.estimated_minutes, 10)
          : null,
        due_at: editData.due_at || null,
      });
      setShowEditPanel(false);
      setShowMenu(false);
      onCompleted();
    } catch (err) {
      console.error("Error updating task:", err);
      setError(t("focus.failedUpdate"));
    } finally {
      setCompleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setCompleting(true);
      await updateTask(task.id, { status: "archived" });
      setShowMenu(false);
      onCompleted();
    } catch (err) {
      console.error("Error archiving task:", err);
      setError(t("focus.failedArchive"));
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return t("focus.noDueTime");
    const date = new Date(isoString);
    return date.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDueDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t("focus.dueTodayAt", { time: formatTime(isoString) });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t("focus.dueTomorrowAt", { time: formatTime(isoString) });
    } else {
      return t("focus.dueDateAt", {
        date: date.toLocaleDateString(dateLocale, {
          month: "short",
          day: "numeric",
        }),
        time: formatTime(isoString),
      });
    }
  };

  const getReasonForScore = (currentTask) => {
    const reasons = [];
    const now = new Date();

    if (currentTask.priority === "high") {
      reasons.push(t("focus.reasons.highPriority"));
    } else if (currentTask.priority === "medium") {
      reasons.push(t("focus.reasons.mediumPriority"));
    }

    if (currentTask.due_at) {
      const dueDate = new Date(currentTask.due_at);
      const diffMs = dueDate - now;
      const diffMins = diffMs / (1000 * 60);

      if (diffMs < 0) {
        reasons.push(t("focus.reasons.overdueImmediate"));
      } else if (diffMins <= 30) {
        reasons.push(t("focus.reasons.deadline30"));
      } else if (diffMins <= 120) {
        reasons.push(t("focus.reasons.deadline2h"));
      } else if (diffMins <= 24 * 60) {
        reasons.push(t("focus.reasons.dueToday"));
      }
    }

    if (currentTask.escalation_level > 0) {
      reasons.push(
        t("focus.reasons.escalationLevel", {
          level: currentTask.escalation_level,
        }),
      );
    }

    if (currentTask.created_at) {
      const createdDate = new Date(currentTask.created_at);
      const ageDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      if (ageDays > 3) {
        reasons.push(t("focus.reasons.pendingDays", { days: ageDays }));
      }
    }

    return reasons.length > 0 ? reasons : [t("focus.reasons.selectedForFocus")];
  };

  const reasons = getReasonForScore(task);

  if (showEditPanel) {
    return (
      <section className="focus-section">
        <div className="focus-header">
          <h2>{t("focus.editTask")}</h2>
        </div>

        <div className="focus-card edit-panel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-title">
                {t("focus.titleRequiredLabel")}
              </label>
              <input
                id="edit-task-title"
                name="title"
                type="text"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                className="form-input"
                placeholder={t("focus.taskTitlePlaceholder")}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-description">
                {t("focus.description")}
              </label>
              <textarea
                id="edit-task-description"
                name="description"
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                className="form-textarea"
                placeholder={t("focus.taskDescriptionPlaceholder")}
                rows="3"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-category">
                  {t("focus.category")}
                </label>
                <select
                  id="edit-task-category"
                  name="category"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="Personal">{t("categories.Personal")}</option>
                  <option value="Professional">
                    {t("categories.Professional")}
                  </option>
                  <option value="Family">{t("categories.Family")}</option>
                  <option value="Home">{t("categories.Home")}</option>
                  <option value="Finance">{t("categories.Finance")}</option>
                  <option value="Shopping">{t("categories.Shopping")}</option>
                  <option value="Health">{t("categories.Health")}</option>
                  <option value="Other">{t("categories.Other")}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-priority">
                  {t("focus.priority")}
                </label>
                <select
                  id="edit-task-priority"
                  name="priority"
                  value={editData.priority}
                  onChange={(e) =>
                    setEditData({ ...editData, priority: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="low">{t("priorities.low")}</option>
                  <option value="medium">{t("priorities.medium")}</option>
                  <option value="high">{t("priorities.high")}</option>
                </select>
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="edit-task-estimated-minutes"
                >
                  {t("focus.estMinutes")}
                </label>
                <input
                  id="edit-task-estimated-minutes"
                  name="estimated_minutes"
                  type="number"
                  value={editData.estimated_minutes}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      estimated_minutes: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder={t("quickCapture.minutes")}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-due-at">
                  {t("focus.dueDateTime")}
                </label>
                <input
                  id="edit-task-due-at"
                  name="due_at"
                  type="datetime-local"
                  value={editData.due_at}
                  onChange={(e) =>
                    setEditData({ ...editData, due_at: e.target.value })
                  }
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
                {completing ? t("focus.saving") : `✓ ${t("header.save")}`}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditPanel(false);
                  setError(null);
                }}
              >
                {t("header.cancel")}
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
        <h2>{t("focus.doNow")}</h2>
      </div>

      <div className="focus-card">
        <div className="focus-header-row">
          <h3 className="focus-title">{localizedTask.title}</h3>
          <div className="focus-menu-container">
            <button
              className="focus-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title={t("focus.moreOptions")}
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div
                  className="menu-overlay"
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="focus-menu">
                  <button
                    className="menu-item"
                    onClick={() => setShowEditPanel(true)}
                  >
                    ✏️ {t("focus.editTask")}
                  </button>
                  <button
                    className="menu-item"
                    onClick={handleArchive}
                    disabled={completing}
                  >
                    🗑️ {t("focus.archive")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="focus-meta">
          <div className="meta-row">
            <span className="meta-category">
              {t(`categories.${task.category}`, {
                defaultValue: task.category,
              })}
            </span>
            {task.estimated_minutes && (
              <span className="meta-duration">
                · {task.estimated_minutes} {t("quickCapture.minutes")}
              </span>
            )}
          </div>
          {task.due_at && (
            <div className="meta-due">{formatDueDate(task.due_at)}</div>
          )}
        </div>

        {localizedTask.description && (
          <p className="focus-description">{localizedTask.description}</p>
        )}

        <div className="focus-priority">
          <span className={`priority-badge priority-${task.priority}`}>
            {t("focus.priorityBadge", {
              priority: t(`priorities.${task.priority}`),
            })}
          </span>
        </div>

        <div className="focus-reasoning">
          <div className="reasoning-header">{t("focus.whyThisTask")}</div>
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
            {completing ? t("focus.completing") : `✓ ${t("mobile.done")}`}
          </button>
        </div>
      </div>
    </section>
  );
}
