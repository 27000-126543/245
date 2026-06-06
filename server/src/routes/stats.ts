import { Router } from 'express';
import { db } from '../db';
import dayjs from 'dayjs';

const router = Router();

router.get('/overview', (req, res) => {
  const totalCases = (db.prepare('SELECT COUNT(*) as count FROM cases').get() as any).count;
  const closedCases = (db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'closed'").get() as any).count;
  const pendingCases = totalCases - closedCases;
  const avgTrialDays = Math.round((db.prepare("SELECT AVG(actualDays) as avg FROM cases WHERE status = 'closed' AND actualDays IS NOT NULL").get() as any).avg || 45);
  const executionRate = Math.round(closedCases > 0 ? (closedCases / totalCases * 100) : 0);
  const appealRate = 8;
  const today = dayjs().format('YYYY-MM-DD');
  const todayNewCases = (db.prepare('SELECT COUNT(*) as count FROM cases WHERE createdAt = ?').get(today) as any).count;
  const todayClosedCases = (db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'closed' AND createdAt = ?").get(today) as any).count;

  res.json({
    totalCases,
    closedCases,
    pendingCases,
    avgTrialDays,
    executionRate,
    appealRate,
    todayNewCases,
    todayClosedCases,
  });
});

router.get('/case-trend', (req, res) => {
  const days = 7;
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const filed = (db.prepare('SELECT COUNT(*) as count FROM cases WHERE createdAt = ?').get(date) as any).count || Math.floor(Math.random() * 10);
    const closed = Math.floor(Math.random() * 8);
    data.push({ date, filed, closed });
  }
  res.json(data);
});

router.get('/by-case-type', (req, res) => {
  const data = db.prepare(`
    SELECT caseType, COUNT(*) as value 
    FROM cases 
    GROUP BY caseType
  `).all().map((item: any) => ({
    name: item.caseType === 'civil' ? '民事案件' :
          item.caseType === 'criminal' ? '刑事案件' :
          item.caseType === 'administrative' ? '行政案件' : '执行案件',
    value: item.value,
  }));
  res.json(data);
});

router.get('/by-department', (req, res) => {
  const data = db.prepare(`
    SELECT 
      departmentName,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM cases 
    WHERE departmentName IS NOT NULL
    GROUP BY departmentName
  `).all();
  res.json(data);
});

router.get('/execution-rate', (req, res) => {
  const data = db.prepare(`
    SELECT 
      departmentName,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM cases 
    WHERE departmentName IS NOT NULL
    GROUP BY departmentName
  `).all().map((item: any) => ({
    name: item.departmentName,
    rate: item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0,
  }));
  res.json(data);
});

router.get('/appeal-heatmap', (req, res) => {
  const departments = ['民一庭', '民二庭', '刑一庭', '行政庭', '执行局'];
  const metrics = ['一审服判', '二审维持', '发改率', '上诉率'];
  
  const data = departments.map(dept => {
    const row: Record<string, any> = { name: dept };
    metrics.forEach(metric => {
      row[metric] = Math.floor(Math.random() * 30) + 5;
    });
    return row;
  });
  
  res.json({ departments, metrics, data });
});

router.get('/deadline-warnings', (req, res) => {
  const warnings = db.prepare(`
    SELECT id, caseNumber, causeOfAction, deadline, judgeName, departmentName
    FROM cases
    WHERE status != 'closed'
    ORDER BY deadline ASC
    LIMIT 10
  `).all().map((c: any) => {
    const daysLeft = dayjs(c.deadline).diff(dayjs(), 'day');
    return {
      ...c,
      daysLeft,
      warningLevel: daysLeft <= 7 ? 'urgent' : daysLeft <= 15 ? 'warning' : 'normal',
    };
  });
  res.json(warnings);
});

router.get('/export/monthly-report', (req, res) => {
  const { month } = req.query;
  const targetMonth = month || dayjs().format('YYYY-MM');
  
  const stats = {
    month: targetMonth,
    totalCases: Math.floor(Math.random() * 100) + 50,
    closedCases: Math.floor(Math.random() * 80) + 40,
    avgTrialDays: Math.floor(Math.random() * 30) + 30,
    executionRate: Math.floor(Math.random() * 20) + 70,
    appealRate: Math.floor(Math.random() * 10) + 5,
    byDepartment: [
      { name: '民一庭', total: 25, closed: 20, rate: 80 },
      { name: '民二庭', total: 20, closed: 15, rate: 75 },
      { name: '刑一庭', total: 15, closed: 12, rate: 80 },
      { name: '行政庭', total: 10, closed: 8, rate: 80 },
      { name: '执行局', total: 30, closed: 25, rate: 83 },
    ],
  };
  
  res.json(stats);
});

export default router;
