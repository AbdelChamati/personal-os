import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Stats from '../components/Stats';
import FocusTask from '../components/FocusTask';
import TaskList from '../components/TaskList';
import QuickCapture from '../components/QuickCapture';
import { getTodayView, getAllTasks } from '../api/api';

export default function Today() {
  const [focusTask, setFocusTask] = useState(null);
  const [nextTasks, setNextTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today');
  const [refreshKey, setRefreshKey] = useState(0);

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
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, [refreshKey]);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
    setFilter('today');
  };

  const handleTaskCompleted = () => {
    setRefreshKey(prev => prev + 1);
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
    return <div className="loading-container">Loading...</div>;
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
            Today
          </button>
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
            onClick={() => setFilter('archived')}
          >
            Archived
          </button>
        </div>
        
        <Stats stats={stats} />
        
        {showFocusSection && focusTask ? (
          <FocusTask task={focusTask} onCompleted={handleTaskCompleted} />
        ) : null}
        
        {showFocusSection && !focusTask && filter === 'today' && (
          <div className="empty-state">
            <p>No pending tasks for today. Great work!</p>
          </div>
        )}
        
        {!showFocusSection && filteredTasks.length === 0 && (
          <div className="empty-state">
            <p>No {filter} tasks</p>
          </div>
        )}
        
        {showFocusSection && (
          <section className="next-section">
            <h2>NEXT</h2>
            {nextTasks.length > 0 ? (
              <TaskList 
                tasks={nextTasks} 
                onTaskCompleted={handleTaskCompleted}
                showDelete={false}
              />
            ) : (
              <p className="empty-text">No more tasks</p>
            )}
          </section>
        )}

        {!showFocusSection && filteredTasks.length > 0 && (
          <section className="filtered-section">
            <h2>{filter.charAt(0).toUpperCase() + filter.slice(1)}</h2>
            <TaskList 
              tasks={filteredTasks} 
              onTaskCompleted={handleTaskCompleted}
              showDelete={filter === 'completed' || filter === 'archived'}
            />
          </section>
        )}
        
        {(filter === 'today' || filter === 'all') && (
          <QuickCapture onTaskCreated={handleTaskCreated} />
        )}
      </main>
    </div>
  );
}