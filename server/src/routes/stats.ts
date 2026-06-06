const express = require('express');
const { query, queryOne } = require('../db');

const router = express.Router();

router.get('/dashboard', (req, res) => {
  try {
    const totalCases = queryOne('SELECT COUNT(*) as count FROM cases')?.count || 0;
    const pendingCases = queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['filed'])?.count || 0;
    const trialCases = queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['trial'])?.count || 0;
    const closedCases = queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['closed'])?.count || 0;
    
    const totalExecutions = queryOne('SELECT COUNT(*) as count FROM execution_records')?.count || 0;
    const executingCount = queryOne('SELECT COUNT(*) as count FROM execution_records WHERE status = ?', ['executing'])?.count || 0;
    const executedAmount = queryOne('SELECT SUM(recoveredAmount) as total FROM execution_records')?.total || 0;
    
    const todaySchedules = query('SELECT * FROM schedules WHERE date = date(\'now\') ORDER BY startTime ASC');
    const warningCases = query('SELECT * FROM cases WHERE deadline <= date(\'now\', \'+15 days\') AND status NOT IN (\'closed\', \'executed\') ORDER BY deadline ASC LIMIT 10');
    
    const casesByType = [
      { type: 'civil', name: '民事', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE caseType = ?', ['civil'])?.count || 0 },
      { type: 'commercial', name: '商事', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE caseType = ?', ['commercial'])?.count || 0 },
      { type: 'criminal', name: '刑事', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE caseType = ?', ['criminal'])?.count || 0 },
      { type: 'administrative', name: '行政', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE caseType = ?', ['administrative'])?.count || 0 },
      { type: 'execution', name: '执行', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE caseType = ?', ['execution'])?.count || 0 },
    ];
    
    const casesByStatus = [
      { status: 'filed', name: '已立案', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['filed'])?.count || 0 },
      { status: 'assigned', name: '已分案', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['assigned'])?.count || 0 },
      { status: 'scheduled', name: '已排期', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['scheduled'])?.count || 0 },
      { status: 'trial', name: '审理中', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['trial'])?.count || 0 },
      { status: 'judged', name: '已判决', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['judged'])?.count || 0 },
      { status: 'closed', name: '已结案', count: queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['closed'])?.count || 0 },
    ];
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayCases = queryOne('SELECT COUNT(*) as count FROM cases WHERE DATE(createdAt) = ?', [dateStr])?.count || 0;
      const dayClosed = queryOne('SELECT COUNT(*) as count FROM cases WHERE status = ? AND DATE(createdAt) <= ?', ['closed', dateStr])?.count || 0;
      last7Days.push({ date: dateStr, newCases: dayCases, closedCases: dayClosed });
    }
    
    res.json({
      code: 200,
      data: {
        overview: {
          totalCases,
          pendingCases,
          trialCases,
          closedCases,
          totalExecutions,
          executingCount,
          executedAmount
        },
        todaySchedules,
        warningCases,
        casesByType,
        casesByStatus,
        last7Days
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

router.get('/realtime', (req, res) => {
  try {
    const now = new Date();
    const activeTrials = query('SELECT * FROM trial_records WHERE status = ?', ['ongoing']);
    const recentCases = query('SELECT * FROM cases ORDER BY createdAt DESC LIMIT 5');
    const recentNotifications = query('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 5');
    
    res.json({
      code: 200,
      data: {
        timestamp: now.toISOString(),
        activeTrials,
        recentCases,
        recentNotifications,
        stats: {
          filingToday: queryOne('SELECT COUNT(*) as count FROM cases WHERE DATE(createdAt) = DATE(\'now\')')?.count || 0,
          trialNow: activeTrials.length,
          servicePending: queryOne('SELECT COUNT(*) as count FROM service_records WHERE status = ?', ['sending'])?.count || 0,
          approvalPending: queryOne('SELECT COUNT(*) as count FROM documents WHERE status = ?', ['pending'])?.count || 0,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
