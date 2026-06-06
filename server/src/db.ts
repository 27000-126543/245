import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
let useMemory = false;

const memoryData: Record<string, any[]> = {};

function initMemoryDB() {
  console.log('⚠️  better-sqlite3不可用，使用内存数据库模式');
  console.log('⚠️  注意：内存模式下数据不会持久化，重启后丢失');
  
  const tables = [
    'departments', 'users', 'court_rooms', 'cases', 'documents',
    'service_records', 'schedules', 'trial_records', 'execution_records',
    'property_controls', 'execution_distributions', 'notifications'
  ];
  
  tables.forEach(table => {
    memoryData[table] = [];
  });
  
  useMemory = true;
}

try {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = path.join(__dirname, '../../court-system.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ 使用SQLite数据库模式');
} catch (error: any) {
  console.log('ℹ️  better-sqlite3加载失败:', error.message);
  initMemoryDB();
}

function prepare(query: string): any {
  if (useMemory) {
    return {
      all: (...params: any[]) => {
        const tableMatch = query.match(/FROM\s+(\w+)/i);
        const table = tableMatch ? tableMatch[1] : '';
        let results = memoryData[table] || [];
        
        const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
        if (whereMatch) {
          results = results.filter(item => {
            let valid = true;
            const conditions = whereMatch[1].split(/\s+AND\s+/i);
            conditions.forEach((cond: string, idx: number) => {
              if (cond.includes('LIKE')) {
                const [field] = cond.split(' LIKE ');
                const value = params[idx];
                const pattern = value.replace(/%/g, '');
                valid = valid && item[field.trim()]?.includes(pattern.replace(/'/g, ''));
              } else if (cond.includes('=')) {
                const [field] = cond.split('=');
                const value = params[idx];
                if (value != null && field && field.trim() && !field.includes('?')) {
                  valid = valid && item[field.trim()] === value;
                }
              }
            });
            return valid;
          });
        }
        
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        const offsetMatch = query.match(/OFFSET\s+(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
          results = results.slice(offset, offset + limit);
        }
        
        return results;
      },
      get: (...params: any[]) => {
        const all = prepare(query).all(...params);
        return all[0];
      },
      run: (...params: any[]) => {
        if (query.trim().toUpperCase().startsWith('INSERT')) {
          const tableMatch = query.match(/INTO\s+(\w+)/i);
          const table = tableMatch ? tableMatch[1] : '';
          const valuesMatch = query.match(/VALUES\s*\((.+?)\)/i);
          if (valuesMatch && table) {
            const fieldsMatch = query.match(/\((.+?)\)\s*VALUES/i);
            const fields = fieldsMatch ? fieldsMatch[1].split(',').map((f: string) => f.trim()) : [];
            const newItem: any = {};
            fields.forEach((field: string, idx: number) => {
              newItem[field] = params[idx];
            });
            memoryData[table].push(newItem);
          }
          return { changes: 1 };
        } else if (query.trim().toUpperCase().startsWith('UPDATE')) {
          const tableMatch = query.match(/UPDATE\s+(\w+)/i);
          const table = tableMatch ? tableMatch[1] : '';
          const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
          const whereMatch = query.match(/WHERE\s+(.+)$/i);
          if (setMatch && table) {
            const updates = setMatch[1].split(',').map((s: string) => s.trim().split('=')[0].trim());
            memoryData[table].forEach((item, idx) => {
              if (whereMatch) {
                const cond = whereMatch[1];
                if (cond.includes('=')) {
                  const [field] = cond.split('=');
                  if (item[field.trim()] === params[params.length - 1]) {
                    updates.forEach((u: string, i: number) => {
                      item[u] = params[i];
                    });
                  }
                }
              }
            });
          }
          return { changes: 1 };
        } else if (query.trim().toUpperCase().startsWith('DELETE')) {
          const tableMatch = query.match(/FROM\s+(\w+)/i);
          const table = tableMatch ? tableMatch[1] : '';
          const whereMatch = query.match(/WHERE\s+(.+)$/i);
          if (table && whereMatch) {
            const cond = whereMatch[1];
            if (cond.includes('=')) {
              const [field] = cond.split('=');
              memoryData[table] = memoryData[table].filter(
                item => item[field.trim()] !== params[params.length - 1]
              );
            }
          }
          return { changes: 1 };
        }
        return { changes: 0 };
      }
    };
  }
  return db.prepare(query);
}

function exec(query: string) {
  if (useMemory) {
    const statements = query.split(';').filter(s => s.trim());
    statements.forEach(stmt => {
      if (stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
        const tableMatch = stmt.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
        if (tableMatch && !memoryData[tableMatch[1]]) {
          memoryData[tableMatch[1]] = [];
        }
      }
    });
    return;
  }
  return db.exec(query);
}

const database = {
  prepare,
  exec,
  pragma: () => {},
};

export function initDatabase() {
  if (useMemory) {
    const tables = [
      'departments', 'users', 'court_rooms', 'cases', 'documents',
      'service_records', 'schedules', 'trial_records', 'execution_records',
      'property_controls', 'execution_distributions', 'notifications'
    ];
    tables.forEach(table => {
      if (!memoryData[table]) memoryData[table] = [];
    });
    console.log('✅ 内存数据库表结构初始化完成');
  } else {
    database.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        password TEXT NOT NULL DEFAULT '123456'
      );

      CREATE TABLE IF NOT EXISTS court_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        equipment TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        caseNumber TEXT UNIQUE NOT NULL,
        caseType TEXT NOT NULL,
        causeOfAction TEXT NOT NULL,
        plaintiff TEXT NOT NULL,
        defendant TEXT NOT NULL,
        plaintiffPhone TEXT,
        defendantPhone TEXT,
        plaintiffAddress TEXT,
        defendantAddress TEXT,
        status TEXT NOT NULL DEFAULT 'filed',
        judgeId TEXT,
        judgeName TEXT,
        clerkId TEXT,
        clerkName TEXT,
        departmentId TEXT,
        departmentName TEXT,
        estimatedDays INTEGER NOT NULL DEFAULT 60,
        actualDays INTEGER,
        createdAt TEXT NOT NULL,
        deadline TEXT NOT NULL,
        filingMaterials TEXT,
        description TEXT,
        amount REAL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        caseNumber TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        approverLevel INTEGER NOT NULL DEFAULT 0,
        currentApproverId TEXT,
        currentApproverName TEXT,
        approvals TEXT NOT NULL DEFAULT '[]',
        authorId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        submittedAt TEXT,
        approvedAt TEXT,
        suggestedPoints TEXT
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        caseNumber TEXT NOT NULL,
        method TEXT NOT NULL,
        receiver TEXT NOT NULL,
        receiverPhone TEXT,
        receiverEmail TEXT,
        documentType TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sending',
        receiptUrl TEXT,
        sentAt TEXT NOT NULL,
        deliveredAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        caseNumber TEXT NOT NULL,
        caseName TEXT NOT NULL,
        judgeId TEXT NOT NULL,
        judgeName TEXT NOT NULL,
        courtRoomId TEXT NOT NULL,
        courtRoomName TEXT NOT NULL,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'trial',
        status TEXT NOT NULL DEFAULT 'scheduled',
        createdAt TEXT NOT NULL,
        queuePosition INTEGER
      );

      CREATE TABLE IF NOT EXISTS trial_records (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        caseNumber TEXT NOT NULL,
        caseName TEXT NOT NULL,
        scheduleId TEXT,
        judgeName TEXT NOT NULL,
        courtRoomName TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        videoUrl TEXT,
        transcript TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        participants TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS execution_records (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        caseNumber TEXT NOT NULL,
        applicant TEXT NOT NULL,
        respondent TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        recoveredAmount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS property_controls (
        id TEXT PRIMARY KEY,
        executionId TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'frozen',
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS execution_distributions (
        id TEXT PRIMARY KEY,
        executionId TEXT NOT NULL,
        recipient TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        paidAt TEXT,
        remark TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'info',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        userId TEXT
      );
    `);
    console.log('✅ SQLite数据库表结构初始化完成');
  }
}

export function seedData() {
  const deptCount = prepare('SELECT COUNT(*) as count FROM departments').get();
  if (deptCount && deptCount.count > 0) {
    console.log('ℹ️  种子数据已存在，跳过插入');
    return;
  }

  const insertDept = prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)');
  const departments = [
    { id: '1', name: '民事审判第一庭', code: 'MS1' },
    { id: '2', name: '民事审判第二庭', code: 'MS2' },
    { id: '3', name: '刑事审判第一庭', code: 'XS1' },
    { id: '4', name: '行政审判庭', code: 'XZ' },
    { id: '5', name: '执行局', code: 'ZX' },
    { id: '6', name: '立案庭', code: 'LA' },
  ];
  departments.forEach(d => insertDept.run(d.id, d.name, d.code));
  console.log('✅ 庭室数据插入完成');

  const insertUser = prepare(`
    INSERT INTO users (id, username, name, role, department, phone, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    { id: '1', username: 'admin', name: '系统管理员', role: 'admin', department: '6', phone: '13800000001', email: 'admin@court.gov.cn', password: '123456' },
    { id: '2', username: 'president', name: '张院长', role: 'president', department: '0', phone: '13800000002', email: 'president@court.gov.cn', password: '123456' },
    { id: '3', username: 'chief1', name: '李庭长', role: 'chief', department: '1', phone: '13800000003', email: 'chief1@court.gov.cn', password: '123456' },
    { id: '4', username: 'chief2', name: '王庭长', role: 'chief', department: '2', phone: '13800000004', email: 'chief2@court.gov.cn', password: '123456' },
    { id: '5', username: 'judge1', name: '陈法官', role: 'judge', department: '1', phone: '13800000005', email: 'judge1@court.gov.cn', password: '123456' },
    { id: '6', username: 'judge2', name: '刘法官', role: 'judge', department: '1', phone: '13800000006', email: 'judge2@court.gov.cn', password: '123456' },
    { id: '7', username: 'judge3', name: '赵法官', role: 'judge', department: '2', phone: '13800000007', email: 'judge3@court.gov.cn', password: '123456' },
    { id: '8', username: 'judge4', name: '孙法官', role: 'judge', department: '3', phone: '13800000008', email: 'judge4@court.gov.cn', password: '123456' },
    { id: '9', username: 'clerk1', name: '周书记员', role: 'clerk', department: '1', phone: '13800000009', email: 'clerk1@court.gov.cn', password: '123456' },
    { id: '10', username: 'clerk2', name: '吴书记员', role: 'clerk', department: '2', phone: '13800000010', email: 'clerk2@court.gov.cn', password: '123456' },
    { id: '11', username: 'clerk3', name: '郑书记员', role: 'clerk', department: '6', phone: '13800000011', email: 'clerk3@court.gov.cn', password: '123456' },
  ];
  users.forEach(u => insertUser.run(u.id, u.username, u.name, u.role, u.department, u.phone, u.email, u.password));
  console.log('✅ 用户数据插入完成');

  const insertCourtRoom = prepare(`
    INSERT INTO court_rooms (id, name, location, capacity, equipment)
    VALUES (?, ?, ?, ?, ?)
  `);

  const courtRooms = [
    { id: '1', name: '第一法庭', location: '一楼A区', capacity: 30, equipment: JSON.stringify(['数字庭审系统', '录音录像', '证据展示台']) },
    { id: '2', name: '第二法庭', location: '一楼A区', capacity: 50, equipment: JSON.stringify(['数字庭审系统', '录音录像', '证据展示台', '同声传译']) },
    { id: '3', name: '第三法庭', location: '二楼B区', capacity: 20, equipment: JSON.stringify(['数字庭审系统', '录音录像']) },
    { id: '4', name: '第四法庭', location: '二楼B区', capacity: 30, equipment: JSON.stringify(['数字庭审系统', '录音录像', '证据展示台']) },
    { id: '5', name: '第五法庭', location: '三楼C区', capacity: 80, equipment: JSON.stringify(['数字庭审系统', '录音录像', '证据展示台', '直播系统']) },
    { id: '6', name: '少年法庭', location: '三楼C区', capacity: 15, equipment: JSON.stringify(['数字庭审系统', '录音录像', '心理咨询设备']) },
  ];
  courtRooms.forEach(c => insertCourtRoom.run(c.id, c.name, c.location, c.capacity, c.equipment));
  console.log('✅ 法庭数据插入完成');

  const insertCase = prepare(`
    INSERT INTO cases (id, caseNumber, caseType, causeOfAction, plaintiff, defendant, 
      plaintiffPhone, defendantPhone, plaintiffAddress, defendantAddress, status,
      judgeId, judgeName, clerkId, clerkName, departmentId, departmentName,
      estimatedDays, createdAt, deadline, filingMaterials, description, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const caseTypes = ['civil', 'criminal', 'administrative', 'execution'] as const;
  const causeOfActions = [
    '民间借贷纠纷', '买卖合同纠纷', '离婚纠纷', '交通事故责任纠纷',
    '劳动争议', '房屋租赁合同纠纷', '物业服务合同纠纷', '信用卡纠纷',
    '故意伤害罪', '盗窃罪', '诈骗罪', '交通肇事罪',
    '行政处罚争议', '行政确认争议', '行政赔偿争议',
    '金融借款合同纠纷', '建设工程施工合同纠纷',
  ];
  const statuses = ['filed', 'assigned', 'served', 'scheduled', 'trial', 'document', 'closed', 'executing'] as const;

  function generateCaseNumber(index: number): string {
    const year = new Date().getFullYear();
    return `(${year})京0101民初${String(index).padStart(4, '0')}号`;
  }

  for (let i = 1; i <= 55; i++) {
    const caseType = caseTypes[i % caseTypes.length];
    const status = statuses[i % statuses.length];
    const judge = users.find(u => u.role === 'judge' && u.id === String((i % 4) + 5));
    const clerk = users.find(u => u.role === 'clerk' && u.id === String((i % 3) + 9));
    const dept = departments[i % departments.length];
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD');
    const deadline = dayjs(createdAt).add(90, 'day').format('YYYY-MM-DD');

    insertCase.run(
      String(i),
      generateCaseNumber(i),
      caseType,
      causeOfActions[i % causeOfActions.length],
      `原告${i}`,
      `被告${i}`,
      `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `北京市朝阳区XX路${i}号`,
      `北京市海淀区XX街${i}号`,
      status,
      judge?.id,
      judge?.name,
      clerk?.id,
      clerk?.name,
      dept.id,
      dept.name,
      60 + Math.floor(Math.random() * 60),
      createdAt,
      deadline,
      JSON.stringify(['起诉状', '证据材料', '身份证明', '授权委托书']),
      '这是一个测试案件的详细描述...',
      Math.floor(Math.random() * 1000000)
    );
  }
  console.log('✅ 55条案件数据插入完成');

  const insertDoc = prepare(`
    INSERT INTO documents (id, caseId, caseNumber, type, title, content, status,
      approverLevel, currentApproverId, currentApproverName, approvals,
      authorId, authorName, createdAt, submittedAt, suggestedPoints)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const documents = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1),
      type: 'judgment', title: '民事判决书',
      content: '原告张三与被告李四民间借贷纠纷一案，本院于2024年1月15日立案后，依法适用普通程序，公开开庭进行了审理。本案现已审理终结。原告张三向本院提出诉讼请求：1. 判令被告偿还原告借款本金125000元；2. 判令被告支付利息。事实和理由：原被告系朋友关系，2023年5月被告因资金周转向原告借款125000元，约定月利率2%。借款到期后，被告未还款。本院认为，合法的借贷关系受法律保护。依照《中华人民共和国民法典》第六百七十五条、第六百七十六条之规定，判决如下：一、被告李四于本判决生效之日起十日内偿还原告张三借款本金125000元；二、被告李四于本判决生效之日起十日内支付原告张三利息。',
      status: 'pending_chief', approverLevel: 1,
      currentApproverId: '3', currentApproverName: '李庭长',
      approvals: JSON.stringify([{ id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'pending', createdAt: '2024-03-02' }]),
      authorId: '5', authorName: '陈法官',
      createdAt: '2024-03-01', submittedAt: '2024-03-02',
      suggestedPoints: JSON.stringify(['1. 借款事实认定清楚，证据充分', '2. 利息计算符合法律规定', '3. 被告应承担全部还款责任']),
    },
    {
      id: '2', caseId: '2', caseNumber: generateCaseNumber(2),
      type: 'ruling', title: '民事裁定书',
      content: '原告王五与被告赵六买卖合同纠纷一案，本院依法进行了审理。本案在审理过程中，被告赵六在提交答辩状期间对管辖权提出异议，认为本案应由被告住所地人民法院管辖。经审查，本院认为，因合同纠纷提起的诉讼，由被告住所地或者合同履行地人民法院管辖。本案中，被告住所地在北京市西城区，故本院对本案无管辖权。依照《中华人民共和国民事诉讼法》第二十四条、第一百三十条第一款之规定，裁定如下：本案移送北京市西城区人民法院处理。',
      status: 'draft', approverLevel: 0,
      approvals: '[]',
      authorId: '6', authorName: '刘法官',
      createdAt: '2024-03-05', submittedAt: null as any,
      suggestedPoints: JSON.stringify(['1. 管辖异议审查程序合法', '2. 移送有管辖权法院处理']),
    },
    {
      id: '3', caseId: '3', caseNumber: generateCaseNumber(3),
      type: 'mediation', title: '民事调解书',
      content: '本案在审理过程中，经本院主持调解，双方当事人自愿达成如下协议：一、被告李四于2024年3月31日前一次性给付原告张三借款本金100000元；二、如被告按期履行，原告自愿放弃利息请求；三、案件受理费由被告负担。上述协议，不违反法律规定，本院予以确认。本调解书经双方当事人签收后，即具有法律效力。',
      status: 'approved', approverLevel: 2,
      approvals: JSON.stringify([
        { id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'approved', createdAt: '2024-02-21', comment: '同意，调解方案合理' },
        { id: '2', level: 2, approverId: '2', approverName: '张院长', status: 'approved', createdAt: '2024-02-22', comment: '同意' },
      ]),
      authorId: '5', authorName: '陈法官',
      createdAt: '2024-02-20', submittedAt: '2024-02-21', approvedAt: '2024-02-22',
      suggestedPoints: null as any,
    },
    {
      id: '4', caseId: '4', caseNumber: generateCaseNumber(4),
      type: 'notice', title: '开庭传票',
      content: '案号：(2024)京0101民初0004号。被传唤人：赵六。案由：买卖合同纠纷。传唤事由：开庭审理。应到时间：2024年3月15日9时00分。应到处所：本院第二法庭。注意事项：1. 请携带本人身份证件；2. 请携带证据原件；3. 请准时到庭。',
      status: 'approved', approverLevel: 0,
      approvals: '[]',
      authorId: '7', authorName: '赵法官',
      createdAt: '2024-03-04', submittedAt: '2024-03-04', approvedAt: '2024-03-04',
      suggestedPoints: null as any,
    },
  ];
  documents.forEach(d => insertDoc.run(
    d.id, d.caseId, d.caseNumber, d.type, d.title, d.content, d.status,
    d.approverLevel, d.currentApproverId, d.currentApproverName, d.approvals,
    d.authorId, d.authorName, d.createdAt, d.submittedAt, d.suggestedPoints
  ));
  console.log('✅ 文书数据插入完成');

  const insertService = prepare(`
    INSERT INTO service_records (id, caseId, caseNumber, method, receiver, receiverPhone,
      receiverEmail, documentType, status, sentAt, deliveredAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const serviceRecords = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1),
      method: 'sms', receiver: '李四', receiverPhone: '13800138001', receiverEmail: null as any,
      documentType: '应诉通知书', status: 'delivered',
      sentAt: '2024-01-20 10:30:00', deliveredAt: '2024-01-20 10:30:15', createdAt: '2024-01-20',
    },
    {
      id: '2', caseId: '1', caseNumber: generateCaseNumber(1),
      method: 'email', receiver: '张三', receiverPhone: null as any, receiverEmail: 'zhangsan@example.com',
      documentType: '受理通知书', status: 'delivered',
      sentAt: '2024-01-16 09:00:00', deliveredAt: '2024-01-16 09:05:00', createdAt: '2024-01-16',
    },
    {
      id: '3', caseId: '2', caseNumber: generateCaseNumber(2),
      method: 'announcement', receiver: '赵六', receiverPhone: null as any, receiverEmail: null as any,
      documentType: '公告送达', status: 'sent',
      sentAt: '2024-02-01', deliveredAt: null as any, createdAt: '2024-02-01',
    },
    {
      id: '4', caseId: '4', caseNumber: generateCaseNumber(4),
      method: 'sms', receiver: '赵六', receiverPhone: '13900139002', receiverEmail: null as any,
      documentType: '开庭传票', status: 'delivered',
      sentAt: '2024-03-05 14:00:00', deliveredAt: '2024-03-05 14:02:30', createdAt: '2024-03-05',
    },
    {
      id: '5', caseId: '5', caseNumber: generateCaseNumber(5),
      method: 'email', receiver: '被告5', receiverPhone: null as any, receiverEmail: 'defendant5@example.com',
      documentType: '起诉状副本', status: 'sending',
      sentAt: '2024-03-06 08:30:00', deliveredAt: null as any, createdAt: '2024-03-06',
    },
  ];
  serviceRecords.forEach(s => insertService.run(
    s.id, s.caseId, s.caseNumber, s.method, s.receiver, s.receiverPhone,
    s.receiverEmail, s.documentType, s.status, s.sentAt, s.deliveredAt, s.createdAt
  ));
  console.log('✅ 送达记录插入完成');

  const today = dayjs();
  const insertSchedule = prepare(`
    INSERT INTO schedules (id, caseId, caseNumber, caseName, judgeId, judgeName,
      courtRoomId, courtRoomName, date, startTime, endTime, type, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schedules = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1), caseName: '张三诉李四民间借贷纠纷',
      judgeId: '5', judgeName: '陈法官', courtRoomId: '1', courtRoomName: '第一法庭',
      date: today.add(1, 'day').format('YYYY-MM-DD'),
      startTime: '09:00', endTime: '11:00',
      type: 'trial', status: 'scheduled', createdAt: '2024-03-01',
    },
    {
      id: '2', caseId: '2', caseNumber: generateCaseNumber(2), caseName: '王五诉赵六买卖合同纠纷',
      judgeId: '6', judgeName: '刘法官', courtRoomId: '2', courtRoomName: '第二法庭',
      date: today.add(2, 'day').format('YYYY-MM-DD'),
      startTime: '09:00', endTime: '12:00',
      type: 'trial', status: 'scheduled', createdAt: '2024-03-02',
    },
    {
      id: '3', caseId: '3', caseNumber: generateCaseNumber(3), caseName: '孙七诉周八离婚纠纷',
      judgeId: '5', judgeName: '陈法官', courtRoomId: '3', courtRoomName: '第三法庭',
      date: today.subtract(1, 'day').format('YYYY-MM-DD'),
      startTime: '14:00', endTime: '15:30',
      type: 'trial', status: 'completed', createdAt: '2024-02-28',
    },
    {
      id: '4', caseId: '4', caseNumber: generateCaseNumber(4), caseName: '钱九诉吴十劳动争议',
      judgeId: '7', judgeName: '赵法官', courtRoomId: '4', courtRoomName: '第四法庭',
      date: today.add(3, 'day').format('YYYY-MM-DD'),
      startTime: '10:00', endTime: '11:30',
      type: 'mediation', status: 'scheduled', createdAt: '2024-03-03',
    },
    {
      id: '5', caseId: '5', caseNumber: generateCaseNumber(5), caseName: '郑十一诉王十二房屋租赁纠纷',
      judgeId: '6', judgeName: '刘法官', courtRoomId: '1', courtRoomName: '第一法庭',
      date: today.add(5, 'day').format('YYYY-MM-DD'),
      startTime: '14:00', endTime: '16:00',
      type: 'trial', status: 'queued', createdAt: '2024-03-04',
    },
  ];
  schedules.forEach(s => insertSchedule.run(
    s.id, s.caseId, s.caseNumber, s.caseName, s.judgeId, s.judgeName,
    s.courtRoomId, s.courtRoomName, s.date, s.startTime, s.endTime, s.type, s.status, s.createdAt
  ));
  console.log('✅ 排期数据插入完成');

  const insertTrial = prepare(`
    INSERT INTO trial_records (id, caseId, caseNumber, caseName, scheduleId, judgeName,
      courtRoomName, startTime, endTime, duration, videoUrl, transcript, status, participants, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrial.run(
    '1', '3', generateCaseNumber(3), '孙七诉周八离婚纠纷', '3',
    '陈法官', '第三法庭', '14:00', '15:30', 90, '/records/001.mp4',
    '书记员：现在宣布法庭纪律。根据《中华人民共和国人民法院法庭规则》的规定，旁听人员必须遵守下列纪律：一、不得录音、录像和摄影；二、不得随意走动和进入审判区；三、不得发言、提问；四、不得鼓掌、喧哗、哄闹和实施其他妨害审判活动的行为。\n审判长：现在开庭。首先核对当事人身份。原告，你的姓名、出生年月日、民族、职业、住址？\n原告：孙七，1985年5月10日出生，汉族，职员，住北京市朝阳区XX路。\n审判长：被告，你的姓名、出生年月日、民族、职业、住址？\n被告：周八，1983年8月15日出生，汉族，职员，住北京市海淀区XX街。\n审判长：原告陈述诉讼请求及事实理由。\n原告：诉讼请求：1. 请求判决原被告离婚；2. 婚生子孙某某由原告抚养，被告每月支付抚养费2000元；3. 依法分割夫妻共同财产。事实和理由：原被告于2015年登记结婚，婚后育有一子。近年来双方因家庭琐事经常发生争吵，夫妻感情确已破裂，无和好可能。',
    'completed', JSON.stringify(['陈法官', '周书记员', '孙七', '周八', '李律师']),
    '2024-02-28'
  );

  insertTrial.run(
    '2', '1', generateCaseNumber(1), '张三诉李四民间借贷纠纷', null,
    '陈法官', '第一法庭', '09:00', null, null, null, null,
    'pending', JSON.stringify(['陈法官', '周书记员']),
    today.add(1, 'day').format('YYYY-MM-DD')
  );
  console.log('✅ 庭审记录插入完成');

  const insertExecution = prepare(`
    INSERT INTO execution_records (id, caseId, caseNumber, applicant, respondent, amount,
      recoveredAmount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const executions = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1),
      applicant: '张三', respondent: '李四',
      amount: 125000, recoveredAmount: 125000, status: 'completed',
      createdAt: '2024-03-01',
    },
    {
      id: '2', caseId: '4', caseNumber: generateCaseNumber(4),
      applicant: '王五', respondent: '赵六',
      amount: 500000, recoveredAmount: 0, status: 'executing',
      createdAt: '2024-03-04',
    },
    {
      id: '3', caseId: '6', caseNumber: generateCaseNumber(6),
      applicant: '钱九', respondent: '吴十',
      amount: 85000, recoveredAmount: 0, status: 'pending',
      createdAt: '2024-03-05',
    },
    {
      id: '4', caseId: '8', caseNumber: generateCaseNumber(8),
      applicant: '郑十一', respondent: '王十二',
      amount: 320000, recoveredAmount: 150000, status: 'executing',
      createdAt: '2024-02-25',
    },
  ];
  executions.forEach(e => insertExecution.run(
    e.id, e.caseId, e.caseNumber, e.applicant, e.respondent,
    e.amount, e.recoveredAmount, e.status, e.createdAt
  ));

  const insertPropertyControl = prepare(`
    INSERT INTO property_controls (id, executionId, type, description, amount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const propertyControls = [
    { id: '1', executionId: '1', type: 'bank_account', description: '中国工商银行账户冻结（尾号8888）', amount: 125000, status: 'frozen', createdAt: '2024-03-02' },
    { id: '2', executionId: '1', type: 'house', description: '朝阳区建国路88号房产查封', amount: 2000000, status: 'sealed', createdAt: '2024-03-03' },
    { id: '3', executionId: '2', type: 'vehicle', description: '车牌号京A12345奔驰车辆查封', amount: 450000, status: 'sealed', createdAt: '2024-03-05' },
    { id: '4', executionId: '2', type: 'bank_account', description: '中国建设银行账户冻结（尾号6666）', amount: 89500, status: 'frozen', createdAt: '2024-03-05' },
    { id: '5', executionId: '4', type: 'bank_account', description: '招商银行账户冻结（尾号9999）', amount: 150000, status: 'frozen', createdAt: '2024-02-28' },
  ];
  propertyControls.forEach(p => insertPropertyControl.run(
    p.id, p.executionId, p.type, p.description, p.amount, p.status, p.createdAt
  ));

  const insertDistribution = prepare(`
    INSERT INTO execution_distributions (id, executionId, recipient, amount, status, paidAt, remark, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDistribution.run(
    '1', '1', '张三', 125000, 'paid', '2024-03-10', '案款全部发还申请人', '2024-03-08'
  );

  insertDistribution.run(
    '2', '4', '郑十一', 150000, 'paid', '2024-03-02', '部分案款发还', '2024-03-01'
  );
  console.log('✅ 执行数据插入完成');

  const insertNotification = prepare(`
    INSERT INTO notifications (id, type, title, message, read, createdAt, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const notifications = [
    { id: '1', type: 'warning', title: '审限预警', message: '案件(2024)京0101民初0005号还有10天到期，请及时处理。', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '5' },
    { id: '2', type: 'info', title: '排期通知', message: '您有新的庭审排期：明天上午9:00 第一法庭', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '5' },
    { id: '3', type: 'success', title: '送达完成', message: '案件(2024)京0101民初0001号已完成电子送达', read: 1, createdAt: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), userId: '9' },
    { id: '4', type: 'warning', title: '审限预警', message: '案件(2024)京0101民初0008号还有7天到期，请尽快结案。', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '6' },
    { id: '5', type: 'info', title: '审批提醒', message: '您有1份待审批的文书，请及时处理', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '3' },
  ];
  notifications.forEach(n => insertNotification.run(
    n.id, n.type, n.title, n.message, n.read ? 1 : 0, n.createdAt, n.userId
  ));
  console.log('✅ 通知数据插入完成');

  console.log('\n🎉 所有种子数据插入成功！总计：');
  console.log('   - 庭室：6个');
  console.log('   - 用户：11个');
  console.log('   - 法庭：6个');
  console.log('   - 案件：55个');
  console.log('   - 文书：4个');
  console.log('   - 送达记录：5个');
  console.log('   - 排期：5个');
  console.log('   - 庭审记录：2个');
  console.log('   - 执行记录：4个');
  console.log('   - 财产控制：5条');
  console.log('   - 案款分配：2条');
  console.log('   - 通知：5条');
}

export default database;
