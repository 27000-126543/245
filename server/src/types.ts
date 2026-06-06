export type UserRole = 'clerk' | 'judge' | 'chief' | 'president' | 'admin';

export type CaseStatus = 'filed' | 'assigned' | 'served' | 'scheduled' | 'trial' | 'document' | 'closed' | 'executing';

export type CaseType = 'civil' | 'criminal' | 'administrative' | 'execution';

export type DocumentStatus = 'draft' | 'pending_judge' | 'pending_chief' | 'pending_president' | 'approved' | 'returned';

export type DocumentType = 'judgment' | 'verdict' | 'ruling' | 'notice' | 'mediation';

export type ServiceMethod = 'sms' | 'email' | 'announcement';

export type ServiceStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'queued';

export type ScheduleType = 'trial' | 'mediation' | 'hearing';

export type TrialStatus = 'pending' | 'ongoing' | 'completed' | 'processing';

export type ExecutionStatus = 'pending' | 'executing' | 'completed' | 'terminated';

export type PropertyControlStatus = 'frozen' | 'sealed' | 'released';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  phone?: string;
  email?: string;
  password: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface CourtRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  caseType: CaseType;
  causeOfAction: string;
  plaintiff: string;
  defendant: string;
  plaintiffPhone?: string;
  defendantPhone?: string;
  plaintiffAddress?: string;
  defendantAddress?: string;
  status: CaseStatus;
  judgeId?: string;
  judgeName?: string;
  clerkId?: string;
  clerkName?: string;
  departmentId?: string;
  departmentName?: string;
  estimatedDays: number;
  actualDays?: number;
  createdAt: string;
  deadline: string;
  filingMaterials?: string;
  description?: string;
  amount?: number;
}

export interface Document {
  id: string;
  caseId: string;
  caseNumber: string;
  type: DocumentType;
  title: string;
  content: string;
  status: DocumentStatus;
  approverLevel: number;
  currentApproverId?: string;
  currentApproverName?: string;
  approvals: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  suggestedPoints?: string;
}

export interface ServiceRecord {
  id: string;
  caseId: string;
  caseNumber: string;
  method: ServiceMethod;
  receiver: string;
  receiverPhone?: string;
  receiverEmail?: string;
  documentType: string;
  status: ServiceStatus;
  receiptUrl?: string;
  sentAt: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  caseId: string;
  caseNumber: string;
  caseName: string;
  judgeId: string;
  judgeName: string;
  courtRoomId: string;
  courtRoomName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  status: ScheduleStatus;
  createdAt: string;
  queuePosition?: number;
}

export interface TrialRecord {
  id: string;
  caseId: string;
  caseNumber: string;
  caseName: string;
  scheduleId?: string;
  judgeName: string;
  courtRoomName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  videoUrl?: string;
  transcript?: string;
  status: TrialStatus;
  participants?: string;
  createdAt: string;
}

export interface PropertyControl {
  id: string;
  executionId: string;
  type: string;
  description: string;
  amount: number;
  status: PropertyControlStatus;
  createdAt: string;
}

export interface ExecutionDistribution {
  id: string;
  executionId: string;
  recipient: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  remark?: string;
  createdAt: string;
}

export interface ExecutionRecord {
  id: string;
  caseId: string;
  caseNumber: string;
  applicant: string;
  respondent: string;
  amount: number;
  recoveredAmount: number;
  status: ExecutionStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: number;
  createdAt: string;
  userId?: string;
}

export interface StatsData {
  totalCases: number;
  closedCases: number;
  pendingCases: number;
  avgTrialDays: number;
  executionRate: number;
  appealRate: number;
  todayNewCases: number;
  todayClosedCases: number;
}
