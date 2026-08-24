import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../api/authApi';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [sortBy, setSortBy] = useState('priority'); // priority, dueDate, created

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
            <div className="stat-card">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.planned_minutes}</div>
              <div className="stat-label">Minutes Planned</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <TaskForm onTaskCreated={handleTaskCreated} />

            <div className="filters-section">
              <h3>Filter</h3>
              <div className="filter-group">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Tasks
                </button>
                <button
                  className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="sort-section">
              <h3>Sort By</h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="created">Recently Created</option>
              </select>
            </div>
          </aside>

          {/* Main Area */}
          <main className="main-content">
            {loading ? (
              <div className="loading">Loading tasks...</div>
            ) : sortedTasks.length === 0 ? (
              <div className="empty-state">
                <h2>No tasks yet</h2>
                <p>Create your first task to get started!</p>
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
    </div>
  );
}
