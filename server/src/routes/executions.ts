const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM execution_records WHERE 1=1';
    const params = [];
    
    if (status) { sql += ' AND status = ?'; params.push(status); }
    
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
    const execution = queryOne('SELECT * FROM execution_records WHERE id = ?', [req.params.id]);
    if (!execution) return res.status(404).json({ code: 404, message: '执行记录不存在' });
    
    const properties = query('SELECT * FROM property_controls WHERE executionId = ?', [req.params.id]);
    const distributions = query('SELECT * FROM execution_distributions WHERE executionId = ?', [req.params.id]);
    
    res.json({ code: 200, data: { ...execution, properties, distributions } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseId, caseNumber, applicant, respondent, amount } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    
    execute('INSERT INTO execution_records (id, caseId, caseNumber, applicant, respondent, amount, recoveredAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseId, caseNumber, applicant, respondent, amount, 0, 'pending', createdAt]);
    
    res.json({ code: 200, message: '执行立案成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/property-control', (req, res) => {
  try {
    const { type, description, amount } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    
    execute('INSERT INTO property_controls (id, executionId, type, description, amount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [id, req.params.id, type, description, amount, 'frozen', createdAt]);
    
    res.json({ code: 200, message: '财产控制成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/distribute', (req, res) => {
  try {
    const { recipient, amount, remark } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString();
    
    execute('INSERT INTO execution_distributions (id, executionId, recipient, amount, status, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [id, req.params.id, recipient, amount, 'pending', remark, createdAt]);
    
    res.json({ code: 200, message: '案款分配记录创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/distribute/:distId/confirm', (req, res) => {
  try {
    const paidAt = new Date().toISOString().split('T')[0];
    execute('UPDATE execution_distributions SET status = ?, paidAt = ? WHERE id = ?', ['paid', paidAt, req.params.distId]);
    res.json({ code: 200, message: '案款发放确认成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, recoveredAmount } = req.body;
    execute('UPDATE execution_records SET status = ?, recoveredAmount = ? WHERE id = ?', [status, recoveredAmount, req.params.id]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
