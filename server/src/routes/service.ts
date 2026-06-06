import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, method, search } = req.query;
  let sql = 'SELECT * FROM service_records WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (method && method !== 'all') {
    sql += ' AND method = ?';
    params.push(method);
  }
  if (search) {
    sql += ' AND (caseNumber LIKE ? OR receiver LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  sql += ' ORDER BY createdAt DESC';
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ message: '送达记录不存在' });
  res.json(record);
});

router.post('/', (req, res) => {
  const {
    caseId, caseNumber, method, receiver, receiverPhone, receiverEmail,
    documentType,
  } = req.body;

  const id = String(Date.now());
  const now = new Date().toISOString();
  const createdAt = now.split('T')[0];

  db.prepare(`
    INSERT INTO service_records (id, caseId, caseNumber, method, receiver, receiverPhone,
      receiverEmail, documentType, status, sentAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sending', ?, ?)
  `).run(
    id, caseId, caseNumber, method, receiver, receiverPhone,
    receiverEmail, documentType, now, createdAt
  );

  const newRecord = db.prepare('SELECT * FROM service_records WHERE id = ?').get(id);
  
  setTimeout(() => {
    db.prepare('UPDATE service_records SET status = ?, deliveredAt = ? WHERE id = ?')
      .run('delivered', new Date().toISOString(), id);
  }, 2000);

  res.status(201).json(newRecord);
});

router.put('/:id', (req, res) => {
  const { status, deliveredAt, receiptUrl } = req.body;
  
  db.prepare(`
    UPDATE service_records SET status = ?, deliveredAt = ?, receiptUrl = ?
    WHERE id = ?
  `).run(status, deliveredAt, receiptUrl, req.params.id);

  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  res.json(record);
});

router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM service_records').get() as any;
  const delivered = db.prepare("SELECT COUNT(*) as count FROM service_records WHERE status = 'delivered'").get() as any;
  const failed = db.prepare("SELECT COUNT(*) as count FROM service_records WHERE status = 'failed'").get() as any;
  
  const byMethod = db.prepare(`
    SELECT method, COUNT(*) as count 
    FROM service_records 
    GROUP BY method
  `).all();

  res.json({
    total: total.count,
    delivered: delivered.count,
    failed: failed.count,
    byMethod,
  });
});

export default router;
