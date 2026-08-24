import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { calculateTaskScore } from '../services/taskScoring.js';
import { createNextOccurrence } from '../services/recurrence.js';

const router = express.Router();

const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_STATUSES = new Set(['pending', 'completed', 'archived']);
const VALID_CATEGORIES = new Set(['Personal', 'Professional', 'Family', 'Home', 'Finance', 'Shopping', 'Health', 'Other']);

// GET all tasks for authenticated user
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET export tasks backup
router.get('/export', (req, res) => {
  try {
    const db = getDatabase();
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({
      version: 1,
      exported_at: new Date().toISOString(),
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

// POST import tasks backup
router.post('/import', (req, res) => {
  try {
    const db = getDatabase();
    const { tasks, mode = 'merge' } = req.body || {};

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'tasks array is required' });
    }

    if (!['merge', 'replace'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be merge or replace' });
    }

    if (mode === 'replace') {
      db.prepare('DELETE FROM tasks WHERE user_id = ?').run(req.user.id);
    }

    let imported = 0;
    let updated = 0;

    tasks.forEach((inputTask) => {
      if (!inputTask || typeof inputTask !== 'object' || !inputTask.title) {
        return;
      }

      const id = inputTask.id || uuidv4();
      const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);

      const normalized = {
        id,
        user_id: req.user.id,
        title: String(inputTask.title).trim(),
        description: inputTask.description || null,
        category: VALID_CATEGORIES.has(inputTask.category) ? inputTask.category : 'Other',
        priority: VALID_PRIORITIES.has(inputTask.priority) ? inputTask.priority : 'medium',
        status: VALID_STATUSES.has(inputTask.status) ? inputTask.status : 'pending',
        estimated_minutes: Number.isInteger(inputTask.estimated_minutes) ? inputTask.estimated_minutes : null,
        due_at: inputTask.due_at || null,
        expires_at: inputTask.expires_at || null,
        recurrence_rule: inputTask.recurrence_rule || null,
        created_at: inputTask.created_at || new Date().toISOString(),
        completed_at: inputTask.completed_at || null,
        escalation_level: Number.isInteger(inputTask.escalation_level) ? inputTask.escalation_level : 0,
      };

      if (!normalized.title) {
        return;
      }

      if (existing) {
        db.prepare(`
          UPDATE tasks
          SET title = ?, description = ?, category = ?, priority = ?, status = ?, estimated_minutes = ?, due_at = ?, expires_at = ?, recurrence_rule = ?, created_at = ?, completed_at = ?, escalation_level = ?
          WHERE id = ? AND user_id = ?
        `).run(
          normalized.title,
          normalized.description,
          normalized.category,
          normalized.priority,
          normalized.status,
          normalized.estimated_minutes,
          normalized.due_at,
          normalized.expires_at,
          normalized.recurrence_rule,
          normalized.created_at,
          normalized.completed_at,
          normalized.escalation_level,
          normalized.id,
          req.user.id
        );
        updated += 1;
      } else {
        db.prepare(`
          INSERT INTO tasks (id, user_id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          normalized.id,
          normalized.user_id,
          normalized.title,
          normalized.description,
          normalized.category,
          normalized.priority,
          normalized.status,
          normalized.estimated_minutes,
          normalized.due_at,
          normalized.expires_at,
          normalized.recurrence_rule,
          normalized.created_at,
          normalized.completed_at,
          normalized.escalation_level
        );
        imported += 1;
      }
    });

    res.json({
      ok: true,
      mode,
      imported,
      updated,
      total: imported + updated,
    });
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
});

// GET single task
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
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
    
    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    if (category && !VALID_CATEGORIES.has(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const db = getDatabase();
    const now = new Date().toISOString();
    const taskId = uuidv4();
    
    db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      req.user.id,
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
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.user.id);
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
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const { title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, escalation_level } = req.body;
    
    // Validation
    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (category && !VALID_CATEGORIES.has(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const now = new Date().toISOString();
    const completedAt = status === 'completed' && task.status !== 'completed' ? now : task.completed_at;
    
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, category = ?, priority = ?, status = ?, estimated_minutes = ?, due_at = ?, expires_at = ?, recurrence_rule = ?, escalation_level = ?, completed_at = ?
      WHERE id = ? AND user_id = ?
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
      req.params.id,
      req.user.id
    );
    
    // Handle recurring tasks
    if (status === 'completed' && task.recurrence_rule) {
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
      createNextOccurrence(updatedTask);
    }
    
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
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
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
