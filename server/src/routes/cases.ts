const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseType, departmentId, keyword, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM cases WHERE 1=1';
    const params = [];
    
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (caseType) { sql += ' AND caseType = ?'; params.push(caseType); }
    if (departmentId) { sql += ' AND departmentId = ?'; params.push(departmentId); }
    if (keyword) { sql += ' AND (caseNumber LIKE ? OR plaintiff LIKE ? OR defendant LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    
    const list = query(sql, params);
    const countResult = queryOne('SELECT COUNT(*) as total FROM cases WHERE 1=1');
    
    res.json({ code: 200, data: { list, total: countResult?.total || 0, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const caseData = queryOne('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    if (!caseData) return res.status(404).json({ code: 404, message: '案件不存在' });
    res.json({ code: 200, data: caseData });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseNumber, caseType, causeOfAction, plaintiff, defendant, plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, departmentId, departmentName, filingMaterials, description, amount } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString().split('T')[0];
    const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    execute('INSERT INTO cases (id, caseNumber, caseType, causeOfAction, plaintiff, defendant, plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, status, departmentId, departmentName, estimatedDays, createdAt, deadline, filingMaterials, description, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseNumber, caseType, causeOfAction, plaintiff, defendant, plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, 'filed', departmentId, departmentName, 60, createdAt, deadline, filingMaterials, description, amount]);
    
    res.json({ code: 200, message: '立案成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, judgeId, judgeName, clerkId, clerkName } = req.body;
    execute('UPDATE cases SET status = ?, judgeId = ?, judgeName = ?, clerkId = ?, clerkName = ? WHERE id = ?', [status, judgeId, judgeName, clerkId, clerkName, req.params.id]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/:id/recommend-judge', (req, res) => {
  try {
    const judges = query('SELECT id, name, departmentId, departmentName FROM users WHERE role = ?', ['judge']);
    const recommended = judges.map(j => ({
      ...j,
      caseCount: Math.floor(Math.random() * 15),
      score: Math.floor(80 + Math.random() * 20)
    })).sort((a, b) => b.score - a.score);
    
    res.json({ code: 200, data: recommended });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
