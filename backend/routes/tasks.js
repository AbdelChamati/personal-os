import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { calculateTaskScore } from '../services/taskScoring.js';
import { createNextOccurrence } from '../services/recurrence.js';

const router = express.Router();

// GET all tasks
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET single task
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST create task
router.post('/', (req, res) => {
  try {
    const { title, description, category, priority, estimated_minutes, due_at, expires_at, recurrence_rule } = req.body;
    
    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    if (category && !['Personal', 'Professional', 'Family', 'Home', 'Finance', 'Shopping', 'Health', 'Other'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const db = getDatabase();
    const now = new Date().toISOString();
    const taskId = uuidv4();
    
    db.prepare(`
      INSERT INTO tasks (id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      title.trim(),
      description || null,
      category || 'Other',
      priority || 'medium',
      'pending',
      estimated_minutes || null,
      due_at || null,
      expires_at || null,
      recurrence_rule || null,
      now,
      null,
      0
    );
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH update task
router.patch('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const { title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, escalation_level } = req.body;
    
    // Validation
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    if (status && !['pending', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (category && !['Personal', 'Professional', 'Family', 'Home', 'Finance', 'Shopping', 'Health', 'Other'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const now = new Date().toISOString();
    const completedAt = status === 'completed' && task.status !== 'completed' ? now : task.completed_at;
    
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, category = ?, priority = ?, status = ?, estimated_minutes = ?, due_at = ?, expires_at = ?, recurrence_rule = ?, escalation_level = ?, completed_at = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : task.title,
      description !== undefined ? description : task.description,
      category !== undefined ? category : task.category,
      priority !== undefined ? priority : task.priority,
      status !== undefined ? status : task.status,
      estimated_minutes !== undefined ? estimated_minutes : task.estimated_minutes,
      due_at !== undefined ? due_at : task.due_at,
      expires_at !== undefined ? expires_at : task.expires_at,
      recurrence_rule !== undefined ? recurrence_rule : task.recurrence_rule,
      escalation_level !== undefined ? escalation_level : task.escalation_level,
      completedAt,
      req.params.id
    );
    
    // Handle recurring tasks
    if (status === 'completed' && task.recurrence_rule) {
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      createNextOccurrence(updatedTask);
    }
    
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE task
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;