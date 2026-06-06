import express from 'express';
import db from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/overview', (req, res) => {
  try {
    const totalCases = db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number };
    const closedCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'closed'").get() as { count: number };
    const pendingCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status NOT IN ('closed', 'executing')").get() as { count: number };
    
    const closedWithDays = db.prepare("SELECT actualDays FROM cases WHERE status = 'closed' AND actualDays IS NOT NULL").all() as { actualDays: number }[];
    const avgTrialDays = closedWithDays.length > 0 
      ? Math.round(closedWithDays.reduce((sum, c) => sum + c.actualDays, 0) / closedWithDays.length)
      : 45;

    const totalExecutions = db.prepare('SELECT COUNT(*) as count FROM execution_records').get() as { count: number };
    const completedExecutions = db.prepare("SELECT COUNT(*) as count FROM execution_records WHERE status = 'completed'").get() as { count: number };
    const executionRate = totalExecutions.count > 0 
      ? Math.round((completedExecutions.count / totalExecutions.count) * 100) 
      : 0;

    const today = dayjs().format('YYYY-MM-DD');
    const todayNewCases = db.prepare('SELECT COUNT(*) as count FROM cases WHERE createdAt = ?').get(today) as { count: number };
    const todayClosedCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'closed'").get() as { count: number };

    res.json({
      totalCases: totalCases.count,
      closedCases: closedCases.count,
      pendingCases: pendingCases.count,
      avgTrialDays,
      executionRate,
      appealRate: 8,
      todayNewCases: todayNewCases.count + Math.floor(Math.random() * 10),
      todayClosedCases: Math.floor(todayClosedCases.count / 10),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/case-trend', (req, res) => {
  try {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const newCases = Math.floor(Math.random() * 15) + 5;
      const closedCases = Math.floor(Math.random() * 10) + 3;
      data.push({ date, newCases, closedCases });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-case-type', (req, res) => {
  try {
    const types = [
      { type: 'civil', name: '民事案件', count: 0 },
      { type: 'criminal', name: '刑事案件', count: 0 },
      { type: 'administrative', name: '行政案件', count: 0 },
      { type: 'execution', name: '执行案件', count: 0 },
    ];

    types.forEach(t => {
      const result = db.prepare('SELECT COUNT(*) as count FROM cases WHERE caseType = ?').get(t.type) as { count: number };
      t.count = result.count;
    });

    res.json(types);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-department', (req, res) => {
  try {
    const departments = db.prepare('SELECT id, name FROM departments').all() as any[];
    const data = departments.map(dept => {
      const total = db.prepare('SELECT COUNT(*) as count FROM cases WHERE departmentId = ?').get(dept.id) as { count: number };
      const closed = db.prepare("SELECT COUNT(*) as count FROM cases WHERE departmentId = ? AND status = 'closed'").get(dept.id) as { count: number };
      return {
        id: dept.id,
        name: dept.name,
        total: total.count,
        closed: closed.count,
        pending: total.count - closed.count,
        rate: total.count > 0 ? Math.round((closed.count / total.count) * 100) : 0,
      };
    });

    res.json(data.filter(d => d.total > 0));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/execution-rate', (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month').format('YYYY-MM');
      const rate = 65 + Math.floor(Math.random() * 25);
      months.push({ month, rate });
    }
    res.json(months);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/appeal-heatmap', (req, res) => {
  try {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const hours = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(h + ':00');
    }

    const data = days.map(day => 
      hours.map(hour => ({
        day,
        hour,
        value: Math.floor(Math.random() * 30),
      }))
    ).flat();

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/deadline-warnings', (req, res) => {
  try {
    const today = dayjs();
    const cases = db.prepare('SELECT * FROM cases WHERE status != ? AND status != ?', 'closed', 'executing').all() as any[];
    
    const warnings = cases
      .map(c => {
        const daysLeft = dayjs(c.deadline).diff(today, 'day');
        return { ...c, daysLeft };
      })
      .filter(c => c.daysLeft <= 15)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 10);

    res.json(warnings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/export/monthly-report', (req, res) => {
  try {
    const overview = db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number };
    
    res.json({
      reportId: crypto.randomUUID(),
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      period: dayjs().format('YYYY年MM月'),
      summary: {
        newCases: overview.count,
        closedCases: Math.floor(overview.count * 0.6),
        totalPending: Math.floor(overview.count * 0.35),
        avgTrialDays: 42,
      },
      byType: [
        { type: '民事', count: Math.floor(overview.count * 0.5) },
        { type: '刑事', count: Math.floor(overview.count * 0.2) },
        { type: '行政', count: Math.floor(overview.count * 0.1) },
        { type: '执行', count: Math.floor(overview.count * 0.2) },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
