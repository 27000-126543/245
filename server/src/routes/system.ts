const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/departments', (req, res) => {
  try {
    const departments = query('SELECT * FROM departments');
    res.json({ code: 200, data: departments });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/departments', (req, res) => {
  try {
    const { name, description } = req.body;
    const id = String(Date.now());
    execute('INSERT INTO departments VALUES (?, ?, ?)', [id, name, description]);
    res.json({ code: 200, message: '创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/departments/:id', (req, res) => {
  try {
    const { name, description } = req.body;
    execute('UPDATE departments SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.delete('/departments/:id', (req, res) => {
  try {
    execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/court-rooms', (req, res) => {
  try {
    const rooms = query('SELECT * FROM court_rooms');
    res.json({ code: 200, data: rooms });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/court-rooms', (req, res) => {
  try {
    const { name, location, capacity, equipment } = req.body;
    const id = String(Date.now());
    execute('INSERT INTO court_rooms VALUES (?, ?, ?, ?, ?)', [id, name, location, capacity, JSON.stringify(equipment || [])]);
    res.json({ code: 200, message: '创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/notifications', (req, res) => {
  try {
    const { userId, unreadOnly } = req.query;
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    
    if (userId) { sql += ' AND (userId = ? OR userId IS NULL)'; params.push(userId); }
    if (unreadOnly === 'true') { sql += ' AND read = 0'; }
    
    sql += ' ORDER BY createdAt DESC LIMIT 50';
    
    const notifications = query(sql, params);
    res.json({ code: 200, data: notifications });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/notifications/:id/read', (req, res) => {
  try {
    execute('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '标记已读成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/rules', (req, res) => {
  try {
    const rules = query('SELECT * FROM system_rules');
    const ruleMap = {};
    rules.forEach(r => { ruleMap[r.key] = r.value; });
    res.json({ code: 200, data: ruleMap });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/rules', (req, res) => {
  try {
    const rules = req.body;
    Object.entries(rules).forEach(([key, value]) => {
      execute('UPDATE system_rules SET value = ? WHERE key = ?', [String(value), key]);
    });
    res.json({ code: 200, message: '规则更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
