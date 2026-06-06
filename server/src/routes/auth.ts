import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, department, phone, email FROM users').all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { username, name, role, department, phone, email, password = '123456' } = req.body;
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, username, name, role, department, phone, email, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, name, role, department, phone, email, password);

    const user = db.prepare('SELECT id, username, name, role, department, phone, email FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, phone, email, password } = req.body;
    
    let query = 'UPDATE users SET name = ?, role = ?, department = ?, phone = ?, email = ?';
    const params = [name, role, department, phone, email];
    
    if (password) {
      query += ', password = ?';
      params.push(password);
    }
    query += ' WHERE id = ?';
    params.push(id);
    
    db.prepare(query).run(...params);
    const user = db.prepare('SELECT id, username, name, role, department, phone, email FROM users WHERE id = ?').get(id);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
