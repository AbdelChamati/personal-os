import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';

const router = express.Router();

// GET all reminders for authenticated user
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY scheduled_at DESC').all(req.user.id);
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// GET reminders for a specific task
router.get('/task/:taskId', (req, res) => {
  try {
    const db = getDatabase();
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? AND task_id = ? ORDER BY scheduled_at DESC').all(req.user.id, req.params.taskId);
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// POST create reminder
router.post('/', (req, res) => {
  try {
    const { task_id, scheduled_at, channel } = req.body;
    
    if (!task_id || !scheduled_at) {
      return res.status(400).json({ error: 'task_id and scheduled_at are required' });
    }
    
    const db = getDatabase();
    
    // Verify task belongs to user
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const reminderId = uuidv4();
    
    db.prepare(`
      INSERT INTO reminders (id, user_id, task_id, scheduled_at, sent_at, channel, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reminderId, req.user.id, task_id, scheduled_at, null, channel || 'in-app', 'pending');
    
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(reminderId, req.user.id);
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// PATCH update reminder
router.patch('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const { scheduled_at, sent_at, channel, status } = req.body;
    
    db.prepare(`
      UPDATE reminders
      SET scheduled_at = ?, sent_at = ?, channel = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(
      scheduled_at !== undefined ? scheduled_at : reminder.scheduled_at,
      sent_at !== undefined ? sent_at : reminder.sent_at,
      channel !== undefined ? channel : reminder.channel,
      status !== undefined ? status : reminder.status,
      req.params.id,
      req.user.id
    );
    
    const updated = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// DELETE reminder
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
