import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../api/authApi';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, overdue
  const [sortBy, setSortBy] = useState('priority'); // priority, dueDate, created
  const [openTaskFormSignal, setOpenTaskFormSignal] = useState(0);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await authApi.getAllTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await authApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleTaskCreated = async (newTask) => {
    setTasks([newTask, ...tasks]);
    await fetchStats();
  };

  const handleTaskUpdated = async (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    await fetchStats();
  };

  const handleTaskDeleted = async (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await fetchStats();
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    } else if (filter === 'overdue') {
      const now = new Date();
      filtered = filtered.filter((task) => task.status === 'pending' && task.due_at && new Date(task.due_at) < now);
    }

    return filtered;
  };

  const getSortedTasks = (tasksToSort) => {
    const sorted = [...tasksToSort];

    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'dueDate') {
      sorted.sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at) - new Date(b.due_at);
      });
    } else if (sortBy === 'created') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return sorted;
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-container">
        {/* Stats Bar */}
        {stats && (
          <div className="stats-bar">
            <button type="button" className={`stat-card ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')} title={t('dashboard.showPending')}>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">{t('stats.pending')}</div>
            </button>
            <button type="button" className={`stat-card ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')} title={t('dashboard.showCompleted')}>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">{t('stats.completed')}</div>
            </button>
            <button type="button" className={`stat-card ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')} title={t('dashboard.showOverdue')}>
              <div className="stat-value">{stats.overdue}</div>
              <div className="stat-label">{t('stats.overdue')}</div>
            </button>
            <button type="button" className={`stat-card ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} title={t('dashboard.showAll')}>
              <div className="stat-value">{stats.planned_minutes}</div>
              <div className="stat-label">{t('stats.plannedMin')}</div>
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <TaskForm onTaskCreated={handleTaskCreated} openSignal={openTaskFormSignal} />

            <div className="filters-section">
              <h3>{t('header.today')}</h3>
              <div className="filter-group">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  {t('today.filters.all')}
                </button>
                <button
                  className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  {t('stats.pending')}
                </button>
                <button
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  {t('stats.completed')}
                </button>
                <button
                  className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                  onClick={() => setFilter('overdue')}
                >
                  {t('stats.overdue')}
                </button>
              </div>
            </div>

            <div className="sort-section">
              <h3>{t('dashboard.sortBy')}</h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="priority">{t('dashboard.priority')}</option>
                <option value="dueDate">{t('dashboard.dueDate')}</option>
                <option value="created">{t('dashboard.recentlyCreated')}</option>
              </select>
            </div>
          </aside>

          {/* Main Area */}
          <main className="main-content">
            {loading ? (
              <div className="loading">{t('dashboard.loadingTasks')}</div>
            ) : sortedTasks.length === 0 ? (
              <div className="empty-state">
                <h2>{t('dashboard.noTasks')}</h2>
                <p>{t('dashboard.noTasksHint')}</p>
              </div>
            ) : (
              <TaskList
                tasks={sortedTasks}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            )}
          </main>
        </div>
      </div>

      <nav className="mobile-action-bar" aria-label={t('dashboard.quickActions')}>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{t('today.filters.all')}</button>
        <button type="button" className={filter === 'overdue' ? 'active' : ''} onClick={() => setFilter('overdue')}>{t('today.filters.overdue')}</button>
        <button type="button" className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>{t('today.filters.completed')}</button>
        <button type="button" className="mobile-add-task" onClick={() => setOpenTaskFormSignal((signal) => signal + 1)}>{t('quickCapture.addTask')}</button>
      </nav>
    </div>
  );
}
