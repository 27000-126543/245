const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    getUsers: () => request<any[]>('/auth/users'),
    createUser: (data: any) =>
      request<any>('/auth/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUser: (id: string, data: any) =>
      request<any>(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteUser: (id: string) =>
      request(`/auth/users/${id}`, { method: 'DELETE' }),
  },

  cases: {
    list: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/cases${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/cases/${id}`),
    create: (data: any) =>
      request<any>('/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    recommendJudges: (caseId: string, causeOfAction: string) =>
      request<any[]>(`/cases/${caseId}/recommend-judges?causeOfAction=${encodeURIComponent(causeOfAction)}`),
  },

  documents: {
    list: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/documents${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/documents/${id}`),
    create: (data: any) =>
      request<any>('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    submit: (id: string) =>
      request<any>(`/documents/${id}/submit`, { method: 'POST' }),
    generate: (data: any) =>
      request<{ content: string; suggestedPoints: string[] }>('/documents/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  service: {
    list: (params?: { status?: string; method?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/service${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/service/${id}`),
    create: (data: any) =>
      request<any>('/service', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/service/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    stats: () => request<any>('/service/stats/summary'),
  },

  schedules: {
    list: (params?: { status?: string; date?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/schedules${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/schedules/${id}`),
    create: (data: any) =>
      request<{ schedule: any; conflicts: string[] }>('/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    cancel: (id: string) =>
      request(`/schedules/${id}`, { method: 'DELETE' }),
    checkConflicts: (params: { date: string; judgeId: string; courtRoomId: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ conflicts: string[]; hasConflict: boolean }>(`/schedules/check/conflicts?${query}`);
    },
  },

  trials: {
    list: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/trials${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/trials/${id}`),
    create: (data: any) =>
      request<any>('/trials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/trials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    end: (id: string, data: any) =>
      request<any>(`/trials/${id}/end`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  executions: {
    list: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/executions${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/executions/${id}`),
    create: (data: any) =>
      request<any>('/executions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/executions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    addPropertyControl: (id: string, data: any) =>
      request<any>(`/executions/${id}/property-controls`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addDistribution: (id: string, data: any) =>
      request<any>(`/executions/${id}/distributions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    queryAssets: (data: any) =>
      request<any[]>('/executions/query-assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  stats: {
    overview: () => request<any>('/stats/overview'),
    caseTrend: () => request<any[]>('/stats/case-trend'),
    byCaseType: () => request<any[]>('/stats/by-case-type'),
    byDepartment: () => request<any[]>('/stats/by-department'),
    executionRate: () => request<any[]>('/stats/execution-rate'),
    appealHeatmap: () => request<any>('/stats/appeal-heatmap'),
    deadlineWarnings: () => request<any[]>('/stats/deadline-warnings'),
    monthlyReport: (month?: string) =>
      request<any>(`/stats/export/monthly-report${month ? `?month=${month}` : ''}`),
  },

  system: {
    getDepartments: () => request<any[]>('/system/departments'),
    createDepartment: (data: any) =>
      request<any>('/system/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDepartment: (id: string, data: any) =>
      request<any>(`/system/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteDepartment: (id: string) =>
      request(`/system/departments/${id}`, { method: 'DELETE' }),

    getCourtRooms: () => request<any[]>('/system/court-rooms'),
    createCourtRoom: (data: any) =>
      request<any>('/system/court-rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCourtRoom: (id: string, data: any) =>
      request<any>(`/system/court-rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCourtRoom: (id: string) =>
      request(`/system/court-rooms/${id}`, { method: 'DELETE' }),

    getNotifications: (userId?: string) =>
      request<any[]>(`/system/notifications${userId ? `?userId=${userId}` : ''}`),
    markNotificationRead: (id: string) =>
      request(`/system/notifications/read/${id}`, { method: 'POST' }),
    markAllRead: (userId?: string) =>
      request('/system/notifications/read-all', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),

    getRules: () => request<any[]>('/system/rules'),
    updateRule: (id: string, data: any) =>
      request<any>(`/system/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
