import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';

const router = express.Router();

// GET all automations
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const automations = db.prepare('SELECT * FROM automations ORDER BY created_at DESC').all();
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
    const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id);
    
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
    const automationId = uuidv4();
    
    db.prepare(`
      INSERT INTO automations (id, name, task_id, provider, action, configuration, requires_approval, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      automationId,
      name,
      task_id || null,
      provider,
      action,
      configuration || null,
      requires_approval ? 1 : 0,
      1,
      new Date().toISOString()
    );
    
    const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(automationId);
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
    const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    const { name, task_id, provider, action, configuration, requires_approval, enabled } = req.body;
    
    db.prepare(`
      UPDATE automations
      SET name = ?, task_id = ?, provider = ?, action = ?, configuration = ?, requires_approval = ?, enabled = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : automation.name,
      task_id !== undefined ? task_id : automation.task_id,
      provider !== undefined ? provider : automation.provider,
      action !== undefined ? action : automation.action,
      configuration !== undefined ? configuration : automation.configuration,
      requires_approval !== undefined ? (requires_approval ? 1 : 0) : automation.requires_approval,
      enabled !== undefined ? (enabled ? 1 : 0) : automation.enabled,
      req.params.id
    );
    
    const updated = db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id);
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
    const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    db.prepare('DELETE FROM automations WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation:', error);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

export default router;