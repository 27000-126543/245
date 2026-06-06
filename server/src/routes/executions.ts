import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, applicant, page = 1, pageSize = 10 } = req.query;
    let query = 'SELECT * FROM execution_records WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (applicant) {
      query += ' AND applicant LIKE ?';
      params.push(`%${applicant}%`);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const items = db.prepare(query).all(...params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM execution_records WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    const itemsWithDetails = items.map((item: any) => {
      const propertyControls = db.prepare('SELECT * FROM property_controls WHERE executionId = ?').all(item.id);
      const distributions = db.prepare('SELECT * FROM execution_distributions WHERE executionId = ?').all(item.id);
      return {
        ...item,
        propertyControls,
        distributions,
      };
    });

    res.json({
      items: itemsWithDetails,
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
    const record = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(id) as any;
    if (!record) {
      return res.status(404).json({ message: '执行记录不存在' });
    }
    
    const propertyControls = db.prepare('SELECT * FROM property_controls WHERE executionId = ?').all(id);
    const distributions = db.prepare('SELECT * FROM execution_distributions WHERE executionId = ?').all(id);

    res.json({
      ...record,
      propertyControls,
      distributions,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      caseId, caseNumber, applicant, respondent, amount,
    } = req.body;

    const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    db.prepare(`
      INSERT INTO execution_records (id, caseId, caseNumber, applicant, respondent,
        amount, recoveredAmount, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?)
    `).run(id, caseId, caseNumber, applicant, respondent, amount, createdAt);

    const newRecord = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(id);
    res.status(201).json(newRecord);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['applicant', 'respondent', 'amount', 'recoveredAmount', 'status'];
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
      db.prepare(`UPDATE execution_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedRecord = db.prepare('SELECT * FROM execution_records WHERE id = ?').get(id);
    res.json(updatedRecord);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/property-controls', (req, res) => {
  try {
    const { id } = req.params;
    const controlId = crypto.randomUUID();
    const { type, description, amount } = req.body;

    db.prepare(`
      INSERT INTO property_controls (id, executionId, type, description, amount, status, createdAt)
      VALUES (?, ?, ?, ?, ?, 'frozen', ?)
    `).run(controlId, id, type, description, amount, dayjs().format('YYYY-MM-DD HH:mm:ss'));

    const newControl = db.prepare('SELECT * FROM property_controls WHERE id = ?').get(controlId);
    res.status(201).json(newControl);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/distributions', (req, res) => {
  try {
    const { id } = req.params;
    const distId = crypto.randomUUID();
    const { recipient, amount, remark } = req.body;

    db.prepare(`
      INSERT INTO execution_distributions (id, executionId, recipient, amount, status, remark, createdAt)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).run(distId, id, recipient, amount, remark, dayjs().format('YYYY-MM-DD HH:mm:ss'));

    const newDist = db.prepare('SELECT * FROM execution_distributions WHERE id = ?').get(distId);
    res.status(201).json(newDist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/query-assets', (req, res) => {
  try {
    const { name, idCard } = req.body;
    
    const assets = [
      {
        id: crypto.randomUUID(),
        type: 'bank_account',
        name: '中国工商银行',
        description: `账户尾号${Math.floor(Math.random() * 9000) + 1000}`,
        amount: Math.floor(Math.random() * 500000) + 10000,
      },
      {
        id: crypto.randomUUID(),
        type: 'house',
        name: '不动产',
        description: `位于${['朝阳区', '海淀区', '东城区', '西城区'][Math.floor(Math.random() * 4)]}的房产`,
        amount: Math.floor(Math.random() * 5000000) + 1000000,
      },
      {
        id: crypto.randomUUID(),
        type: 'vehicle',
        name: '机动车',
        description: `车牌号京${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90000) + 10000}`,
        amount: Math.floor(Math.random() * 500000) + 50000,
      },
    ];

    res.json({
      name,
      queryTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      assets: assets.slice(0, Math.floor(Math.random() * 3) + 1),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
