const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = queryOne('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.departmentName,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = query('SELECT id, username, name, role, departmentId, departmentName, phone, createdAt FROM users');
    res.json({ code: 200, data: users });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/users/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id, username, name, role, departmentId, departmentName, phone, createdAt FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    res.json({ code: 200, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { username, password, name, role, departmentId, departmentName, phone } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    execute('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, username, password, name, role, departmentId, departmentName, phone, createdAt]);
    res.json({ code: 200, message: '创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const { name, role, departmentId, departmentName, phone } = req.body;
    execute('UPDATE users SET name = ?, role = ?, departmentId = ?, departmentName = ?, phone = ? WHERE id = ?', [name, role, departmentId, departmentName, phone, req.params.id]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
