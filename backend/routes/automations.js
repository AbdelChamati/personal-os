import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';

const router = express.Router();

// GET all automations for authenticated user
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const automations = db.prepare('SELECT * FROM automations WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(automations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// GET single automation
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    res.json(automation);
  } catch (error) {
    console.error('Error fetching automation:', error);
    res.status(500).json({ error: 'Failed to fetch automation' });
  }
});

// GET automation runs
router.get('/:id/runs', (req, res) => {
  try {
    const db = getDatabase();
    
    // Verify automation belongs to user
    const automation = db.prepare('SELECT id FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    const runs = db.prepare('SELECT * FROM automation_runs WHERE automation_id = ? ORDER BY started_at DESC').all(req.params.id);
    res.json(runs);
  } catch (error) {
    console.error('Error fetching automation runs:', error);
    res.status(500).json({ error: 'Failed to fetch automation runs' });
  }
});

// POST create automation
router.post('/', (req, res) => {
  try {
    const { name, task_id, provider, action, configuration, requires_approval } = req.body;
    
    if (!name || !provider || !action) {
      return res.status(400).json({ error: 'name, provider, and action are required' });
    }
    
    const db = getDatabase();
    
    // If task_id provided, verify it belongs to user
    if (task_id) {
      const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, req.user.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }
    
    const automationId = uuidv4();
    
    db.prepare(`
      INSERT INTO automations (id, user_id, name, task_id, provider, action, configuration, requires_approval, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      automationId,
      req.user.id,
      name,
      task_id || null,
      provider,
      action,
      configuration || null,
      requires_approval ? 1 : 0,
      1,
      new Date().toISOString()
    );
    
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(automationId, req.user.id);
    res.status(201).json(automation);
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// PATCH update automation
router.patch('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    const { name, task_id, provider, action, configuration, requires_approval, enabled } = req.body;
    
    // If task_id is changing, verify new task belongs to user
    if (task_id && task_id !== automation.task_id) {
      const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, req.user.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }
    
    db.prepare(`
      UPDATE automations
      SET name = ?, task_id = ?, provider = ?, action = ?, configuration = ?, requires_approval = ?, enabled = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name !== undefined ? name : automation.name,
      task_id !== undefined ? task_id : automation.task_id,
      provider !== undefined ? provider : automation.provider,
      action !== undefined ? action : automation.action,
      configuration !== undefined ? configuration : automation.configuration,
      requires_approval !== undefined ? (requires_approval ? 1 : 0) : automation.requires_approval,
      enabled !== undefined ? (enabled ? 1 : 0) : automation.enabled,
      req.params.id,
      req.user.id
    );
    
    const updated = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating automation:', error);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// DELETE automation
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const automation = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    db.prepare('DELETE FROM automations WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation:', error);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

export default router;
