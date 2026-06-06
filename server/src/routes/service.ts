const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM service_records WHERE 1=1';
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

router.get('/summary', (req, res) => {
  try {
    const total = queryOne('SELECT COUNT(*) as count FROM service_records')?.count || 0;
    const delivered = queryOne('SELECT COUNT(*) as count FROM service_records WHERE status = ?', ['delivered'])?.count || 0;
    const sending = queryOne('SELECT COUNT(*) as count FROM service_records WHERE status = ?', ['sending'])?.count || 0;
    
    res.json({
      code: 200,
      data: {
        total,
        delivered,
        sending,
        rate: total > 0 ? Math.round((delivered / total) * 100) : 0,
        byMethod: [
          { method: 'direct', name: '直接送达', count: queryOne('SELECT COUNT(*) as count FROM service_records WHERE method = ?', ['direct'])?.count || 0 },
          { method: 'post', name: '邮寄送达', count: queryOne('SELECT COUNT(*) as count FROM service_records WHERE method = ?', ['post'])?.count || 0 },
          { method: 'email', name: '电子送达', count: queryOne('SELECT COUNT(*) as count FROM service_records WHERE method = ?', ['email'])?.count || 0 },
          { method: 'sms', name: '短信送达', count: queryOne('SELECT COUNT(*) as count FROM service_records WHERE method = ?', ['sms'])?.count || 0 },
          { method: 'announce', name: '公告送达', count: queryOne('SELECT COUNT(*) as count FROM service_records WHERE method = ?', ['announce'])?.count || 0 },
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseId, caseNumber, method, receiver, receiverPhone, receiverEmail, documentType } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString().split('T')[0];
    const sentAt = createdAt;
    
    execute('INSERT INTO service_records (id, caseId, caseNumber, method, receiver, receiverPhone, receiverEmail, documentType, status, sentAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseId, caseNumber, method, receiver, receiverPhone, receiverEmail, documentType, 'sending', sentAt, createdAt]);
    
    res.json({ code: 200, message: '送达记录创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/:id/confirm', (req, res) => {
  try {
    const { receiptUrl } = req.body;
    const deliveredAt = new Date().toISOString().split('T')[0];
    execute('UPDATE service_records SET status = ?, receiptUrl = ?, deliveredAt = ? WHERE id = ?', 
      ['delivered', receiptUrl, deliveredAt, req.params.id]);
    res.json({ code: 200, message: '送达确认成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
