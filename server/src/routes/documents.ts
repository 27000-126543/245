import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR title LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  sql += ' ORDER BY createdAt DESC';
  const docs = db.prepare(sql).all(...params).map((d: any) => ({
    ...d,
    approvals: d.approvals ? JSON.parse(d.approvals) : [],
    suggestedPoints: d.suggestedPoints ? JSON.parse(d.suggestedPoints) : [],
  }));
  res.json(docs);
});

router.get('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
  if (!doc) return res.status(404).json({ message: '文书不存在' });
  
  doc.approvals = doc.approvals ? JSON.parse(doc.approvals) : [];
  doc.suggestedPoints = doc.suggestedPoints ? JSON.parse(doc.suggestedPoints) : [];
  res.json(doc);
});

router.post('/', (req, res) => {
  const {
    caseId, caseNumber, type, title, content,
    authorId, authorName, suggestedPoints,
  } = req.body;

  const id = String(Date.now());
  const createdAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO documents (id, caseId, caseNumber, type, title, content, status,
      approverLevel, approvals, authorId, authorName, createdAt, suggestedPoints)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, '[]', ?, ?, ?, ?)
  `).run(
    id, caseId, caseNumber, type, title, content,
    authorId, authorName, createdAt,
    suggestedPoints ? JSON.stringify(suggestedPoints) : null
  );

  const newDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
  newDoc.approvals = [];
  newDoc.suggestedPoints = suggestedPoints || [];
  res.status(201).json(newDoc);
});

router.put('/:id', (req, res) => {
  const { status, approverLevel, approvals, content, title, currentApproverId, currentApproverName } = req.body;
  
  db.prepare(`
    UPDATE documents SET status = ?, approverLevel = ?, approvals = ?, content = ?, title = ?,
      currentApproverId = ?, currentApproverName = ?
    WHERE id = ?
  `).run(
    status, approverLevel, JSON.stringify(approvals || []), content, title,
    currentApproverId, currentApproverName, req.params.id
  );

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
  doc.approvals = doc.approvals ? JSON.parse(doc.approvals) : [];
  doc.suggestedPoints = doc.suggestedPoints ? JSON.parse(doc.suggestedPoints) : [];
  res.json(doc);
});

router.post('/:id/submit', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
  if (!doc) return res.status(404).json({ message: '文书不存在' });

  const now = new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE documents SET status = 'pending_judge', approverLevel = 1, submittedAt = ?
    WHERE id = ?
  `).run(now, req.params.id);

  const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
  updatedDoc.approvals = updatedDoc.approvals ? JSON.parse(updatedDoc.approvals) : [];
  updatedDoc.suggestedPoints = updatedDoc.suggestedPoints ? JSON.parse(updatedDoc.suggestedPoints) : [];
  res.json(updatedDoc);
});

router.post('/generate', (req, res) => {
  const { caseNumber, caseType, causeOfAction } = req.body;
  
  const draftContent = `
${caseType === 'civil' ? '民事判决书' : caseType === 'criminal' ? '刑事判决书' : '行政判决书'}

${caseNumber}

原告：张三
被告：李四

本院认为，依法成立的合同，对当事人具有法律约束力。

综上所述，依照《中华人民共和国民法典》第五百零九条之规定，判决如下：

一、被告李四于本判决生效之日起十日内向原告张三支付款项；
二、驳回原告其他诉讼请求。

如不服本判决，可在判决书送达之日起十五日内提起上诉。

审判员：
${new Date().toISOString().split('T')[0]}
  `.trim();

  const suggestedPoints = [
    '1. 事实认定清楚，证据确凿',
    '2. 适用法律正确',
    '3. 程序合法正当',
  ];

  res.json({ content: draftContent, suggestedPoints });
});

export default router;
