import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM execution_records WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR applicant LIKE ? OR respondent LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY createdAt DESC';
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(req.params.id) as any;
  if (!record) return res.status(404).json({ message: '执行记录不存在' });
  
  const propertyControls = db.prepare('SELECT * FROM property_controls WHERE executionId = ?').all(req.params.id);
  const distributions = db.prepare('SELECT * FROM execution_distributions WHERE executionId = ?').all(req.params.id);
  
  res.json({ ...record, propertyControls, distributions });
});

router.post('/', (req, res) => {
  const { caseId, caseNumber, applicant, respondent, amount } = req.body;

  const id = String(Date.now());
  const createdAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO execution_records (id, caseId, caseNumber, applicant, respondent, amount,
      recoveredAmount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?)
  `).run(id, caseId, caseNumber, applicant, respondent, amount, createdAt);

  const newRecord = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(id);
  res.status(201).json(newRecord);
});

router.put('/:id', (req, res) => {
  const { status, recoveredAmount } = req.body;
  
  db.prepare(`
    UPDATE execution_records SET status = ?, recoveredAmount = ?
    WHERE id = ?
  `).run(status, recoveredAmount, req.params.id);

  const record = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(req.params.id);
  res.json(record);
});

router.post('/:id/property-controls', (req, res) => {
  const { type, description, amount } = req.body;
  const id = String(Date.now());
  const createdAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO property_controls (id, executionId, type, description, amount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, 'frozen', ?)
  `).run(id, req.params.id, type, description, amount, createdAt);

  db.prepare(`
    UPDATE execution_records SET status = 'executing' WHERE id = ?
  `).run(req.params.id);

  const control = db.prepare('SELECT * FROM property_controls WHERE id = ?').get(id);
  res.status(201).json(control);
});

router.post('/:id/distributions', (req, res) => {
  const { recipient, amount, remark } = req.body;
  const id = String(Date.now());
  const createdAt = new Date().toISOString().split('T')[0];
  const paidAt = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO execution_distributions (id, executionId, recipient, amount, status, paidAt, remark, createdAt)
    VALUES (?, ?, ?, ?, 'paid', ?, ?, ?)
  `).run(id, req.params.id, recipient, amount, paidAt, remark, createdAt);

  const dist = db.prepare('SELECT * FROM execution_distributions WHERE id = ?').get(id);
  
  const execRecord = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(req.params.id) as any;
  const newRecovered = (execRecord?.recoveredAmount || 0) + Number(amount);
  
  db.prepare(`
    UPDATE execution_records SET recoveredAmount = ?, status = 'completed' WHERE id = ?
  `).run(newRecovered, req.params.id);

  res.status(201).json(dist);
});

router.post('/query-assets', (req, res) => {
  const { name, idCard } = req.body;
  
  setTimeout(() => {
    res.json([
      { type: '银行账户', bank: '工商银行', account: '6222****8888', balance: 125000, status: 'normal' },
      { type: '银行账户', bank: '建设银行', account: '6217****6666', balance: 89500, status: 'normal' },
      { type: '房产', location: '北京市朝阳区建国路88号', area: '120㎡', value: 6800000, status: 'normal' },
      { type: '车辆', brand: '奔驰', plate: '京A12345', value: 450000, status: 'normal' },
    ]);
  }, 1500);
});

export default router;
