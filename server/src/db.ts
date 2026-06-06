const initSqlJs = require('sql.js');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  db.run(`
    CREATE TABLE departments (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT);
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, departmentId TEXT, departmentName TEXT, phone TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE court_rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, capacity INTEGER NOT NULL, equipment TEXT NOT NULL);
    CREATE TABLE cases (id TEXT PRIMARY KEY, caseNumber TEXT UNIQUE NOT NULL, caseType TEXT NOT NULL, causeOfAction TEXT NOT NULL, plaintiff TEXT NOT NULL, defendant TEXT NOT NULL, plaintiffPhone TEXT, defendantPhone TEXT, plaintiffAddress TEXT, defendantAddress TEXT, status TEXT NOT NULL DEFAULT 'filed', judgeId TEXT, judgeName TEXT, clerkId TEXT, clerkName TEXT, departmentId TEXT, departmentName TEXT, estimatedDays INTEGER NOT NULL DEFAULT 60, actualDays INTEGER, createdAt TEXT NOT NULL, deadline TEXT NOT NULL, filingMaterials TEXT, description TEXT, amount REAL);
    CREATE TABLE documents (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, caseNumber TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', approverLevel INTEGER NOT NULL DEFAULT 0, currentApproverId TEXT, currentApproverName TEXT, approvals TEXT NOT NULL DEFAULT '[]', authorId TEXT NOT NULL, authorName TEXT NOT NULL, createdAt TEXT NOT NULL, submittedAt TEXT, approvedAt TEXT, suggestedPoints TEXT);
    CREATE TABLE service_records (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, caseNumber TEXT NOT NULL, method TEXT NOT NULL, receiver TEXT NOT NULL, receiverPhone TEXT, receiverEmail TEXT, documentType TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sending', receiptUrl TEXT, sentAt TEXT NOT NULL, deliveredAt TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE schedules (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, caseNumber TEXT NOT NULL, caseName TEXT NOT NULL, judgeId TEXT NOT NULL, judgeName TEXT NOT NULL, courtRoomId TEXT NOT NULL, courtRoomName TEXT NOT NULL, date TEXT NOT NULL, startTime TEXT NOT NULL, endTime TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'trial', status TEXT NOT NULL DEFAULT 'scheduled', createdAt TEXT NOT NULL, queuePosition INTEGER);
    CREATE TABLE trial_records (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, caseNumber TEXT NOT NULL, caseName TEXT NOT NULL, scheduleId TEXT, judgeName TEXT NOT NULL, courtRoomName TEXT NOT NULL, startTime TEXT NOT NULL, endTime TEXT, duration INTEGER, videoUrl TEXT, transcript TEXT, status TEXT NOT NULL DEFAULT 'pending', participants TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE execution_records (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, caseNumber TEXT NOT NULL, applicant TEXT NOT NULL, respondent TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, recoveredAmount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', createdAt TEXT NOT NULL);
    CREATE TABLE property_controls (id TEXT PRIMARY KEY, executionId TEXT NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'frozen', createdAt TEXT NOT NULL);
    CREATE TABLE execution_distributions (id TEXT PRIMARY KEY, executionId TEXT NOT NULL, recipient TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', paidAt TEXT, remark TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE notifications (id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, message TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, userId TEXT);
    CREATE TABLE system_rules (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, description TEXT);
  `);

  return db;
}

function seedData() {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const departments = [
    { id: '1', name: '民事审判第一庭', description: '负责民事案件审理' },
    { id: '2', name: '民事审判第二庭', description: '负责商事案件审理' },
    { id: '3', name: '刑事审判庭', description: '负责刑事案件审理' },
    { id: '4', name: '行政审判庭', description: '负责行政案件审理' },
    { id: '5', name: '执行局', description: '负责案件执行' },
    { id: '6', name: '立案庭', description: '负责立案登记' },
  ];
  departments.forEach(d => db.run('INSERT INTO departments VALUES (?, ?, ?)', [d.id, d.name, d.description]));
  console.log('✅ 庭室数据 (6条)');

  const users = [
    { id: '1', username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', phone: '13800000001' },
    { id: '2', username: 'president', password: '123456', name: '张院长', role: 'president', phone: '13800000002' },
    { id: '3', username: 'chief1', password: '123456', name: '李庭长', role: 'chief', departmentId: '1', departmentName: '民事审判第一庭', phone: '13800000003' },
    { id: '4', username: 'chief2', password: '123456', name: '王庭长', role: 'chief', departmentId: '2', departmentName: '民事审判第二庭', phone: '13800000004' },
    { id: '5', username: 'judge1', password: '123456', name: '陈法官', role: 'judge', departmentId: '1', departmentName: '民事审判第一庭', phone: '13800000005' },
    { id: '6', username: 'judge2', password: '123456', name: '刘法官', role: 'judge', departmentId: '1', departmentName: '民事审判第一庭', phone: '13800000006' },
    { id: '7', username: 'judge3', password: '123456', name: '赵法官', role: 'judge', departmentId: '2', departmentName: '民事审判第二庭', phone: '13800000007' },
    { id: '8', username: 'judge4', password: '123456', name: '孙法官', role: 'judge', departmentId: '3', departmentName: '刑事审判庭', phone: '13800000008' },
    { id: '9', username: 'clerk1', password: '123456', name: '周书记员', role: 'clerk', departmentId: '1', departmentName: '民事审判第一庭', phone: '13800000009' },
    { id: '10', username: 'clerk2', password: '123456', name: '吴书记员', role: 'clerk', departmentId: '2', departmentName: '民事审判第二庭', phone: '13800000010' },
    { id: '11', username: 'clerk3', password: '123456', name: '郑书记员', role: 'clerk', departmentId: '6', departmentName: '立案庭', phone: '13800000011' },
  ];
  users.forEach(u => db.run('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [u.id, u.username, u.password, u.name, u.role, u.departmentId || null, u.departmentName || null, u.phone || null, now]));
  console.log('✅ 用户数据 (11条)');

  const courtRooms = [
    { id: '1', name: '第一法庭', location: '一楼A区', capacity: 50, equipment: '["高清摄像","录音设备","电子显示屏"]' },
    { id: '2', name: '第二法庭', location: '一楼B区', capacity: 30, equipment: '["高清摄像","录音设备"]' },
    { id: '3', name: '第三法庭', location: '二楼A区', capacity: 40, equipment: '["高清摄像","录音设备","电子显示屏"]' },
    { id: '4', name: '第四法庭', location: '二楼B区', capacity: 20, equipment: '["高清摄像","录音设备"]' },
    { id: '5', name: '第五法庭', location: '三楼A区', capacity: 60, equipment: '["高清摄像","录音设备","电子显示屏","直播系统"]' },
    { id: '6', name: '少年法庭', location: '三楼B区', capacity: 25, equipment: '["高清摄像","录音设备"]' },
  ];
  courtRooms.forEach(r => db.run('INSERT INTO court_rooms VALUES (?, ?, ?, ?, ?)', [r.id, r.name, r.location, r.capacity, r.equipment]));
  console.log('✅ 法庭数据 (6条)');

  const caseTypes = ['civil', 'commercial', 'criminal', 'administrative', 'execution'];
  const statuses = ['filed', 'assigned', 'scheduled', 'trial', 'judged', 'closed', 'executing', 'executed'];
  const causes = ['民间借贷纠纷', '买卖合同纠纷', '租赁合同纠纷', '侵权责任纠纷', '劳动争议', '婚姻家庭纠纷', '继承纠纷', '交通事故损害赔偿', '金融借款合同纠纷', '物业服务合同纠纷', '建设工程施工合同纠纷', '股权转让纠纷', '保险纠纷', '知识产权纠纷', '不正当竞争纠纷'];

  function genCaseNo(i) {
    const year = 2024 + Math.floor(i / 20);
    return `(${year})京0101民初${String(i).padStart(4, '0')}号`;
  }

  for (let i = 1; i <= 55; i++) {
    const caseType = caseTypes[i % caseTypes.length];
    const status = statuses[i % statuses.length];
    const judge = users.find(u => u.role === 'judge' && u.id === String((i % 4) + 5));
    const clerk = users.find(u => u.role === 'clerk' && u.id === String((i % 3) + 9));
    const dept = departments[i % departments.length];
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD');
    const deadline = dayjs(createdAt).add(90, 'day').format('YYYY-MM-DD');

    db.run(`INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      String(i), genCaseNo(i), caseType, causes[i % causes.length],
      `原告${i}`, `被告${i}`,
      `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `北京市朝阳区XX路${i}号`, `北京市海淀区XX街${i}号`,
      status, judge?.id, judge?.name, clerk?.id, clerk?.name,
      dept.id, dept.name, 60 + Math.floor(Math.random() * 60), null,
      createdAt, deadline,
      '["起诉状","证据材料","身份证明","授权委托书"]',
      '案件描述', Math.floor(Math.random() * 1000000)
    ]);
  }
  console.log('✅ 案件数据 (55条)');

  const documents = [
    { id: '1', caseId: '1', caseNumber: '(2024)京0101民初0001号', type: 'verdict', title: '民事判决书', content: '北京市朝阳区人民法院民事判决书...', status: 'approved', approverLevel: 3, approvals: '[{"id":"5","name":"陈法官","time":"2024-01-10","comment":"同意"},{"id":"3","name":"李庭长","time":"2024-01-11","comment":"同意"},{"id":"2","name":"张院长","time":"2024-01-12","comment":"同意"}]', authorId: '5', authorName: '陈法官', createdAt: '2024-01-10', submittedAt: '2024-01-10', approvedAt: '2024-01-12' },
    { id: '2', caseId: '2', caseNumber: '(2024)京0101民初0002号', type: 'indictment', title: '民事起诉状', content: '原告：原告2，被告：被告2...', status: 'pending', approverLevel: 1, approvals: '[{"id":"6","name":"刘法官","time":"2024-01-15","comment":"同意"}]', authorId: '6', authorName: '刘法官', createdAt: '2024-01-15', submittedAt: '2024-01-15' },
    { id: '3', caseId: '3', caseNumber: '(2024)京0101民初0003号', type: 'notice', title: '开庭传票', content: '传唤事由：开庭审理...', status: 'draft', approverLevel: 0, approvals: '[]', authorId: '7', authorName: '赵法官', createdAt: '2024-01-18' },
    { id: '4', caseId: '4', caseNumber: '(2024)京0101民初0004号', type: 'ruling', title: '民事裁定书', content: '准许原告撤回起诉...', status: 'approved', approverLevel: 2, approvals: '[{"id":"7","name":"赵法官","time":"2024-01-20","comment":"同意"},{"id":"4","name":"王庭长","time":"2024-01-21","comment":"同意"}]', authorId: '7', authorName: '赵法官', createdAt: '2024-01-20', submittedAt: '2024-01-20', approvedAt: '2024-01-21' },
  ];
  documents.forEach(d => db.run('INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.id, d.caseId, d.caseNumber, d.type, d.title, d.content, d.status, d.approverLevel, d.currentApproverId || null, d.currentApproverName || null, d.approvals, d.authorId, d.authorName, d.createdAt, d.submittedAt || null, d.approvedAt || null, null]));
  console.log('✅ 文书数据 (4条)');

  const serviceRecords = [
    { id: '1', caseId: '1', caseNumber: '(2024)京0101民初0001号', method: 'direct', receiver: '被告1', receiverPhone: '13900000001', documentType: '民事判决书', status: 'delivered', sentAt: '2024-01-12', deliveredAt: '2024-01-13', createdAt: '2024-01-12' },
    { id: '2', caseId: '2', caseNumber: '(2024)京0101民初0002号', method: 'email', receiver: '被告2', receiverPhone: '13900000002', receiverEmail: 'defendant2@example.com', documentType: '开庭传票', status: 'delivered', sentAt: '2024-01-16', deliveredAt: '2024-01-16', createdAt: '2024-01-16' },
    { id: '3', caseId: '3', caseNumber: '(2024)京0101民初0003号', method: 'sms', receiver: '被告3', receiverPhone: '13900000003', documentType: '应诉通知书', status: 'delivered', sentAt: '2024-01-19', deliveredAt: '2024-01-19', createdAt: '2024-01-19' },
    { id: '4', caseId: '4', caseNumber: '(2024)京0101民初0004号', method: 'post', receiver: '被告4', receiverPhone: '13900000004', documentType: '民事裁定书', status: 'sending', sentAt: '2024-01-22', createdAt: '2024-01-22' },
    { id: '5', caseId: '5', caseNumber: '(2024)京0101民初0005号', method: 'announce', receiver: '被告5', documentType: '起诉状副本', status: 'sending', sentAt: '2024-01-25', createdAt: '2024-01-25' },
  ];
  serviceRecords.forEach(s => db.run('INSERT INTO service_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.caseId, s.caseNumber, s.method, s.receiver, s.receiverPhone || null, s.receiverEmail || null, s.documentType, s.status, s.receiptUrl || null, s.sentAt, s.deliveredAt || null, s.createdAt]));
  console.log('✅ 送达记录 (5条)');

  const schedules = [
    { id: '1', caseId: '6', caseNumber: '(2024)京0101民初0006号', caseName: '原告6诉被告6民间借贷纠纷案', judgeId: '5', judgeName: '陈法官', courtRoomId: '1', courtRoomName: '第一法庭', date: dayjs().add(1, 'day').format('YYYY-MM-DD'), startTime: '09:00', endTime: '11:00', type: 'trial', status: 'scheduled', queuePosition: 1 },
    { id: '2', caseId: '7', caseNumber: '(2024)京0101民初0007号', caseName: '原告7诉被告7买卖合同纠纷案', judgeId: '6', judgeName: '刘法官', courtRoomId: '2', courtRoomName: '第二法庭', date: dayjs().add(1, 'day').format('YYYY-MM-DD'), startTime: '14:00', endTime: '16:00', type: 'trial', status: 'scheduled', queuePosition: 2 },
    { id: '3', caseId: '8', caseNumber: '(2024)京0101民初0008号', caseName: '原告8诉被告8租赁合同纠纷案', judgeId: '5', judgeName: '陈法官', courtRoomId: '1', courtRoomName: '第一法庭', date: dayjs().add(2, 'day').format('YYYY-MM-DD'), startTime: '09:00', endTime: '10:30', type: 'trial', status: 'scheduled', queuePosition: 1 },
    { id: '4', caseId: '9', caseNumber: '(2024)京0101民初0009号', caseName: '原告9诉被告9侵权责任纠纷案', judgeId: '7', judgeName: '赵法官', courtRoomId: '3', courtRoomName: '第三法庭', date: dayjs().add(2, 'day').format('YYYY-MM-DD'), startTime: '14:00', endTime: '17:00', type: 'trial', status: 'scheduled', queuePosition: 1 },
    { id: '5', caseId: '10', caseNumber: '(2024)京0101民初0010号', caseName: '原告10诉被告10劳动争议案', judgeId: '6', judgeName: '刘法官', courtRoomId: '4', courtRoomName: '第四法庭', date: dayjs().add(3, 'day').format('YYYY-MM-DD'), startTime: '09:30', endTime: '11:30', type: 'mediation', status: 'scheduled', queuePosition: 1 },
  ];
  schedules.forEach(s => db.run('INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.caseId, s.caseNumber, s.caseName, s.judgeId, s.judgeName, s.courtRoomId, s.courtRoomName, s.date, s.startTime, s.endTime, s.type, s.status, now, s.queuePosition]));
  console.log('✅ 排期数据 (5条)');

  const trialRecords = [
    { id: '1', caseId: '1', caseNumber: '(2024)京0101民初0001号', caseName: '原告1诉被告1民间借贷纠纷案', scheduleId: null, judgeName: '陈法官', courtRoomName: '第一法庭', startTime: '2024-01-10 09:00:00', endTime: '2024-01-10 11:30:00', duration: 150, videoUrl: '/videos/trial1.mp4', transcript: '书记员：现在宣布法庭纪律...', status: 'completed', participants: '["原告1","被告1","陈法官","周书记员"]' },
    { id: '2', caseId: '2', caseNumber: '(2024)京0101民初0002号', caseName: '原告2诉被告2买卖合同纠纷案', scheduleId: null, judgeName: '刘法官', courtRoomName: '第二法庭', startTime: '2024-01-15 14:00:00', endTime: '2024-01-15 16:00:00', duration: 120, videoUrl: '/videos/trial2.mp4', transcript: '书记员：请当事人入席...', status: 'completed', participants: '["原告2","被告2","刘法官","吴书记员"]' },
  ];
  trialRecords.forEach(t => db.run('INSERT INTO trial_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [t.id, t.caseId, t.caseNumber, t.caseName, t.scheduleId || null, t.judgeName, t.courtRoomName, t.startTime, t.endTime || null, t.duration || null, t.videoUrl || null, t.transcript || null, t.status, t.participants || null, now]));
  console.log('✅ 庭审记录 (2条)');

  const executions = [
    { id: '1', caseId: '51', caseNumber: '(2024)京0101民初0051号', applicant: '原告51', respondent: '被告51', amount: 500000, recoveredAmount: 300000, status: 'executing' },
    { id: '2', caseId: '52', caseNumber: '(2024)京0101民初0052号', applicant: '原告52', respondent: '被告52', amount: 200000, recoveredAmount: 200000, status: 'executed' },
    { id: '3', caseId: '53', caseNumber: '(2024)京0101民初0053号', applicant: '原告53', respondent: '被告53', amount: 1000000, recoveredAmount: 0, status: 'pending' },
    { id: '4', caseId: '54', caseNumber: '(2024)京0101民初0054号', applicant: '原告54', respondent: '被告54', amount: 150000, recoveredAmount: 75000, status: 'executing' },
  ];
  executions.forEach(e => db.run('INSERT INTO execution_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [e.id, e.caseId, e.caseNumber, e.applicant, e.respondent, e.amount, e.recoveredAmount, e.status, now]));

  const propertyControls = [
    { id: '1', executionId: '1', type: 'bank', description: '冻结被执行人银行存款300,000元', amount: 300000, status: 'frozen' },
    { id: '2', executionId: '1', type: 'house', description: '查封被执行人位于北京市朝阳区的房产一套', amount: 5000000, status: 'sealed' },
    { id: '3', executionId: '3', type: 'car', description: '扣押被执行人奥迪A6轿车一辆', amount: 300000, status: 'detained' },
    { id: '4', executionId: '4', type: 'bank', description: '冻结被执行人银行存款75,000元', amount: 75000, status: 'frozen' },
    { id: '5', executionId: '2', type: 'bank', description: '划拨被执行人银行存款200,000元', amount: 200000, status: 'transferred' },
  ];
  propertyControls.forEach(p => db.run('INSERT INTO property_controls VALUES (?, ?, ?, ?, ?, ?, ?)', [p.id, p.executionId, p.type, p.description, p.amount, p.status, now]));

  const distributions = [
    { id: '1', executionId: '2', recipient: '原告52', amount: 200000, status: 'paid', paidAt: '2024-02-01', remark: '案款全部发放' },
    { id: '2', executionId: '1', recipient: '原告51', amount: 300000, status: 'pending', remark: '待审批发放' },
  ];
  distributions.forEach(d => db.run('INSERT INTO execution_distributions VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [d.id, d.executionId, d.recipient, d.amount, d.status, d.paidAt || null, d.remark || null, now]));
  console.log('✅ 执行数据 (4执行+5财产+2分配)');

  const notifications = [
    { id: '1', type: 'warning', title: '审限预警', message: '案件(2024)京0101民初0020号还有15天到期', userId: '5' },
    { id: '2', type: 'info', title: '新案件分配', message: '您有1个新案件已分配，请及时处理', userId: '6' },
    { id: '3', type: 'approval', title: '文书审批待办', message: '有1份文书等待您的审批', userId: '3' },
    { id: '4', type: 'success', title: '庭审完成', message: '案件(2024)京0101民初0015号庭审已完成', userId: '7' },
    { id: '5', type: 'warning', title: '系统通知', message: '系统将于今晚22:00进行维护，请提前保存数据' },
  ];
  notifications.forEach(n => db.run('INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)', [n.id, n.type, n.title, n.message, 0, now, n.userId || null]));
  console.log('✅ 通知数据 (5条)');

  const rules = [
    { id: '1', key: 'trial_warning_days', value: '15', description: '审限预警天数' },
    { id: '2', key: 'approval_timeout_hours', value: '48', description: '审批超时时间(小时)' },
    { id: '3', key: 'default_estimated_days', value: '60', description: '默认审理天数' },
    { id: '4', key: 'case_auto_assign', value: 'true', description: '是否自动分案' },
  ];
  rules.forEach(r => db.run('INSERT INTO system_rules VALUES (?, ?, ?, ?)', [r.id, r.key, r.value, r.description]));

  console.log('🎉 所有种子数据插入成功！总计110+条数据');
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    const row = stmt.get();
    const obj = {};
    columns.forEach((col, idx) => { obj[col] = row[idx]; });
    results.push(obj);
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

function execute(sql, params = []) {
  db.run(sql, params);
  return { changes: db.getRowsModified() };
}

module.exports = { initDatabase, seedData, query, queryOne, execute };
