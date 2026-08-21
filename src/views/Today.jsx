import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Stats from '../components/Stats';
import FocusTask from '../components/FocusTask';
import TaskList from '../components/TaskList';
import QuickCapture from '../components/QuickCapture';
import { getTodayView, getAllTasks, exportTasks, importTasks } from '../api/api';

export default function Today() {
  const { t } = useTranslation();
  const [focusTask, setFocusTask] = useState(null);
  const [nextTasks, setNextTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today');
  const [refreshKey, setRefreshKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        setLoading(true);
        const data = await getTodayView();
        setFocusTask(data.focus);
        setNextTasks(data.next || []);
        setStats(data.stats);
        
        const allTasksData = await getAllTasks();
        setAllTasks(allTasksData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('today.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, [refreshKey, t]);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
    setFilter('today');
  };

  const handleTaskCompleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const buildBackupPackage = async () => {
    const payload = await exportTasks();
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `personal-reminder-os-backup-${stamp}.json`;
    const fileContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    return { fileName, fileContent, blob };
  };

  const handleExportSaveAs = async () => {
    try {
      setExporting(true);
      setError(null);
      setCopyNotice('');
      const { fileName, fileContent, blob } = await buildBackupPackage();

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: t('backup.jsonDescription'),
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setExportMenuOpen(false);
        return;
      }

      // Browser fallback: open JSON in a new tab so user can choose Save As destination manually.
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(fileContent)}`;
      const opened = window.open(dataUri, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // If popups are blocked, use direct download as last resort.
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
      setExportMenuOpen(false);
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error('Error exporting tasks:', err);
      setError(t('backup.failedExport'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportShare = async () => {
    try {
      setExporting(true);
      setError(null);
      setCopyNotice('');
      const { fileName, blob } = await buildBackupPackage();
      const backupFile = new File([blob], fileName, { type: 'application/json' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [backupFile] })) {
        await navigator.share({
          title: t('backup.shareTitle'),
          text: t('backup.shareText'),
          files: [backupFile],
        });
        setExportMenuOpen(false);
        return;
      }

      setError(t('backup.shareNotSupported'));
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error('Error sharing backup:', err);
      setError(t('backup.failedShare'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCopy = async () => {
    try {
      setExporting(true);
      setError(null);
      const { fileContent } = await buildBackupPackage();
      await navigator.clipboard.writeText(fileContent);
      setCopyNotice(t('backup.copySuccess'));
      setExportMenuOpen(false);
    } catch (err) {
      console.error('Error copying backup:', err);
      setError(t('backup.copyNotSupported'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      const text = await file.text();
      const payload = JSON.parse(text);
      const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      await importTasks({ tasks, mode: 'merge' });
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Error importing tasks:', err);
      setError(t('backup.failedImport'));
    } finally {
      event.target.value = '';
      setImporting(false);
    }
  };

  const scrollToQuickCapture = () => {
    const quickCaptureSection = document.getElementById('quick-capture');
    if (quickCaptureSection) {
      quickCaptureSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getFilteredTasks = () => {
    const now = new Date();
    
    switch (filter) {
      case 'completed':
        return allTasks.filter(t => t.status === 'completed');
      case 'archived':
        return allTasks.filter(t => t.status === 'archived');
      case 'overdue':
        return allTasks.filter(t => 
          t.status === 'pending' && t.due_at && new Date(t.due_at) < now
        );
      case 'all':
        return allTasks.filter(t => t.status === 'pending');
      case 'today':
      default:
        return allTasks.filter(t => {
          if (t.status !== 'pending') return false;
          if (!t.due_at) return true;
          
          const dueDate = new Date(t.due_at);
          const today = new Date();
          return dueDate.toDateString() === today.toDateString();
        });
    }
  };

  if (loading) {
    return <div className="loading-container">{t('app.loading')}</div>;
  }

  const filteredTasks = getFilteredTasks();
  const showFocusSection = filter === 'today' || filter === 'all' || filter === 'overdue';

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}
        
        {/* Filter navigation */}
        <div className="filter-nav">
          <button 
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            {t('today.filters.today')}
          </button>
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('today.filters.all')}
          </button>
          <button 
            className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilter('overdue')}
          >
            {t('today.filters.overdue')}
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            {t('today.filters.completed')}
          </button>
          <button 
            className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
            onClick={() => setFilter('archived')}
          >
            {t('today.filters.archived')}
          </button>
        </div>

        <section className="backup-tools">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setCopyNotice('');
              setExportMenuOpen(true);
            }}
          >
            {t('backup.export')}
          </button>
          <label className="btn btn-secondary backup-import-btn">
            {importing ? t('backup.importing') : t('backup.import')}
            <input type="file" accept="application/json" onChange={handleImportFile} disabled={importing} />
          </label>
        </section>
        {copyNotice && <div className="success-banner">{copyNotice}</div>}
        
        <Stats stats={stats} />
        
        {showFocusSection && focusTask ? (
          <FocusTask task={focusTask} onCompleted={handleTaskCompleted} />
        ) : null}
        
        {showFocusSection && !focusTask && filter === 'today' && (
          <div className="empty-state">
            <p>{t('today.noPendingToday')}</p>
          </div>
        )}
        
        {!showFocusSection && filteredTasks.length === 0 && (
          <div className="empty-state">
            <p>{t('today.noTasksForFilter', { filter: t(`today.filters.${filter}`) })}</p>
          </div>
        )}
        
        {showFocusSection && (
          <section className="next-section">
            <h2>{t('today.next')}</h2>
            {nextTasks.length > 0 ? (
              <TaskList 
                tasks={nextTasks} 
                onTaskCompleted={handleTaskCompleted}
                showDelete={false}
              />
            ) : (
              <p className="empty-text">{t('today.noMoreTasks')}</p>
            )}
          </section>
        )}

        {!showFocusSection && filteredTasks.length > 0 && (
          <section className="filtered-section">
            <h2>{t(`today.filters.${filter}`)}</h2>
            <TaskList 
              tasks={filteredTasks} 
              onTaskCompleted={handleTaskCompleted}
              showDelete={filter === 'completed' || filter === 'archived'}
            />
          </section>
        )}
        
        {(filter === 'today' || filter === 'all') && (
          <div id="quick-capture">
            <QuickCapture onTaskCreated={handleTaskCreated} />
          </div>
        )}
      </main>

      <nav className="mobile-quick-actions" aria-label="Quick actions">
        <button
          className={`mobile-action-btn ${filter === 'today' ? 'active' : ''}`}
          onClick={() => setFilter('today')}
        >
          {t('today.filters.today')}
        </button>
        <button
          className={`mobile-action-btn ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          {t('today.filters.overdue')}
        </button>
        <button
          className={`mobile-action-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          {t('mobile.done')}
        </button>
        <button
          className="mobile-action-btn mobile-action-primary"
          onClick={() => {
            setFilter('today');
            scrollToQuickCapture();
          }}
        >
          {t('mobile.add')}
        </button>
      </nav>

      {exportMenuOpen && (
        <>
          <div className="confirm-overlay" onClick={() => setExportMenuOpen(false)} />
          <div className="confirm-dialog export-dialog" role="dialog" aria-modal="true" aria-label={t('backup.exportDialogTitle')}>
            <h3>{t('backup.exportDialogTitle')}</h3>
            <p>{t('backup.exportDialogText')}</p>
            <div className="export-actions-grid">
              <button className="btn btn-primary" onClick={handleExportSaveAs} disabled={exporting}>
                {exporting ? t('backup.working') : t('backup.saveAs')}
              </button>
              <button className="btn btn-secondary" onClick={handleExportShare} disabled={exporting}>
                {t('backup.share')}
              </button>
              <button className="btn btn-secondary" onClick={handleExportCopy} disabled={exporting}>
                {t('backup.copyJson')}
              </button>
            </div>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setExportMenuOpen(false)} disabled={exporting}>
                {t('header.cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}