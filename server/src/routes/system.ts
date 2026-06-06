import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/departments', (req, res) => {
  try {
    const departments = db.prepare('SELECT * FROM departments').all();
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/departments', (req, res) => {
  try {
    const { name, code } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(id, name, code);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/departments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    db.prepare('UPDATE departments SET name = ?, code = ? WHERE id = ?').run(name, code, id);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/departments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/court-rooms', (req, res) => {
  try {
    const courtRooms = db.prepare('SELECT * FROM court_rooms').all().map((room: any) => ({
      ...room,
      equipment: room.equipment ? JSON.parse(room.equipment) : [],
    }));
    res.json(courtRooms);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/court-rooms', (req, res) => {
  try {
    const { name, location, capacity, equipment } = req.body;
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO court_rooms (id, name, location, capacity, equipment)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, location, capacity, JSON.stringify(equipment || []));
    
    const room = db.prepare('SELECT * FROM court_rooms WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...room,
      equipment: room.equipment ? JSON.parse(room.equipment) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/court-rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, equipment } = req.body;
    
    let query = 'UPDATE court_rooms SET ';
    const params: any[] = [];
    const updates: string[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(capacity);
    }
    if (equipment !== undefined) {
      updates.push('equipment = ?');
      params.push(JSON.stringify(equipment));
    }
    
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    db.prepare(query).run(...params);
    
    const room = db.prepare('SELECT * FROM court_rooms WHERE id = ?').get(id) as any;
    res.json({
      ...room,
      equipment: room.equipment ? JSON.parse(room.equipment) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/court-rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM court_rooms WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/notifications', (req, res) => {
  try {
    const { userId } = req.query;
    let query = 'SELECT * FROM notifications';
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE userId = ? OR userId IS NULL';
      params.push(userId);
    }
    
    query += ' ORDER BY createdAt DESC LIMIT 50';
    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/notifications/read/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/notifications/read-all', (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      db.prepare('UPDATE notifications SET read = 1 WHERE userId = ? OR userId IS NULL').run(userId);
    } else {
      db.prepare('UPDATE notifications SET read = 1').run();
    }
    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rules', (req, res) => {
  try {
    const rules = [
      { id: '1', key: 'trialDeadlineDays', name: '案件审理期限（天）', value: 90, description: '民事案件普通审理期限' },
      { id: '2', key: 'warningDays', name: '审限预警天数', value: 15, description: '距离到期多少天开始预警' },
      { id: '3', key: 'approvalLevel1', name: '一级审批权限（元）', value: 100000, description: '庭长审批金额上限' },
      { id: '4', key: 'approvalLevel2', name: '二级审批权限（元）', value: 500000, description: '院长审批金额上限' },
      { id: '5', key: 'escalationHours', name: '审批越级时限（小时）', value: 48, description: '超过多少小时自动越级' },
      { id: '6', key: 'autoQueue', name: '自动排期排队', value: true, description: '是否启用自动排期队列' },
      { id: '7', key: 'serviceRetryCount', name: '送达重试次数', value: 3, description: '电子送达失败重试次数' },
    ];
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    res.json({
      id,
      key: id,
      value,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
