import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token: `mock-token-${Date.now()}` });
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, department, phone, email FROM users').all();
  res.json(users);
});

router.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, department, phone, email FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json(user);
});

router.post('/users', (req, res) => {
  const { username, name, role, department, phone, email } = req.body;
  const id = String(Date.now());
  db.prepare(`
    INSERT INTO users (id, username, name, role, department, phone, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, '123456')
  `).run(id, username, name, role, department, phone, email);
  
  const user = db.prepare('SELECT id, username, name, role, department, phone, email FROM users WHERE id = ?').get(id);
  res.status(201).json(user);
});

router.put('/users/:id', (req, res) => {
  const { name, role, department, phone, email } = req.body;
  db.prepare(`
    UPDATE users SET name = ?, role = ?, department = ?, phone = ?, email = ?
    WHERE id = ?
  `).run(name, role, department, phone, email, req.params.id);
  
  const user = db.prepare('SELECT id, username, name, role, department, phone, email FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
