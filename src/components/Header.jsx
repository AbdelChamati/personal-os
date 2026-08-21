import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY, supportedLanguages } from "../i18n";

const DATE_LOCALE_BY_LANGUAGE = {
  en: "en-US",
  de: "de-DE",
  it: "it-IT",
  fr: "fr-FR",
  es: "es-ES",
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("userName") || "";
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(userName);

  const currentLanguage = supportedLanguages.includes(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "en";
  const dateLocale = DATE_LOCALE_BY_LANGUAGE[currentLanguage] || "en-US";
  const today = new Date();
  const dayName = today.toLocaleDateString(dateLocale, { weekday: "long" });
  const dateStr = today.toLocaleDateString(dateLocale, {
    month: "long",
    day: "numeric",
  });

  const handleSaveName = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem("userName", trimmed);
    } else {
      setUserName("");
      localStorage.removeItem("userName");
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(userName);
    setIsEditing(false);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", currentLanguage);
  }, [currentLanguage]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const displayTitle = "PERSONAL REMINDER OS";

  const handleLanguageChange = async (event) => {
    const language = event.target.value;
    await i18n.changeLanguage(language);
    localStorage.setItem(STORAGE_KEY, language);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title-section">
          <h1 className="header-title" title={displayTitle}>
            PERSONAL REMINDER OS
          </h1>
          {!isEditing && (
            <button
              className="name-display"
              onClick={() => {
                setEditValue(userName);
                setIsEditing(true);
              }}
            >
              {userName ? `👤 ${userName}` : t("header.addName")}
            </button>
          )}
          {isEditing && (
            <div className="name-edit">
              <input
                id="user-name"
                name="userName"
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={t("header.yourName")}
                className="name-input"
                autoFocus
              />
              <button className="name-btn name-save" onClick={handleSaveName}>
                {t("header.save")}
              </button>
              <button className="name-btn name-cancel" onClick={handleCancel}>
                {t("header.cancel")}
              </button>
            </div>
          )}
        </div>
        <div className="header-date-actions">
          <div className="language-switcher">
            <label htmlFor="language-select" className="language-label">
              {t("header.languageShort")}:
            </label>
            <select
              id="language-select"
              name="language"
              className="language-select"
              value={currentLanguage}
              onChange={handleLanguageChange}
              aria-label={t("header.language")}
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
              <option value="it">IT</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={t("header.toggleTheme")}
          >
            {theme === "light" ? t("header.darkMode") : t("header.lightMode")}
          </button>
          <div className="header-date">
            <p className="date-label">{t("header.today")}</p>
            <p className="date-value">
              {dayName}, {dateStr}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
