import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, date, search } = req.query;
  let sql = 'SELECT * FROM schedules WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR caseName LIKE ? OR judgeName LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY date DESC, startTime ASC';
  const schedules = db.prepare(sql).all(...params);
  res.json(schedules);
});

router.get('/:id', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ message: '排期不存在' });
  res.json(schedule);
});

router.post('/', (req, res) => {
  const {
    caseId, caseNumber, caseName, judgeId, judgeName,
    courtRoomId, courtRoomName, date, startTime, endTime, type,
  } = req.body;

  const conflicts: string[] = [];
  const existing = db.prepare(`
    SELECT * FROM schedules 
    WHERE date = ? AND status != 'cancelled'
  `).all(date) as any[];

  existing.forEach(s => {
    if (s.judgeId === judgeId) {
      conflicts.push(`法官时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
    }
    if (s.courtRoomId === courtRoomId) {
      conflicts.push(`法庭时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
    }
  });

  const id = String(Date.now());
  const status = conflicts.length > 0 ? 'queued' : 'scheduled';
  const createdAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO schedules (id, caseId, caseNumber, caseName, judgeId, judgeName,
      courtRoomId, courtRoomName, date, startTime, endTime, type, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, caseId, caseNumber, caseName, judgeId, judgeName,
    courtRoomId, courtRoomName, date, startTime, endTime, type, status, createdAt
  );

  const newSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
  res.status(201).json({ schedule: newSchedule, conflicts });
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  
  db.prepare('UPDATE schedules SET status = ? WHERE id = ?')
    .run(status, req.params.id);

  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  res.json(schedule);
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE schedules SET status = ? WHERE id = ?')
    .run('cancelled', req.params.id);
  res.json({ message: '排期已取消' });
});

router.get('/check/conflicts', (req, res) => {
  const { date, judgeId, courtRoomId } = req.query;
  
  const existing = db.prepare(`
    SELECT * FROM schedules 
    WHERE date = ? AND status != 'cancelled'
  `).all(date) as any[];

  const conflicts: string[] = [];
  existing.forEach(s => {
    if (s.judgeId === judgeId) {
      conflicts.push(`法官时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
    }
    if (s.courtRoomId === courtRoomId) {
      conflicts.push(`法庭时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
    }
  });

  res.json({ conflicts, hasConflict: conflicts.length > 0 });
});

export default router;
