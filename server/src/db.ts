import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import type {
  User, Department, CourtRoom, Case, Document, ServiceRecord,
  Schedule, TrialRecord, ExecutionRecord, PropertyControl,
  ExecutionDistribution, Notification
} from './types';

export interface Database {
  users: User[];
  departments: Department[];
  courtRooms: CourtRoom[];
  cases: Case[];
  documents: Document[];
  serviceRecords: ServiceRecord[];
  schedules: Schedule[];
  trialRecords: TrialRecord[];
  executionRecords: ExecutionRecord[];
  propertyControls: PropertyControl[];
  executionDistributions: ExecutionDistribution[];
  notifications: Notification[];
}

let db: Database;

export function initDatabase() {
  const today = dayjs();

  const departments: Department[] = [
    { id: '1', name: '民事审判第一庭', code: 'MS1' },
    { id: '2', name: '民事审判第二庭', code: 'MS2' },
    { id: '3', name: '刑事审判第一庭', code: 'XS1' },
    { id: '4', name: '行政审判庭', code: 'XZ' },
    { id: '5', name: '执行局', code: 'ZX' },
    { id: '6', name: '立案庭', code: 'LA' },
  ];

  const users: User[] = [
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

  const courtRooms: CourtRoom[] = [
    { id: '1', name: '第一法庭', location: '一楼A区', capacity: 30, equipment: ['数字庭审系统', '录音录像', '证据展示台'] },
    { id: '2', name: '第二法庭', location: '一楼A区', capacity: 50, equipment: ['数字庭审系统', '录音录像', '证据展示台', '同声传译'] },
    { id: '3', name: '第三法庭', location: '二楼B区', capacity: 20, equipment: ['数字庭审系统', '录音录像'] },
    { id: '4', name: '第四法庭', location: '二楼B区', capacity: 30, equipment: ['数字庭审系统', '录音录像', '证据展示台'] },
    { id: '5', name: '第五法庭', location: '三楼C区', capacity: 80, equipment: ['数字庭审系统', '录音录像', '证据展示台', '直播系统'] },
    { id: '6', name: '少年法庭', location: '三楼C区', capacity: 15, equipment: ['数字庭审系统', '录音录像', '心理咨询设备'] },
  ];

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

  const cases: Case[] = [];
  for (let i = 1; i <= 50; i++) {
    const caseType = caseTypes[i % caseTypes.length];
    const status = statuses[i % statuses.length];
    const judge = users.find(u => u.role === 'judge' && u.id === String((i % 4) + 5));
    const clerk = users.find(u => u.role === 'clerk' && u.id === String((i % 3) + 9));
    const dept = departments[i % departments.length];
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD');
    const deadline = dayjs(createdAt).add(90, 'day').format('YYYY-MM-DD');

    cases.push({
      id: String(i),
      caseNumber: generateCaseNumber(i),
      caseType,
      causeOfAction: causeOfActions[i % causeOfActions.length],
      plaintiff: `原告${i}`,
      defendant: `被告${i}`,
      plaintiffPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      defendantPhone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      plaintiffAddress: `北京市朝阳区XX路${i}号`,
      defendantAddress: `北京市海淀区XX街${i}号`,
      status,
      judgeId: judge?.id,
      judgeName: judge?.name,
      clerkId: clerk?.id,
      clerkName: clerk?.name,
      departmentId: dept.id,
      departmentName: dept.name,
      estimatedDays: 60 + Math.floor(Math.random() * 60),
      actualDays: status === 'closed' ? Math.floor(Math.random() * 60) + 30 : undefined,
      createdAt,
      deadline,
      filingMaterials: ['起诉状', '证据材料', '身份证明', '授权委托书'],
      description: '这是一个测试案件的详细描述...',
      amount: Math.floor(Math.random() * 1000000),
    });
  }

  const documents: Document[] = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1),
      type: 'judgment', title: '民事判决书',
      content: '原告张三与被告李四民间借贷纠纷一案，本院于2024年1月15日立案后，依法适用普通程序，公开开庭进行了审理...',
      status: 'pending_chief', approverLevel: 1,
      currentApproverId: '3', currentApproverName: '李庭长',
      approvals: JSON.stringify([{ id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'pending', createdAt: '2024-03-02' }]),
      authorId: '5', authorName: '陈法官',
      createdAt: '2024-03-01', submittedAt: '2024-03-02',
      suggestedPoints: JSON.stringify(['1. 借款事实认定清楚', '2. 利息计算符合法律规定', '3. 被告应承担还款责任']),
    },
    {
      id: '2', caseId: '2', caseNumber: generateCaseNumber(2),
      type: 'ruling', title: '民事裁定书',
      content: '原告王五与被告赵六买卖合同纠纷一案，本院依法进行了审理...',
      status: 'draft', approverLevel: 0,
      approvals: '[]',
      authorId: '6', authorName: '刘法官',
      createdAt: '2024-03-05',
      suggestedPoints: JSON.stringify(['1. 管辖异议审查', '2. 移送有管辖权法院']),
    },
    {
      id: '3', caseId: '3', caseNumber: generateCaseNumber(3),
      type: 'mediation', title: '民事调解书',
      content: '本案在审理过程中，经本院主持调解，双方当事人自愿达成如下协议...',
      status: 'approved', approverLevel: 2,
      approvals: JSON.stringify([
        { id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'approved', createdAt: '2024-02-21', comment: '同意' },
        { id: '2', level: 2, approverId: '2', approverName: '张院长', status: 'approved', createdAt: '2024-02-22', comment: '同意' },
      ]),
      authorId: '5', authorName: '陈法官',
      createdAt: '2024-02-20', submittedAt: '2024-02-21', approvedAt: '2024-02-22',
    },
  ];

  const serviceRecords: ServiceRecord[] = [
    {
      id: '1', caseId: '1', caseNumber: generateCaseNumber(1),
      method: 'sms', receiver: '李四', receiverPhone: '13800138001',
      documentType: '应诉通知书', status: 'delivered',
      sentAt: '2024-01-20 10:30:00', deliveredAt: '2024-01-20 10:30:15', createdAt: '2024-01-20',
    },
    {
      id: '2', caseId: '1', caseNumber: generateCaseNumber(1),
      method: 'email', receiver: '张三', receiverEmail: 'zhangsan@example.com',
      documentType: '受理通知书', status: 'delivered',
      sentAt: '2024-01-16 09:00:00', deliveredAt: '2024-01-16 09:05:00', createdAt: '2024-01-16',
    },
    {
      id: '3', caseId: '2', caseNumber: generateCaseNumber(2),
      method: 'announcement', receiver: '赵六',
      documentType: '公告送达', status: 'sent',
      sentAt: '2024-02-01', createdAt: '2024-02-01',
    },
  ];

  const schedules: Schedule[] = [
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
  ];

  const trialRecords: TrialRecord[] = [
    {
      id: '1', caseId: '3', caseNumber: generateCaseNumber(3), caseName: '孙七诉周八离婚纠纷',
      scheduleId: '3', judgeName: '陈法官', courtRoomName: '第三法庭',
      startTime: '14:00', endTime: '15:30', duration: 90,
      videoUrl: '/records/001.mp4',
      transcript: '书记员：现在宣布法庭纪律...\n审判长：现在开庭。首先核对当事人身份...\n原告：诉讼请求如下...\n被告：答辩意见如下...',
      status: 'completed',
      participants: JSON.stringify(['陈法官', '周书记员', '张三', '李四', '王五律师']),
      createdAt: '2024-02-28',
    },
  ];

  const executionRecords: ExecutionRecord[] = [
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
  ];

  const propertyControls: PropertyControl[] = [
    { id: '1', executionId: '1', type: 'bank_account', description: '中国工商银行账户冻结', amount: 125000, status: 'frozen', createdAt: '2024-03-02' },
    { id: '2', executionId: '1', type: 'house', description: '朝阳区XX小区房产查封', amount: 2000000, status: 'sealed', createdAt: '2024-03-03' },
    { id: '3', executionId: '2', type: 'vehicle', description: '车牌号京A12345车辆查封', amount: 150000, status: 'sealed', createdAt: '2024-03-05' },
  ];

  const executionDistributions: ExecutionDistribution[] = [
    { id: '1', executionId: '1', recipient: '张三', amount: 125000, status: 'paid', paidAt: '2024-03-10', createdAt: '2024-03-08' },
  ];

  const notifications: Notification[] = [
    { id: '1', type: 'warning', title: '审限预警', message: '案件(2024)京0101民初0005号还有10天到期，请及时处理。', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '5' },
    { id: '2', type: 'info', title: '排期通知', message: '您有新的庭审排期：明天上午9:00 第一法庭', read: 0, createdAt: today.format('YYYY-MM-DD HH:mm'), userId: '5' },
    { id: '3', type: 'success', title: '送达完成', message: '案件(2024)京0101民初0001号已完成电子送达', read: 1, createdAt: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), userId: '9' },
  ];

  db = {
    users,
    departments,
    courtRooms,
    cases,
    documents,
    serviceRecords,
    schedules,
    trialRecords,
    executionRecords,
    propertyControls,
    executionDistributions,
    notifications,
  };

  console.log('✅ 内存数据库初始化完成');
}

export function getDb(): Database {
  if (!db) {
    initDatabase();
  }
  return db;
}

export function genId(): string {
  return uuidv4();
}
