import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseType, keyword, judgeId, page = 1, pageSize = 10 } = req.query;
    let query = 'SELECT * FROM cases WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (caseType) {
      query += ' AND caseType = ?';
      params.push(caseType);
    }
    if (keyword) {
      query += ' AND (caseNumber LIKE ? OR plaintiff LIKE ? OR defendant LIKE ? OR causeOfAction LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    if (judgeId) {
      query += ' AND judgeId = ?';
      params.push(judgeId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const cases = db.prepare(query).all(...params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM cases WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      items: cases,
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
    const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;
    if (!caseItem) {
      return res.status(404).json({ message: '案件不存在' });
    }
    res.json(caseItem);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseType, causeOfAction, plaintiff, defendant,
      plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress,
      judgeId, judgeName, clerkId, clerkName, departmentId, departmentName,
      estimatedDays = 60, filingMaterials, description, amount,
    } = req.body;

    const year = new Date().getFullYear();
    const count = db.prepare('SELECT COUNT(*) as c FROM cases').get() as { c: number };
    const caseNumber = `(${year})京0101民初${String(count.c + 1).padStart(4, '0')}号`;
    
    const createdAt = dayjs().format('YYYY-MM-DD');
    const deadline = dayjs(createdAt).add(estimatedDays, 'day').format('YYYY-MM-DD');

    db.prepare(`
      INSERT INTO cases (id, caseNumber, caseType, causeOfAction, plaintiff, defendant,
        plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, status,
        judgeId, judgeName, clerkId, clerkName, departmentId, departmentName,
        estimatedDays, createdAt, deadline, filingMaterials, description, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseNumber, caseType, causeOfAction, plaintiff, defendant,
      plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress,
      judgeId ? 'assigned' : 'filed',
      judgeId, judgeName, clerkId, clerkName, departmentId, departmentName,
      estimatedDays, createdAt, deadline,
      filingMaterials ? JSON.stringify(filingMaterials) : null,
      description, amount
    );

    const newCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    res.status(201).json(newCase);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'caseType', 'causeOfAction', 'plaintiff', 'defendant',
      'plaintiffPhone', 'defendantPhone', 'plaintiffAddress', 'defendantAddress',
      'status', 'judgeId', 'judgeName', 'clerkId', 'clerkName',
      'departmentId', 'departmentName', 'estimatedDays', 'actualDays',
      'deadline', 'filingMaterials', 'description', 'amount',
    ];

    const updates: string[] = [];
    const params: any[] = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'filingMaterials' && Array.isArray(req.body[field])) {
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
      db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    res.json(updatedCase);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/recommend-judges', (req, res) => {
  try {
    const { id } = req.params;
    const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;
    if (!caseItem) {
      return res.status(404).json({ message: '案件不存在' });
    }

    const judges = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.department,
        (SELECT COUNT(*) FROM cases WHERE judgeId = u.id AND status != 'closed') as currentCases,
        (SELECT COUNT(*) FROM cases WHERE judgeId = u.id AND caseType = ?) as typeExperience
      FROM users u
      WHERE u.role = 'judge'
      ORDER BY typeExperience DESC, currentCases ASC
    `).all(caseItem.caseType);

    const recommendations = judges.map((j: any) => ({
      ...j,
      score: Math.min(100, j.typeExperience * 10 + Math.max(0, 50 - j.currentCases * 5)),
      reason: j.typeExperience >= 5 
        ? `擅长处理${caseItem.caseType === 'civil' ? '民事' : caseItem.caseType === 'criminal' ? '刑事' : '行政'}案件，经验丰富`
        : '案件量适中，可快速分配',
    }));

    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
