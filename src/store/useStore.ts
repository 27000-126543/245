import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Case, Document, ServiceRecord, Schedule, TrialRecord, ExecutionRecord, StatsData, Notification } from '../types';
import { users, cases as mockCases, documents as mockDocuments, serviceRecords as mockServiceRecords, schedules as mockSchedules, trialRecords as mockTrialRecords, executionRecords as mockExecutionRecords, statsData as mockStatsData, notifications as mockNotifications } from '../data/mockData';
import { api } from '../services/api';

interface AppState {
  currentUser: User | null;
  users: User[];
  cases: Case[];
  documents: Document[];
  serviceRecords: ServiceRecord[];
  schedules: Schedule[];
  trialRecords: TrialRecord[];
  executionRecords: ExecutionRecord[];
  statsData: StatsData;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  darkMode: boolean;
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  addCase: (caseData: Partial<Case>) => void;
  updateCase: (id: string, caseData: Partial<Case>) => void;
  addDocument: (doc: Partial<Document>) => void;
  updateDocument: (id: string, docData: Partial<Document>) => void;
  addServiceRecord: (record: Partial<ServiceRecord>) => void;
  addSchedule: (schedule: Partial<Schedule>) => void;
  addTrialRecord: (record: Partial<TrialRecord>) => void;
  addExecutionRecord: (record: Partial<ExecutionRecord>) => void;
  updateExecutionRecord: (id: string, recordData: Partial<ExecutionRecord>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshStats: () => Promise<void>;
  loadAllData: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users,
      cases: mockCases,
      documents: mockDocuments,
      serviceRecords: mockServiceRecords,
      schedules: mockSchedules,
      trialRecords: mockTrialRecords,
      executionRecords: mockExecutionRecords,
      statsData: mockStatsData,
      notifications: mockNotifications,
      sidebarCollapsed: false,
      darkMode: true,

      login: async (username: string, password: string) => {
        try {
          const result = await api.auth.login(username, password);
          set({ currentUser: result.user });
          return true;
        } catch (e) {
          console.error('Login failed:', e);
          return false;
        }
      },

      logout: () => {
        set({ currentUser: null });
      },

      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      toggleDarkMode: () => {
        set(state => ({ darkMode: !state.darkMode }));
      },

      loadAllData: async () => {
        try {
          const [cases, documents, serviceRecords, schedules, trials, executions, users, stats] = await Promise.all([
            api.cases.list(),
            api.documents.list(),
            api.service.list(),
            api.schedules.list(),
            api.trials.list(),
            api.executions.list(),
            api.auth.getUsers(),
            api.stats.overview(),
          ]);
          
          set({
            cases,
            documents: documents.map((d: any) => ({
              ...d,
              approvals: typeof d.approvals === 'string' ? JSON.parse(d.approvals) : d.approvals,
              suggestedPoints: typeof d.suggestedPoints === 'string' ? JSON.parse(d.suggestedPoints || '[]') : d.suggestedPoints,
            })),
            serviceRecords,
            schedules,
            trialRecords: trials.map((t: any) => ({
              ...t,
              participants: typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : t.participants,
            })),
            executionRecords: executions,
            users,
            statsData: stats,
          });
        } catch (e) {
          console.error('Load data failed:', e);
        }
      },

      addCase: (caseData) => {
        const newCase: Case = {
          id: String(Date.now()),
          caseNumber: caseData.caseNumber || `(2024)京0101民初${Math.floor(Math.random() * 10000)}号`,
          caseType: caseData.caseType || 'civil',
          causeOfAction: caseData.causeOfAction || '',
          plaintiff: caseData.plaintiff || '',
          defendant: caseData.defendant || '',
          status: 'filed',
          estimatedDays: caseData.estimatedDays || 60,
          createdAt: new Date().toISOString().split('T')[0],
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ...caseData,
        } as Case;
        set(state => ({ cases: [newCase, ...state.cases] }));
      },

      updateCase: (id, caseData) => {
        set(state => ({
          cases: state.cases.map(c => c.id === id ? { ...c, ...caseData } : c),
        }));
      },

      addDocument: (doc) => {
        const newDoc: Document = {
          id: String(Date.now()),
          caseId: doc.caseId || '',
          caseNumber: doc.caseNumber || '',
          type: doc.type || 'judgment',
          title: doc.title || '',
          content: doc.content || '',
          status: 'draft',
          approverLevel: 0,
          authorId: doc.authorId || get().currentUser?.id || '',
          authorName: doc.authorName || get().currentUser?.name || '',
          createdAt: new Date().toISOString().split('T')[0],
          approvals: [],
          ...doc,
        } as Document;
        set(state => ({ documents: [newDoc, ...state.documents] }));
      },

      updateDocument: (id, docData) => {
        set(state => ({
          documents: state.documents.map(d => d.id === id ? { ...d, ...docData } : d),
        }));
      },

      addServiceRecord: (record) => {
        const newRecord: ServiceRecord = {
          id: String(Date.now()),
          caseId: record.caseId || '',
          caseNumber: record.caseNumber || '',
          method: record.method || 'sms',
          receiver: record.receiver || '',
          documentType: record.documentType || '',
          status: 'sending',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString().split('T')[0],
          ...record,
        } as ServiceRecord;
        set(state => ({ serviceRecords: [newRecord, ...state.serviceRecords] }));
      },

      addSchedule: (schedule) => {
        const newSchedule: Schedule = {
          id: String(Date.now()),
          caseId: schedule.caseId || '',
          caseNumber: schedule.caseNumber || '',
          caseName: schedule.caseName || '',
          judgeId: schedule.judgeId || '',
          judgeName: schedule.judgeName || '',
          courtRoomId: schedule.courtRoomId || '',
          courtRoomName: schedule.courtRoomName || '',
          date: schedule.date || new Date().toISOString().split('T')[0],
          startTime: schedule.startTime || '',
          endTime: schedule.endTime || '',
          type: schedule.type || 'trial',
          status: schedule.status || 'scheduled',
          createdAt: new Date().toISOString().split('T')[0],
          ...schedule,
        } as Schedule;
        set(state => ({ schedules: [newSchedule, ...state.schedules] }));
      },

      addTrialRecord: (record) => {
        const newRecord: TrialRecord = {
          id: String(Date.now()),
          caseId: record.caseId || '',
          caseNumber: record.caseNumber || '',
          caseName: record.caseName || '',
          scheduleId: record.scheduleId || '',
          judgeName: record.judgeName || '',
          courtRoomName: record.courtRoomName || '',
          startTime: record.startTime || new Date().toISOString().slice(11, 16),
          status: 'ongoing',
          participants: [],
          createdAt: new Date().toISOString().split('T')[0],
          ...record,
        } as TrialRecord;
        set(state => ({ trialRecords: [newRecord, ...state.trialRecords] }));
      },

      addExecutionRecord: (record) => {
        const newRecord: ExecutionRecord = {
          id: String(Date.now()),
          caseId: record.caseId || '',
          caseNumber: record.caseNumber || '',
          applicant: record.applicant || '',
          respondent: record.respondent || '',
          amount: record.amount || 0,
          recoveredAmount: record.recoveredAmount || 0,
          status: 'pending',
          propertyControls: [],
          distributions: [],
          createdAt: new Date().toISOString().split('T')[0],
          ...record,
        } as ExecutionRecord;
        set(state => ({ executionRecords: [newRecord, ...state.executionRecords] }));
      },

      updateExecutionRecord: (id, recordData) => {
        set(state => ({
          executionRecords: state.executionRecords.map(r => r.id === id ? { ...r, ...recordData } : r),
        }));
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        }));
      },

      markAllNotificationsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        }));
      },

      refreshStats: async () => {
        try {
          const stats = await api.stats.overview();
          set({ statsData: stats });
        } catch (e) {
          console.error('Refresh stats failed:', e);
        }
      },
    }),
    {
      name: 'court-system-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
      }),
    }
  )
);
