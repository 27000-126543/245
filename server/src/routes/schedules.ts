import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, judgeId, date, page = 1, pageSize = 50 } = req.query;
    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (judgeId) {
      query += ' AND judgeId = ?';
      params.push(judgeId);
    }
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    query += ' ORDER BY date ASC, startTime ASC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM schedules WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      items,
      total: countResult.total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    if (!schedule) {
      return res.status(404).json({ message: '排期不存在' });
    }
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseId, caseNumber, caseName, judgeId, judgeName,
      courtRoomId, courtRoomName, date, startTime, endTime, type,
    } = req.body;

    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    db.prepare(`
      INSERT INTO schedules (id, caseId, caseNumber, caseName, judgeId, judgeName,
        courtRoomId, courtRoomName, date, startTime, endTime, type, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseId, caseNumber, caseName, judgeId, judgeName,
      courtRoomId, courtRoomName, date, startTime, endTime, type || 'trial',
      'scheduled', createdAt
    );

    const newSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.status(201).json(newSchedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'date', 'startTime', 'endTime', 'courtRoomId', 'courtRoomName',
      'judgeId', 'judgeName', 'status', 'type',
    ];
    const updates: string[] = [];
    const params: any[] = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    res.json(updatedSchedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/check/conflicts', (req, res) => {
  try {
    const { date, startTime, endTime, courtRoomId, judgeId, excludeId } = req.query;
    
    let query = `
      SELECT * FROM schedules 
      WHERE date = ? 
        AND ((startTime < ? AND endTime > ?) OR (startTime >= ? AND startTime < ?))
        AND status != 'cancelled'
        AND status != 'completed'
    `;
    const params: any[] = [date, endTime, startTime, startTime, endTime];

    if (courtRoomId) {
      query += ' AND courtRoomId = ?';
      params.push(courtRoomId);
    }
    if (judgeId) {
      query += ' AND judgeId = ?';
      params.push(judgeId);
    }
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const conflicts = db.prepare(query).all(...params);
    
    res.json({
      hasConflict: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 
        ? `检测到 ${conflicts.length} 个时间冲突`
        : '无冲突，可以排期',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
