const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { date, judgeId, status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM schedules WHERE 1=1';
    const params = [];
    
    if (date) { sql += ' AND date = ?'; params.push(date); }
    if (judgeId) { sql += ' AND judgeId = ?'; params.push(judgeId); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    
    sql += ' ORDER BY date ASC, startTime ASC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const list = query(sql, params);
    res.json({ code: 200, data: { list, total: list.length, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseId, caseNumber, caseName, judgeId, judgeName, courtRoomId, courtRoomName, date, startTime, endTime, type } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    
    const conflicts = query('SELECT * FROM schedules WHERE courtRoomId = ? AND date = ? AND ((startTime < ? AND endTime > ?) OR (startTime < ? AND endTime > ?) OR (startTime >= ? AND endTime <= ?))', 
      [courtRoomId, date, endTime, startTime, endTime, startTime, startTime, endTime]);
    
    if (conflicts.length > 0) {
      return res.status(400).json({ code: 400, message: '该法庭在此时段已有排期，存在冲突' });
    }
    
    const sameDaySchedules = query('SELECT COUNT(*) as count FROM schedules WHERE date = ?', [date]);
    const queuePosition = (sameDaySchedules[0]?.count || 0) + 1;
    
    execute('INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseId, caseNumber, caseName, judgeId, judgeName, courtRoomId, courtRoomName, date, startTime, endTime, type || 'trial', 'scheduled', createdAt, queuePosition]);
    
    res.json({ code: 200, message: '排期成功', data: { id, queuePosition } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/check-conflict', (req, res) => {
  try {
    const { courtRoomId, date, startTime, endTime } = req.body;
    
    const conflicts = query('SELECT * FROM schedules WHERE courtRoomId = ? AND date = ? AND ((startTime < ? AND endTime > ?) OR (startTime < ? AND endTime > ?) OR (startTime >= ? AND endTime <= ?))', 
      [courtRoomId, date, endTime, startTime, endTime, startTime, startTime, endTime]);
    
    res.json({ code: 200, data: { hasConflict: conflicts.length > 0, conflicts } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status } = req.body;
    execute('UPDATE schedules SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
