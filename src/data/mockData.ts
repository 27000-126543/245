import type {
  User,
  Case,
  Document,
  ServiceRecord,
  Schedule,
  TrialRecord,
  ExecutionRecord,
  CourtRoom,
  Department,
  JudgeRecommendation,
  StatsData,
  DepartmentStats,
  CaseTrendItem,
  CauseStats,
  AppealHeatmapItem,
  Notification,
  MenuItem,
} from '../types';

export const departments: Department[] = [
  { id: '1', name: '民事审判第一庭', code: 'MS1' },
  { id: '2', name: '民事审判第二庭', code: 'MS2' },
  { id: '3', name: '刑事审判第一庭', code: 'XS1' },
  { id: '4', name: '行政审判庭', code: 'XZ' },
  { id: '5', name: '执行局', code: 'ZX' },
  { id: '6', name: '立案庭', code: 'LA' },
];

export const users: User[] = [
  { id: '1', username: 'admin', name: '系统管理员', role: 'admin', department: '6' },
  { id: '2', username: 'president', name: '张院长', role: 'president', department: '0' },
  { id: '3', username: 'chief1', name: '李庭长', role: 'chief', department: '1' },
  { id: '4', username: 'chief2', name: '王庭长', role: 'chief', department: '2' },
  { id: '5', username: 'judge1', name: '陈法官', role: 'judge', department: '1' },
  { id: '6', username: 'judge2', name: '刘法官', role: 'judge', department: '1' },
  { id: '7', username: 'judge3', name: '赵法官', role: 'judge', department: '2' },
  { id: '8', username: 'judge4', name: '孙法官', role: 'judge', department: '3' },
  { id: '9', username: 'clerk1', name: '周书记员', role: 'clerk', department: '1' },
  { id: '10', username: 'clerk2', name: '吴书记员', role: 'clerk', department: '2' },
  { id: '11', username: 'clerk3', name: '郑书记员', role: 'clerk', department: '6' },
];

export const courtRooms: CourtRoom[] = [
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

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

export const cases: Case[] = Array.from({ length: 50 }, (_, i) => {
  const caseType = caseTypes[i % caseTypes.length];
  const status = statuses[i % statuses.length];
  const judge = users.find(u => u.role === 'judge' && u.id === String((i % 4) + 5));
  const clerk = users.find(u => u.role === 'clerk' && u.id === String((i % 3) + 9));
  const dept = departments[i % departments.length];
  const createdAt = randomDate(90);
  const deadline = new Date(createdAt);
  deadline.setDate(deadline.getDate() + 90);

  return {
    id: String(i + 1),
    caseNumber: generateCaseNumber(i + 1),
    caseType,
    causeOfAction: causeOfActions[i % causeOfActions.length],
    plaintiff: `原告${i + 1}`,
    defendant: `被告${i + 1}`,
    plaintiffPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    defendantPhone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    plaintiffAddress: `北京市朝阳区XX路${i + 1}号`,
    defendantAddress: `北京市海淀区XX街${i + 1}号`,
    status,
    judgeId: judge?.id,
    judgeName: judge?.name,
    clerkId: clerk?.id,
    clerkName: clerk?.name,
    departmentId: dept.id,
    departmentName: dept.name,
    estimatedDays: 60 + Math.floor(Math.random() * 60),
    actualDays: status === 'closed' ? Math.floor(Math.random() * 90) : undefined,
    createdAt,
    deadline: deadline.toISOString().split('T')[0],
    amount: Math.floor(Math.random() * 1000000),
    description: '这是一个测试案件的详细描述...',
    filingMaterials: ['起诉状', '证据材料', '身份证明', '授权委托书'],
  };
});

export const judgeRecommendations: JudgeRecommendation[] = [
  { judgeId: '5', judgeName: '陈法官', department: '民事审判第一庭', similarityScore: 95, avgDays: 45, caseCount: 128, recommended: true },
  { judgeId: '6', judgeName: '刘法官', department: '民事审判第一庭', similarityScore: 88, avgDays: 52, caseCount: 115, recommended: false },
  { judgeId: '7', judgeName: '赵法官', department: '民事审判第二庭', similarityScore: 82, avgDays: 48, caseCount: 142, recommended: false },
];

export const documents: Document[] = [
  {
    id: '1',
    caseId: '1',
    caseNumber: '(2024)京0101民初0001号',
    type: 'judgment',
    title: '民事判决书',
    content: '原告张三与被告李四民间借贷纠纷一案，本院于2024年1月15日立案后，依法适用普通程序，公开开庭进行了审理...',
    status: 'pending_chief',
    approverLevel: 1,
    currentApproverId: '3',
    currentApproverName: '李庭长',
    authorId: '5',
    authorName: '陈法官',
    createdAt: '2024-03-01',
    submittedAt: '2024-03-02',
    suggestedPoints: ['1. 借款事实认定清楚', '2. 利息计算符合法律规定', '3. 被告应承担还款责任'],
    approvals: [
      { id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'pending', createdAt: '2024-03-02' },
    ],
  },
  {
    id: '2',
    caseId: '2',
    caseNumber: '(2024)京0101民初0002号',
    type: 'ruling',
    title: '民事裁定书',
    content: '原告王五与被告赵六买卖合同纠纷一案，本院依法进行了审理...',
    status: 'draft',
    approverLevel: 0,
    authorId: '6',
    authorName: '刘法官',
    createdAt: '2024-03-05',
    suggestedPoints: ['1. 管辖异议审查', '2. 移送有管辖权法院'],
    approvals: [],
  },
  {
    id: '3',
    caseId: '3',
    caseNumber: '(2024)京0101民初0003号',
    type: 'mediation',
    title: '民事调解书',
    content: '本案在审理过程中，经本院主持调解，双方当事人自愿达成如下协议...',
    status: 'approved',
    approverLevel: 2,
    authorId: '5',
    authorName: '陈法官',
    createdAt: '2024-02-20',
    approvedAt: '2024-02-22',
    approvals: [
      { id: '1', level: 1, approverId: '3', approverName: '李庭长', status: 'approved', createdAt: '2024-02-21', comment: '同意' },
      { id: '2', level: 2, approverId: '2', approverName: '张院长', status: 'approved', createdAt: '2024-02-22', comment: '同意' },
    ],
  },
];

export const serviceRecords: ServiceRecord[] = [
  {
    id: '1',
    caseId: '1',
    caseNumber: '(2024)京0101民初0001号',
    method: 'sms',
    receiver: '李四',
    receiverPhone: '13800138001',
    documentType: '应诉通知书',
    status: 'delivered',
    sentAt: '2024-01-20 10:30:00',
    deliveredAt: '2024-01-20 10:30:15',
    createdAt: '2024-01-20',
  },
  {
    id: '2',
    caseId: '1',
    caseNumber: '(2024)京0101民初0001号',
    method: 'email',
    receiver: '张三',
    receiverEmail: 'zhangsan@example.com',
    documentType: '受理通知书',
    status: 'delivered',
    sentAt: '2024-01-16 09:00:00',
    deliveredAt: '2024-01-16 09:05:00',
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    caseId: '2',
    caseNumber: '(2024)京0101民初0002号',
    method: 'announcement',
    receiver: '赵六',
    documentType: '公告送达',
    status: 'sent',
    sentAt: '2024-02-01',
    createdAt: '2024-02-01',
  },
];

const today = new Date();
export const schedules: Schedule[] = [
  {
    id: '1',
    caseId: '1',
    caseNumber: '(2024)京0101民初0001号',
    caseName: '张三诉李四民间借贷纠纷',
    judgeId: '5',
    judgeName: '陈法官',
    courtRoomId: '1',
    courtRoomName: '第一法庭',
    date: new Date(today.getTime() + 86400000).toISOString().slice(0, 10),
    startTime: new Date(today.getTime() + 86400000).toISOString().slice(11, 16),
    endTime: new Date(today.getTime() + 86400000 + 7200000).toISOString().slice(11, 16),
    type: 'trial',
    status: 'scheduled',
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    caseId: '2',
    caseNumber: '(2024)京0101民初0002号',
    caseName: '王五诉赵六买卖合同纠纷',
    judgeId: '6',
    judgeName: '刘法官',
    courtRoomId: '2',
    courtRoomName: '第二法庭',
    date: new Date(today.getTime() + 86400000 * 2).toISOString().slice(0, 10),
    startTime: new Date(today.getTime() + 86400000 * 2).toISOString().slice(11, 16),
    endTime: new Date(today.getTime() + 86400000 * 2 + 10800000).toISOString().slice(11, 16),
    type: 'trial',
    status: 'scheduled',
    createdAt: '2024-03-02',
  },
  {
    id: '3',
    caseId: '3',
    caseNumber: '(2024)京0101民初0003号',
    caseName: '孙七诉周八离婚纠纷',
    judgeId: '5',
    judgeName: '陈法官',
    courtRoomId: '3',
    courtRoomName: '第三法庭',
    date: new Date(today.getTime() - 86400000).toISOString().slice(0, 10),
    startTime: new Date(today.getTime() - 86400000).toISOString().slice(11, 16),
    endTime: new Date(today.getTime() - 86400000 + 5400000).toISOString().slice(11, 16),
    type: 'trial',
    status: 'completed',
    createdAt: '2024-02-28',
  },
];

export const trialRecords: TrialRecord[] = [
  {
    id: '1',
    caseId: '3',
    caseNumber: '(2024)京0101民初0003号',
    caseName: '孙七诉周八离婚纠纷',
    scheduleId: '3',
    judgeName: '陈法官',
    courtRoomName: '第三法庭',
    startTime: new Date(today.getTime() - 86400000).toISOString().slice(11, 16),
    endTime: new Date(today.getTime() - 86400000 + 5400000).toISOString().slice(11, 16),
    duration: 90,
    videoUrl: '/records/001.mp4',
    transcript: '书记员：现在宣布法庭纪律...\n审判长：现在开庭。首先核对当事人身份...\n原告：诉讼请求如下...\n被告：答辩意见如下...',
    status: 'completed',
    participants: ['陈法官', '周书记员', '张三', '李四', '王五律师'],
    createdAt: '2024-02-28',
  },
];

export const executionRecords: ExecutionRecord[] = [
  {
    id: '1',
    caseId: '1',
    caseNumber: '(2024)京0101民初0001号',
    applicant: '张三',
    respondent: '李四',
    amount: 125000,
    recoveredAmount: 125000,
    status: 'completed',
    propertyControls: [
      {
        id: '1',
        type: 'bank_account',
        description: '中国工商银行账户冻结',
        status: 'frozen',
        amount: 125000,
        createdAt: '2024-03-02',
      },
      {
        id: '2',
        type: 'house',
        description: '朝阳区XX小区房产查封',
        status: 'sealed',
        amount: 2000000,
        createdAt: '2024-03-03',
      },
    ],
    distributions: [
      {
        id: '1',
        recipient: '张三',
        amount: 125000,
        status: 'paid',
        paidAt: '2024-03-10',
        createdAt: '2024-03-08',
      },
    ],
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    caseId: '4',
    caseNumber: '(2024)京0101民初0004号',
    applicant: '王五',
    respondent: '赵六',
    amount: 500000,
    recoveredAmount: 0,
    status: 'executing',
    propertyControls: [
      {
        id: '1',
        type: 'vehicle',
        description: '车牌号京A12345车辆查封',
        status: 'sealed',
        amount: 150000,
        createdAt: '2024-03-05',
      },
    ],
    distributions: [],
    createdAt: '2024-03-04',
  },
];

export const statsData: StatsData = {
  totalCases: 2586,
  closedCases: 2154,
  pendingCases: 432,
  avgTrialDays: 48.5,
  executionRate: 86.7,
  appealRate: 12.3,
  todayNewCases: 18,
  todayClosedCases: 12,
};

export const departmentStats: DepartmentStats[] = [
  { departmentId: '1', departmentName: '民事审判一庭', totalCases: 685, closedCases: 582, pendingCases: 103, avgDays: 52.3, closureRate: 84.9 },
  { departmentId: '2', departmentName: '民事审判二庭', totalCases: 542, closedCases: 465, pendingCases: 77, avgDays: 45.8, closureRate: 85.8 },
  { departmentId: '3', departmentName: '刑事审判一庭', totalCases: 328, closedCases: 295, pendingCases: 33, avgDays: 38.2, closureRate: 89.9 },
  { departmentId: '4', departmentName: '行政审判庭', totalCases: 156, closedCases: 128, pendingCases: 28, avgDays: 55.6, closureRate: 82.1 },
  { departmentId: '5', departmentName: '执行局', totalCases: 875, closedCases: 684, pendingCases: 191, avgDays: 62.4, closureRate: 78.2 },
];

const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
export const caseTrend: CaseTrendItem[] = months.map((m, i) => ({
  date: m,
  newCases: 350 + Math.floor(Math.random() * 150),
  closedCases: 300 + Math.floor(Math.random() * 150),
}));

export const causeStats: CauseStats[] = [
  { cause: '民间借贷纠纷', count: 456, percentage: 17.6 },
  { cause: '买卖合同纠纷', count: 342, percentage: 13.2 },
  { cause: '离婚纠纷', count: 285, percentage: 11.0 },
  { cause: '交通事故责任纠纷', count: 256, percentage: 9.9 },
  { cause: '劳动争议', count: 198, percentage: 7.7 },
  { cause: '其他', count: 1049, percentage: 40.6 },
];

export const appealHeatmap: AppealHeatmapItem[] = [];
departments.slice(0, 5).forEach(dept => {
  months.forEach(month => {
    appealHeatmap.push({
      department: dept.name.replace('审判', '').replace('庭', ''),
      month,
      rate: 8 + Math.random() * 10,
    });
  });
});

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: '审限预警',
    message: '案件(2024)京0101民初0001号还有15天到期，请及时处理。',
    read: false,
    createdAt: '2024-03-10 09:00:00',
    link: '/case-filing',
  },
  {
    id: '2',
    type: 'info',
    title: '排期通知',
    message: '您有新的案件已排期，明天上午9:00在第一法庭开庭。',
    read: false,
    createdAt: '2024-03-10 08:30:00',
    link: '/scheduling',
  },
  {
    id: '3',
    type: 'success',
    title: '审批通过',
    message: '您提交的文书已通过庭长审批。',
    read: true,
    createdAt: '2024-03-09 16:00:00',
    link: '/document',
  },
];

export const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '首页大屏', icon: 'LayoutDashboard', path: '/dashboard', roles: ['clerk', 'judge', 'chief', 'president', 'admin'] },
  { key: 'case-filing', label: '立案登记', icon: 'FilePlus', path: '/case-filing', roles: ['clerk', 'judge', 'chief', 'president', 'admin'] },
  { key: 'case-assign', label: '分案管理', icon: 'Users', path: '/case-assign', roles: ['chief', 'president', 'admin'] },
  { key: 'service', label: '送达管理', icon: 'Send', path: '/service', roles: ['clerk', 'judge', 'chief', 'president', 'admin'] },
  { key: 'scheduling', label: '排期管理', icon: 'Calendar', path: '/scheduling', roles: ['clerk', 'judge', 'chief', 'president', 'admin'] },
  { key: 'trial', label: '庭审管理', icon: 'Video', path: '/trial', roles: ['judge', 'chief', 'president', 'admin'] },
  { key: 'document', label: '文书管理', icon: 'FileText', path: '/document', roles: ['judge', 'chief', 'president', 'admin'] },
  { key: 'execution', label: '执行管理', icon: 'Scale', path: '/execution', roles: ['judge', 'chief', 'president', 'admin'] },
  { key: 'system', label: '系统管理', icon: 'Settings', path: '/system', roles: ['president', 'admin'] },
];

export const causeOfActionOptions = [
  '民间借贷纠纷', '买卖合同纠纷', '离婚纠纷', '交通事故责任纠纷',
  '劳动争议', '房屋租赁合同纠纷', '物业服务合同纠纷', '信用卡纠纷',
  '金融借款合同纠纷', '建设工程施工合同纠纷', '承揽合同纠纷',
  '故意伤害罪', '盗窃罪', '诈骗罪', '交通肇事罪', '危险驾驶罪',
  '行政处罚争议', '行政确认争议', '行政赔偿争议', '行政许可争议',
];

export const documentTypeOptions = [
  '判决书', '裁定书', '调解书', '决定书', '通知书',
  '应诉通知书', '受理通知书', '传票', '公告',
];
