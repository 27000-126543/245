import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM trial_records WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR caseName LIKE ? OR judgeName LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY createdAt DESC';
  const records = db.prepare(sql).all(...params).map((r: any) => ({
    ...r,
    participants: r.participants ? JSON.parse(r.participants) : [],
  }));
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(req.params.id) as any;
  if (!record) return res.status(404).json({ message: '庭审记录不存在' });
  
  record.participants = record.participants ? JSON.parse(record.participants) : [];
  res.json(record);
});

router.post('/', (req, res) => {
  const {
    caseId, caseNumber, caseName, scheduleId, judgeName,
    courtRoomName, startTime,
  } = req.body;

  const id = String(Date.now());
  const createdAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO trial_records (id, caseId, caseNumber, caseName, scheduleId, judgeName,
      courtRoomName, startTime, status, participants, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ongoing', '[]', ?)
  `).run(
    id, caseId, caseNumber, caseName, scheduleId, judgeName,
    courtRoomName, startTime, createdAt
  );

  const newRecord = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
  newRecord.participants = [];
  res.status(201).json(newRecord);
});

router.put('/:id', (req, res) => {
  const { status, endTime, duration, transcript, videoUrl } = req.body;
  
  db.prepare(`
    UPDATE trial_records SET status = ?, endTime = ?, duration = ?, transcript = ?, videoUrl = ?
    WHERE id = ?
  `).run(status, endTime, duration, transcript, videoUrl, req.params.id);

  const record = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(req.params.id) as any;
  record.participants = record.participants ? JSON.parse(record.participants) : [];
  res.json(record);
});

router.post('/:id/end', (req, res) => {
  const { endTime, duration } = req.body;
  
  db.prepare(`
    UPDATE trial_records SET status = 'completed', endTime = ?, duration = ?
    WHERE id = ?
  `).run(endTime, duration, req.params.id);

  setTimeout(() => {
    db.prepare(`
      UPDATE trial_records SET status = 'processing'
      WHERE id = ?
    `).run(req.params.id);
  }, 1000);

  setTimeout(() => {
    db.prepare(`
      UPDATE trial_records SET status = 'completed', transcript = ?
      WHERE id = ?
    `).run('书记员：现在宣布法庭纪律...\n审判长：现在开庭...', req.params.id);
  }, 3000);

  const record = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(req.params.id) as any;
  record.participants = record.participants ? JSON.parse(record.participants) : [];
  res.json(record);
});

export default router;
