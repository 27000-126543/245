import dayjs from 'dayjs';
import type { CaseStatus, DocumentStatus, DocumentType, ServiceMethod, ServiceStatus, ScheduleStatus, ScheduleType, TrialStatus, ExecutionStatus } from '../types';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const caseStatusMap: Record<CaseStatus, { label: string; className: string }> = {
  filed: { label: '已立案', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  assigned: { label: '已分案', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  served: { label: '已送达', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  scheduled: { label: '已排期', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  trial: { label: '审理中', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  document: { label: '文书撰写', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  closed: { label: '已结案', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  executing: { label: '执行中', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const documentStatusMap: Record<DocumentStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  pending_judge: { label: '待法官审核', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  pending_chief: { label: '待庭长审核', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending_president: { label: '待院长审核', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  returned: { label: '已退回', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const documentTypeMap: Record<DocumentType, string> = {
  judgment: '民事判决书',
  verdict: '刑事判决书',
  ruling: '裁定书',
  notice: '通知书',
  mediation: '调解书',
};

export const serviceMethodMap: Record<ServiceMethod, string> = {
  sms: '短信送达',
  email: '邮件送达',
  announcement: '公告送达',
};

export const serviceStatusMap: Record<ServiceStatus, { label: string; className: string }> = {
  sending: { label: '发送中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  sent: { label: '已发送', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  delivered: { label: '已送达', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: '送达失败', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const scheduleStatusMap: Record<ScheduleStatus, { label: string; className: string }> = {
  scheduled: { label: '已排期', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  queued: { label: '排队中', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export const scheduleTypeMap: Record<ScheduleType, string> = {
  trial: '正式开庭',
  mediation: '调解',
  hearing: '听证',
};

export const trialStatusMap: Record<TrialStatus, { label: string; className: string }> = {
  pending: { label: '待开庭', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  ongoing: { label: '进行中', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  processing: { label: '转写中', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export const executionStatusMap: Record<ExecutionStatus, { label: string; className: string }> = {
  pending: { label: '待查控', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  executing: { label: '执行中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  terminated: { label: '终结本次', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
};

export const roleNameMap: Record<string, string> = {
  clerk: '书记员',
  judge: '法官',
  chief: '庭长',
  president: '院长',
  admin: '管理员',
};

export const getDaysRemaining = (deadline: string): number => {
  const now = dayjs();
  const deadlineDate = dayjs(deadline);
  return deadlineDate.diff(now, 'day');
};

export const isDeadlineWarning = (deadline: string): boolean => {
  return getDaysRemaining(deadline) <= 15;
};
