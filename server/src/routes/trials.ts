import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, judgeName, page = 1, pageSize = 10 } = req.query;
    let query = 'SELECT * FROM trial_records WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (caseId) {
      query += ' AND caseId = ?';
      params.push(caseId);
    }
    if (judgeName) {
      query += ' AND judgeName LIKE ?';
      params.push(`%${judgeName}%`);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params).map((item: any) => ({
      ...item,
      participants: item.participants ? JSON.parse(item.participants) : [],
    }));
    
    let countQuery = 'SELECT COUNT(*) as total FROM trial_records WHERE 1=1';
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
    const record = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
    if (!record) {
      return res.status(404).json({ message: '庭审记录不存在' });
    }
    res.json({
      ...record,
      participants: record.participants ? JSON.parse(record.participants) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseId, caseNumber, caseName, scheduleId, judgeName,
      courtRoomName, startTime, participants,
    } = req.body;

    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    db.prepare(`
      INSERT INTO trial_records (id, caseId, caseNumber, caseName, scheduleId, judgeName,
        courtRoomName, startTime, status, participants, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseId, caseNumber, caseName, scheduleId, judgeName,
      courtRoomName, startTime, 'ongoing',
      participants ? JSON.stringify(participants) : '[]',
      createdAt
    );

    const newRecord = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...newRecord,
      participants: newRecord.participants ? JSON.parse(newRecord.participants) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'endTime', 'duration', 'videoUrl', 'transcript', 'status',
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
      db.prepare(`UPDATE trial_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedRecord = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
    res.json({
      ...updatedRecord,
      participants: updatedRecord.participants ? JSON.parse(updatedRecord.participants) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/end', (req, res) => {
  try {
    const { id } = req.params;
    const record = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
    if (!record) {
      return res.status(404).json({ message: '庭审记录不存在' });
    }

    const endTime = dayjs().format('HH:mm');
    const duration = 90 + Math.floor(Math.random() * 60);
    const transcript = `
书记员：现在宣布法庭纪律。

审判长：现在开庭。首先核对当事人身份。
原告：${record.caseName}
审判长：原告陈述诉讼请求及事实理由。
原告：诉讼请求：1. 请求依法判决...

审判长：被告进行答辩。
被告：答辩意见如下...

审判长：现在进行法庭调查。
...

审判长：法庭辩论结束。现在进行最后陈述。
原告：坚持诉讼请求。
被告：坚持答辩意见。

审判长：现在休庭，待合议庭评议后择日宣判。
    `.trim();

    db.prepare(`
      UPDATE trial_records 
      SET endTime = ?, duration = ?, transcript = ?, status = ?
      WHERE id = ?
    `).run(endTime, duration, transcript, 'completed', id);

    const updatedRecord = db.prepare('SELECT * FROM trial_records WHERE id = ?').get(id) as any;
    res.json({
      ...updatedRecord,
      participants: updatedRecord.participants ? JSON.parse(updatedRecord.participants) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
