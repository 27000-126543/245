const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM documents WHERE 1=1';
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
    const doc = queryOne('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ code: 404, message: '文书不存在' });
    res.json({ code: 200, data: doc });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { caseId, caseNumber, type, title, content, authorId, authorName } = req.body;
    const id = String(Date.now());
    const createdAt = new Date().toISOString().split('T')[0];
    
    execute('INSERT INTO documents (id, caseId, caseNumber, type, title, content, status, approverLevel, approvals, authorId, authorName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [id, caseId, caseNumber, type, title, content, 'draft', 0, '[]', authorId, authorName, createdAt]);
    
    res.json({ code: 200, message: '创建成功', data: { id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { approverId, approverName } = req.body;
    execute('UPDATE documents SET status = ?, approverLevel = ?, currentApproverId = ?, currentApproverName = ?, submittedAt = ? WHERE id = ?', 
      ['pending', 1, approverId, approverName, new Date().toISOString().split('T')[0], req.params.id]);
    res.json({ code: 200, message: '提交审批成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  try {
    const { approverId, approverName, comment, level } = req.body;
    const doc = queryOne('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ code: 404, message: '文书不存在' });
    
    const approvals = JSON.parse(doc.approvals || '[]');
    approvals.push({ id: approverId, name: approverName, time: new Date().toISOString(), comment });
    
    const isFinal = level >= 3;
    const newStatus = isFinal ? 'approved' : 'pending';
    
    execute('UPDATE documents SET status = ?, approverLevel = ?, approvals = ?, approvedAt = ? WHERE id = ?', 
      [newStatus, level, JSON.stringify(approvals), isFinal ? new Date().toISOString().split('T')[0] : null, req.params.id]);
    
    res.json({ code: 200, message: '审批成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.post('/generate', (req, res) => {
  try {
    const { caseId, caseNumber, type, caseData } = req.body;
    const templates = {
      verdict: `${caseNumber}\n民事判决书\n\n原告：${caseData?.plaintiff || '原告'}\n被告：${caseData?.defendant || '被告'}\n\n...（判决书正文）...`,
      indictment: `${caseNumber}\n民事起诉状\n\n原告：${caseData?.plaintiff || '原告'}\n被告：${caseData?.defendant || '被告'}\n\n诉讼请求：...`,
      notice: `${caseNumber}\n开庭传票\n\n被传唤人：${caseData?.defendant || '被告'}\n案由：${caseData?.causeOfAction || '纠纷'}\n\n应到时间：...`,
      ruling: `${caseNumber}\n民事裁定书\n\n...（裁定书正文）...`
    };
    
    const content = templates[type] || templates.verdict;
    const suggestedPoints = ['事实认定清晰', '法律适用准确', '程序合法正当'];
    
    res.json({ code: 200, data: { content, suggestedPoints } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
