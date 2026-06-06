import { Router } from 'express';
import { db } from '../db';
import dayjs from 'dayjs';

const router = Router();

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM cases WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR plaintiff LIKE ? OR defendant LIKE ? OR causeOfAction LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY createdAt DESC';
  const cases = db.prepare(sql).all(...params).map((c: any) => ({
    ...c,
    filingMaterials: c.filingMaterials ? JSON.parse(c.filingMaterials) : [],
  }));
  res.json(cases);
});

router.get('/:id', (req, res) => {
  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as any;
  if (!caseData) return res.status(404).json({ message: '案件不存在' });
  
  caseData.filingMaterials = caseData.filingMaterials ? JSON.parse(caseData.filingMaterials) : [];
  res.json(caseData);
});

router.post('/', (req, res) => {
  const {
    caseType, causeOfAction, plaintiff, defendant,
    plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress,
    clerkId, clerkName, amount, description,
  } = req.body;

  const id = String(Date.now());
  const year = new Date().getFullYear();
  const caseNumber = `(${year})京0101民初${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}号`;
  const createdAt = dayjs().format('YYYY-MM-DD');
  const deadline = dayjs().add(90, 'day').format('YYYY-MM-DD');

  db.prepare(`
    INSERT INTO cases (id, caseNumber, caseType, causeOfAction, plaintiff, defendant,
      plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, status,
      clerkId, clerkName, estimatedDays, createdAt, deadline, description, amount, filingMaterials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'filed', ?, ?, 60, ?, ?, ?, ?, '[]')
  `).run(
    id, caseNumber, caseType, causeOfAction, plaintiff, defendant,
    plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress,
    clerkId, clerkName, createdAt, deadline, description, amount
  );

  const newCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;
  newCase.filingMaterials = [];
  res.status(201).json(newCase);
});

router.put('/:id', (req, res) => {
  const { judgeId, judgeName, departmentId, departmentName, status } = req.body;
  
  db.prepare(`
    UPDATE cases SET judgeId = ?, judgeName = ?, departmentId = ?, departmentName = ?, status = ?
    WHERE id = ?
  `).run(judgeId, judgeName, departmentId, departmentName, status, req.params.id);

  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as any;
  caseData.filingMaterials = caseData.filingMaterials ? JSON.parse(caseData.filingMaterials) : [];
  res.json(caseData);
});

router.get('/:id/recommend-judges', (req, res) => {
  const causeOfAction = req.query.causeOfAction as string;
  
  const judges = db.prepare(`
    SELECT id, name, department, 
      (SELECT COUNT(*) FROM cases WHERE judgeId = users.id) as caseCount,
      (SELECT AVG(actualDays) FROM cases WHERE judgeId = users.id AND status = 'closed') as avgDays
    FROM users 
    WHERE role = 'judge'
    ORDER BY caseCount ASC
    LIMIT 3
  `).all();

  const recommendations = judges.map((j: any, idx: number) => ({
    judgeId: j.id,
    judgeName: j.name,
    department: j.department === '1' ? '民事审判第一庭' : j.department === '2' ? '民事审判第二庭' : j.department === '3' ? '刑事审判第一庭' : '行政审判庭',
    similarityScore: Math.floor(90 + Math.random() * 10),
    avgDays: Math.round(j.avgDays || 45),
    caseCount: j.caseCount || 0,
    recommended: idx === 0,
  }));

  res.json(recommendations);
});

export default router;
