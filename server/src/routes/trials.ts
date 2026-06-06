const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM trial_records WHERE 1=1';
    const params = [];
    
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (caseId) { sql += ' AND caseId = ?'; params.push(caseId); }
    
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const list = query(sql, params);
    res.json({ code: 200, data: { list, total: list.length, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const record = queryOne('SELECT * FROM trial_records WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ code: 404, message: '庭审记录不存在' });
    res.json({ code: 200, data: record });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseId, caseNumber, caseName, scheduleId, judgeName, courtRoomName, startTime, participants } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    
    execute('INSERT INTO trial_records (id, caseId, caseNumber, caseName, scheduleId, judgeName, courtRoomName, startTime, status, participants, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseId, caseNumber, caseName, scheduleId, judgeName, courtRoomName, startTime, 'ongoing', JSON.stringify(participants || []), createdAt]);
    
    res.json({ code: 200, message: '庭审开始', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/end', (req, res) => {
  try {
    const { endTime, videoUrl } = req.body;
    const record = queryOne('SELECT * FROM trial_records WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ code: 404, message: '庭审记录不存在' });
    
    const duration = Math.floor((new Date(endTime).getTime() - new Date(record.startTime).getTime()) / 60000);
    
    execute('UPDATE trial_records SET endTime = ?, duration = ?, videoUrl = ?, status = ? WHERE id = ?', 
      [endTime, duration, videoUrl, 'completed', req.params.id]);
    
    res.json({ code: 200, message: '庭审结束' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/transcribe', (req, res) => {
  try {
    const transcript = `书记员：现在宣布法庭纪律。\n审判长：现在开庭。\n原告：陈述诉讼请求...\n被告：答辩意见...\n审判长：法庭调查结束，现在进行法庭辩论。\n...\n审判长：现在休庭。`;
    
    execute('UPDATE trial_records SET transcript = ? WHERE id = ?', [transcript, req.params.id]);
    res.json({ code: 200, data: { transcript } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
