import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, authorId, page = 1, pageSize = 10 } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (caseId) {
      query += ' AND caseId = ?';
      params.push(caseId);
    }
    if (authorId) {
      query += ' AND authorId = ?';
      params.push(authorId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM documents WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      items: items.map((item: any) => ({
        ...item,
        approvals: item.approvals ? JSON.parse(item.approvals) : [],
        suggestedPoints: item.suggestedPoints ? JSON.parse(item.suggestedPoints) : null,
      })),
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
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    if (!doc) {
      return res.status(404).json({ message: '文书不存在' });
    }
    res.json({
      ...doc,
      approvals: doc.approvals ? JSON.parse(doc.approvals) : [],
      suggestedPoints: doc.suggestedPoints ? JSON.parse(doc.suggestedPoints) : null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseId, caseNumber, type, title, content,
      authorId, authorName, suggestedPoints,
    } = req.body;

    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    db.prepare(`
      INSERT INTO documents (id, caseId, caseNumber, type, title, content, status,
        approverLevel, approvals, authorId, authorName, createdAt, suggestedPoints)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseId, caseNumber, type, title, content, 'draft',
      0, '[]', authorId, authorName, createdAt,
      suggestedPoints ? JSON.stringify(suggestedPoints) : null
    );

    const newDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...newDoc,
      approvals: newDoc.approvals ? JSON.parse(newDoc.approvals) : [],
      suggestedPoints: newDoc.suggestedPoints ? JSON.parse(newDoc.suggestedPoints) : null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['title', 'content', 'type', 'status', 'suggestedPoints'];
    const updates: string[] = [];
    const params: any[] = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if ((field === 'suggestedPoints') && Array.isArray(req.body[field])) {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${field} = ?`);
          params.push(req.body[field]);
        }
      }
    });

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    res.json({
      ...updatedDoc,
      approvals: updatedDoc.approvals ? JSON.parse(updatedDoc.approvals) : [],
      suggestedPoints: updatedDoc.suggestedPoints ? JSON.parse(updatedDoc.suggestedPoints) : null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    if (!doc) {
      return res.status(404).json({ message: '文书不存在' });
    }

    const nextLevel = doc.approverLevel + 1;
    let newStatus = 'pending_chief';
    let approverRole = 'chief';
    if (nextLevel === 2) {
      newStatus = 'pending_president';
      approverRole = 'president';
    }

    const approver = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(approverRole) as any;
    
    const approvals = doc.approvals ? JSON.parse(doc.approvals) : [];
    approvals.push({
      id: crypto.randomUUID(),
      level: nextLevel,
      approverId: approver?.id,
      approverName: approver?.name,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });

    db.prepare(`
      UPDATE documents 
      SET status = ?, approverLevel = ?, currentApproverId = ?, currentApproverName = ?, 
          approvals = ?, submittedAt = ?
      WHERE id = ?
    `).run(
      newStatus, nextLevel, approver?.id, approver?.name,
      JSON.stringify(approvals), dayjs().format('YYYY-MM-DD HH:mm:ss'), id
    );

    const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    res.json({
      ...updatedDoc,
      approvals: updatedDoc.approvals ? JSON.parse(updatedDoc.approvals) : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/generate', (req, res) => {
  try {
    const { caseId, type, caseData } = req.body;
    
    const templates: Record<string, (data: any) => string> = {
      judgment: (data) => `
原告${data.plaintiff}与被告${data.defendant}${data.causeOfAction}一案，本院于${data.createdAt}立案后，依法适用普通程序，公开开庭进行了审理。本案现已审理终结。

原告${data.plaintiff}向本院提出诉讼请求：1. 判令被告承担相应法律责任；2. 本案诉讼费用由被告承担。

事实和理由：（此处为AI根据案件事实自动生成的事实认定部分）

本院认为，依照《中华人民共和国民法典》相关规定，判决如下：

一、（判决主文）

二、（判决主文）

如不服本判决，可在判决书送达之日起十五日内，向本院递交上诉状，并按对方当事人的人数提出副本，上诉于北京市第一中级人民法院。
      `,
      ruling: (data) => `
原告${data.plaintiff}与被告${data.defendant}${data.causeOfAction}一案，本院依法进行了审理。

经审查，本院认为，依照《中华人民共和国民事诉讼法》相关规定，裁定如下：

（裁定主文）

如不服本裁定，可在裁定书送达之日起十日内，向本院递交上诉状，上诉于北京市第一中级人民法院。
      `,
      mediation: (data) => `
本案在审理过程中，经本院主持调解，双方当事人自愿达成如下协议：

一、（协议内容）

二、（协议内容）

上述协议，不违反法律规定，本院予以确认。

本调解书经双方当事人签收后，即具有法律效力。
      `,
    };

    const content = templates[type]?.(caseData) || templates.judgment(caseData);
    const suggestedPoints = [
      '1. 案件事实认定清晰，证据链完整',
      '2. 法律适用准确，裁判尺度统一',
      '3. 文书结构规范，说理充分',
    ];

    res.json({
      content: content.trim(),
      suggestedPoints,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
