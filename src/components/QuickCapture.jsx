import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createTask } from "../api/api";

const CATEGORY_KEYWORDS = [
  ["Professional", /(work|office|client|meeting|project)/i],
  ["Family", /(family|kids|parent|mom|dad|child)/i],
  ["Home", /(home|clean|laundry|kitchen|repair)/i],
  ["Finance", /(finance|budget|bank|bill|invoice|tax)/i],
  ["Shopping", /(shop|buy|grocery|groceries|store)/i],
  ["Health", /(health|doctor|dentist|gym|workout|medicine)/i],
];

function parseNaturalInput(input) {
  const original = input.trim();
  let remaining = original;

  let parsedPriority = null;
  if (/\b(high|urgent|asap)\b/i.test(remaining)) {
    parsedPriority = "high";
    remaining = remaining.replace(/\b(high|urgent|asap)\b/gi, "");
  } else if (/\b(low|later)\b/i.test(remaining)) {
    parsedPriority = "low";
    remaining = remaining.replace(/\b(low|later)\b/gi, "");
  } else if (/\b(medium|normal)\b/i.test(remaining)) {
    parsedPriority = "medium";
    remaining = remaining.replace(/\b(medium|normal)\b/gi, "");
  }

  let parsedMinutes = null;
  const minutesMatch = remaining.match(
    /\b(\d{1,3})\s*(m|min|mins|minute|minutes)\b/i,
  );
  if (minutesMatch) {
    parsedMinutes = Number.parseInt(minutesMatch[1], 10);
    remaining = remaining.replace(minutesMatch[0], "");
  }

  let parsedCategory = null;
  for (const [category, regex] of CATEGORY_KEYWORDS) {
    if (regex.test(remaining)) {
      parsedCategory = category;
      break;
    }
  }

  const now = new Date();
  let dueDate = null;
  let hasDateKeyword = false;

  if (/\btomorrow\b/i.test(remaining)) {
    const base = new Date(now);
    base.setDate(base.getDate() + 1);
    base.setHours(18, 0, 0, 0);
    dueDate = base;
    hasDateKeyword = true;
    remaining = remaining.replace(/\btomorrow\b/gi, "");
  } else if (/\btoday\b/i.test(remaining)) {
    const base = new Date(now);
    base.setHours(Math.max(base.getHours() + 1, 18), 0, 0, 0);
    dueDate = base;
    hasDateKeyword = true;
    remaining = remaining.replace(/\btoday\b/gi, "");
  }

  const timeMatch = remaining.match(
    /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  );
  if (timeMatch) {
    const hasMeridiem = Boolean(timeMatch[3]);
    const rawHour = Number.parseInt(timeMatch[1], 10);
    const minute = Number.parseInt(timeMatch[2] || "0", 10);
    if (rawHour >= 0 && rawHour <= 23 && minute >= 0 && minute <= 59) {
      const base = dueDate || new Date(now);
      let hour = rawHour;
      if (hasMeridiem) {
        const meridiem = timeMatch[3].toLowerCase();
        if (meridiem === "pm" && hour < 12) hour += 12;
        if (meridiem === "am" && hour === 12) hour = 0;
      }
      base.setHours(hour, minute, 0, 0);
      if (!hasDateKeyword && base < now) {
        base.setDate(base.getDate() + 1);
      }
      dueDate = base;
      remaining = remaining.replace(timeMatch[0], "");
    }
  }

  const cleanedTitle = remaining.replace(/\s{2,}/g, " ").trim() || original;

  return {
    title: cleanedTitle,
    priority: parsedPriority,
    estimatedMinutes: parsedMinutes,
    category: parsedCategory,
    dueAt: dueDate ? dueDate.toISOString() : null,
  };
}

export default function QuickCapture({ onTaskCreated }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState(null);
  const [parseHint, setParseHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t("quickCapture.titleRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const parsed = parseNaturalInput(title);
      const resolvedTitle = parsed.title;
      const resolvedCategory =
        category === "Personal" && parsed.category ? parsed.category : category;
      const resolvedPriority =
        priority === "medium" && parsed.priority ? parsed.priority : priority;
      const resolvedMinutes =
        estimatedMinutes || parsed.estimatedMinutes || null;
      const resolvedDueAt = dueDate
        ? new Date(dueDate).toISOString()
        : parsed.dueAt;

      const taskData = {
        title: resolvedTitle,
        category: resolvedCategory,
        priority: resolvedPriority,
        estimated_minutes: resolvedMinutes
          ? parseInt(resolvedMinutes, 10)
          : null,
        due_at: resolvedDueAt,
      };

      await createTask(taskData);

      const hints = [];
      if (parsed.priority)
        hints.push(
          t("quickCapture.hintPriority", {
            value: t(`priorities.${parsed.priority}`),
          }),
        );
      if (parsed.estimatedMinutes)
        hints.push(
          t("quickCapture.hintMinutes", { value: parsed.estimatedMinutes }),
        );
      if (parsed.category) hints.push(t(`categories.${parsed.category}`));
      if (parsed.dueAt) hints.push(t("quickCapture.dueDateTime"));
      setParseHint(
        hints.length
          ? t("quickCapture.autoDetected", { details: hints.join(" • ") })
          : "",
      );

      // Reset form
      setTitle("");
      setCategory("Personal");
      setPriority("medium");
      setEstimatedMinutes("");
      setDueDate("");

      titleInputRef.current?.focus();
      onTaskCreated();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || t("quickCapture.failedCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="quick-capture-section">
      <h2>{t("quickCapture.title")}</h2>

      <form onSubmit={handleSubmit} className="quick-capture-form">
        <div className="form-group">
          <input
            id="quick-task-title"
            name="title"
            ref={titleInputRef}
            type="text"
            placeholder={t("quickCapture.placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        {parseHint && <p className="parse-hint">{parseHint}</p>}

        <div className="form-grid">
          <div className="form-group">
            <select
              id="quick-task-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            <select
              id="quick-task-priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option value="low">{t("priorities.low")}</option>
              <option value="medium">{t("priorities.medium")}</option>
              <option value="high">{t("priorities.high")}</option>
            </select>
          </div>

          <div className="form-group">
            <input
              id="quick-task-estimated-minutes"
              name="estimated_minutes"
              type="number"
              placeholder={t("quickCapture.minutes")}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="form-input"
              min="1"
            />
          </div>

          <div className="form-group">
            <input
              id="quick-task-due-at"
              name="due_at"
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
            {submitting ? t("quickCapture.adding") : t("quickCapture.addTask")}
          </button>
        </div>
      </form>
    </section>
  );
}
