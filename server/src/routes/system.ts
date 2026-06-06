import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/departments', (req, res) => {
  const departments = db.prepare('SELECT * FROM departments').all();
  res.json(departments);
});

router.post('/departments', (req, res) => {
  const { name, code } = req.body;
  const id = String(Date.now());
  
  db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)')
    .run(id, name, code);
  
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  res.status(201).json(dept);
});

router.put('/departments/:id', (req, res) => {
  const { name, code } = req.body;
  
  db.prepare('UPDATE departments SET name = ?, code = ? WHERE id = ?')
    .run(name, code, req.params.id);
  
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  res.json(dept);
});

router.delete('/departments/:id', (req, res) => {
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/court-rooms', (req, res) => {
  const courtRooms = db.prepare('SELECT * FROM court_rooms').all().map((c: any) => ({
    ...c,
    equipment: JSON.parse(c.equipment),
  }));
  res.json(courtRooms);
});

router.post('/court-rooms', (req, res) => {
  const { name, location, capacity, equipment } = req.body;
  const id = String(Date.now());
  
  db.prepare(`
    INSERT INTO court_rooms (id, name, location, capacity, equipment)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, location, capacity, JSON.stringify(equipment || []));
  
  const room = db.prepare('SELECT * FROM court_rooms WHERE id = ?').get(id) as any;
  room.equipment = JSON.parse(room.equipment);
  res.status(201).json(room);
});

router.put('/court-rooms/:id', (req, res) => {
  const { name, location, capacity, equipment } = req.body;
  
  db.prepare(`
    UPDATE court_rooms SET name = ?, location = ?, capacity = ?, equipment = ?
    WHERE id = ?
  `).run(name, location, capacity, JSON.stringify(equipment || []), req.params.id);
  
  const room = db.prepare('SELECT * FROM court_rooms WHERE id = ?').get(req.params.id) as any;
  room.equipment = JSON.parse(room.equipment);
  res.json(room);
});

router.delete('/court-rooms/:id', (req, res) => {
  db.prepare('DELETE FROM court_rooms WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/notifications', (req, res) => {
  const { userId } = req.query;
  let sql = 'SELECT * FROM notifications';
  const params: any[] = [];
  
  if (userId) {
    sql += ' WHERE userId = ? OR userId IS NULL';
    params.push(userId);
  }
  
  sql += ' ORDER BY createdAt DESC LIMIT 50';
  const notifications = db.prepare(sql).all(...params);
  res.json(notifications);
});

router.post('/notifications/read/:id', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '标记已读' });
});

router.post('/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    db.prepare('UPDATE notifications SET read = 1 WHERE userId = ? OR userId IS NULL').run(userId);
  } else {
    db.prepare('UPDATE notifications SET read = 1').run();
  }
  res.json({ message: '全部标记已读' });
});

router.get('/rules', (req, res) => {
  res.json([
    { id: '1', name: '分案规则', description: 'AI智能分案规则', enabled: true },
    { id: '2', name: '审限预警规则', description: '提前15天预警', enabled: true },
    { id: '3', name: '文书审批规则', description: '三级审批流程', enabled: true },
    { id: '4', name: '送达提醒规则', description: '送达状态实时推送', enabled: true },
    { id: '5', name: '自动越级规则', description: '审批超48小时自动越级', enabled: true },
  ]);
});

router.put('/rules/:id', (req, res) => {
  const { enabled } = req.body;
  res.json({ id: req.params.id, enabled, message: '更新成功' });
});

export default router;
