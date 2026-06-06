import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, caseId, method, page = 1, pageSize = 10 } = req.query;
    let query = 'SELECT * FROM service_records WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (caseId) {
      query += ' AND caseId = ?';
      params.push(caseId);
    }
    if (method) {
      query += ' AND method = ?';
      params.push(method);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM service_records WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      items,
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
    const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({ message: '送达记录不存在' });
    }
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseId, caseNumber, method, receiver, receiverPhone, receiverEmail,
      documentType,
    } = req.body;

    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const sentAt = createdAt;

    db.prepare(`
      INSERT INTO service_records (id, caseId, caseNumber, method, receiver, receiverPhone,
        receiverEmail, documentType, status, sentAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseId, caseNumber, method, receiver, receiverPhone,
      receiverEmail, documentType, 'sending', sentAt, createdAt
    );

    setTimeout(() => {
      try {
        const isDelivered = Math.random() > 0.1;
        db.prepare(`
          UPDATE service_records 
          SET status = ?, deliveredAt = ?
          WHERE id = ?
        `).run(
          isDelivered ? 'delivered' : 'failed',
          isDelivered ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null,
          id
        );
      } catch (e) {
        console.log('送达状态更新失败', e);
      }
    }, 2000);

    const newRecord = db.prepare('SELECT * FROM service_records WHERE id = ?').get(id);
    res.status(201).json(newRecord);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['status', 'receiptUrl', 'deliveredAt'];
    const updates: string[] = [];
    const params: any[] = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE service_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedRecord = db.prepare('SELECT * FROM service_records WHERE id = ?').get(id);
    res.json(updatedRecord);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/summary', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM service_records').get() as { count: number };
    const delivered = db.prepare("SELECT COUNT(*) as count FROM service_records WHERE status = 'delivered'").get() as { count: number };
    const failed = db.prepare("SELECT COUNT(*) as count FROM service_records WHERE status = 'failed'").get() as { count: number };
    const sending = db.prepare("SELECT COUNT(*) as count FROM service_records WHERE status IN ('sending', 'sent')").get() as { count: number };

    res.json({
      total: total.count,
      delivered: delivered.count,
      failed: failed.count,
      sending: sending.count,
      successRate: total.count > 0 ? Math.round((delivered.count / total.count) * 100) : 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
