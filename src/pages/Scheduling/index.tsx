import React, { useState } from 'react';
import { Calendar, Search, Plus, Eye, Clock, AlertCircle, CheckCircle, Users, Building2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { scheduleStatusMap } from '../../utils/format';
import { courtRooms, users } from '../../data/mockData';
import type { Schedule } from '../../types';
import { cn } from '../../lib/utils';

const Scheduling: React.FC = () => {
  const { schedules, addSchedule } = useStore();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [newSchedule, setNewSchedule] = useState({
    caseId: '',
    caseNumber: '',
    caseName: '',
    judgeId: '',
    courtRoomId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'trial' as Schedule['type'],
  });

  const [conflicts, setConflicts] = useState<string[]>([]);

  const checkConflicts = () => {
    const newConflicts: string[] = [];
    const existing = schedules.filter(s =>
      s.date === newSchedule.date &&
      s.status !== 'cancelled'
    );

    existing.forEach(s => {
      if (s.judgeId === newSchedule.judgeId) {
        newConflicts.push(`法官时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
      }
      if (s.courtRoomId === newSchedule.courtRoomId) {
        newConflicts.push(`法庭时间冲突：${s.caseNumber} ${s.startTime}-${s.endTime}`);
      }
    });

    setConflicts(newConflicts);
  };

  const filteredSchedules = schedules.filter(s => {
    const matchSearch = !searchText ||
      s.caseNumber.includes(searchText) ||
      s.caseName.includes(searchText);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSchedule = () => {
    if (newSchedule.caseNumber && newSchedule.date && newSchedule.judgeId && newSchedule.courtRoomId) {
      const judge = users.find(u => u.id === newSchedule.judgeId);
      const courtroom = courtRooms.find(c => c.id === newSchedule.courtRoomId);
      addSchedule({
        id: `sch${Date.now()}`,
        caseId: newSchedule.caseId || `case${Date.now()}`,
        caseNumber: newSchedule.caseNumber,
        caseName: newSchedule.caseName,
        judgeId: newSchedule.judgeId,
        judgeName: judge?.name || '',
        courtRoomId: newSchedule.courtRoomId,
        courtRoomName: courtroom?.name || '',
        date: newSchedule.date,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        type: newSchedule.type,
        status: conflicts.length > 0 ? 'queued' : 'scheduled',
        createdAt: new Date().toISOString().split('T')[0],
      });
      setShowScheduleModal(false);
      setNewSchedule({
        caseId: '',
        caseNumber: '',
        caseName: '',
        judgeId: '',
        courtRoomId: '',
        date: '',
        startTime: '',
        endTime: '',
        type: 'trial',
      });
      setConflicts([]);
    }
  };

  const todaySchedules = schedules.filter(s => s.date === '2024-01-15').length;
  const weekSchedules = schedules.filter(s => s.status === 'scheduled').length;
  const queuedCount = schedules.filter(s => s.status === 'queued').length;

  const columns = [
    {
      key: 'caseNumber',
      title: '案号',
      dataIndex: 'caseNumber' as const,
      render: (val: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{val}</span>
      ),
    },
    {
      key: 'caseName',
      title: '案件名称',
      dataIndex: 'caseName' as const,
    },
    {
      key: 'judge',
      title: '承办法官',
      dataIndex: 'judgeName' as const,
    },
    {
      key: 'courtroom',
      title: '法庭',
      dataIndex: 'courtRoomName' as const,
    },
    {
      key: 'time',
      title: '开庭时间',
      dataIndex: 'date' as const,
      render: (_: any, record: Schedule) => (
        <div>
          <p className="text-gray-900 dark:text-white">{record.date}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{record.startTime} - {record.endTime}</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={scheduleStatusMap} />,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: Schedule) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSchedule(record);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const courtRoomsStatus = [
    { name: '第一法庭', status: 'using', case: '(2024)民初1001号', time: '09:00-11:00' },
    { name: '第二法庭', status: 'using', case: '(2024)刑初56号', time: '09:30-10:30' },
    { name: '第三法庭', status: 'free', case: '', time: '' },
    { name: '第四法庭', status: 'scheduled', case: '(2024)民初1023号', time: '14:00-16:00' },
    { name: '第五法庭', status: 'free', case: '', time: '' },
    { name: '第六法庭', status: 'scheduled', case: '(2024)民初89号', time: '15:00-17:00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            排期管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            智能排期与冲突检测
          </p>
        </div>
        <Button onClick={() => setShowScheduleModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建排期
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">今日开庭</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{todaySchedules}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">本周排期</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{weekSchedules}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">排队中</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{queuedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">可用法庭</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">4/6</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card bordered={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索案号、案件名称..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: '全部状态' },
                    { value: 'scheduled', label: '已排期' },
                    { value: 'queued', label: '排队中' },
                    { value: 'completed', label: '已完成' },
                    { value: 'cancelled', label: '已取消' },
                  ]}
                  className="w-36"
                />
              </div>
              <DataTable columns={columns} dataSource={filteredSchedules} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card bordered={false}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">法庭实时状态</h3>
              <div className="space-y-3">
                {courtRoomsStatus.map((cr, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg border',
                      cr.status === 'using' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      cr.status === 'scheduled' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                      cr.status === 'free' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{cr.name}</span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        cr.status === 'using' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                        cr.status === 'scheduled' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                        cr.status === 'free' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      )}>
                        {cr.status === 'using' ? '使用中' : cr.status === 'scheduled' ? '已预约' : '空闲'}
                      </span>
                    </div>
                    {cr.case && (
                      <>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{cr.case}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{cr.time}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setConflicts([]);
        }}
        title="新建排期"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>
              取消
            </Button>
            <Button onClick={handleSchedule} disabled={conflicts.length > 0}>
              {conflicts.length > 0 ? '存在冲突，加入队列' : '确认排期'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="案号"
              value={newSchedule.caseNumber}
              onChange={(e) => setNewSchedule({ ...newSchedule, caseNumber: e.target.value })}
              placeholder="请输入案号"
            />
            <Input
              label="案件名称"
              value={newSchedule.caseName}
              onChange={(e) => setNewSchedule({ ...newSchedule, caseName: e.target.value })}
              placeholder="请输入案件名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="承办法官"
              value={newSchedule.judgeId}
              onChange={(e) => {
                setNewSchedule({ ...newSchedule, judgeId: e.target.value });
                setTimeout(checkConflicts, 100);
              }}
              options={[
                { value: '', label: '请选择法官' },
                ...users.filter(u => u.role === 'judge').map(u => ({ value: u.id, label: u.name })),
              ]}
            />
            <Select
              label="法庭"
              value={newSchedule.courtRoomId}
              onChange={(e) => {
                setNewSchedule({ ...newSchedule, courtRoomId: e.target.value });
                setTimeout(checkConflicts, 100);
              }}
              options={[
                { value: '', label: '请选择法庭' },
                ...courtRooms.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="开庭日期"
              type="date"
              value={newSchedule.date}
              onChange={(e) => {
                setNewSchedule({ ...newSchedule, date: e.target.value });
                setTimeout(checkConflicts, 100);
              }}
            />
            <Input
              label="开始时间"
              type="time"
              value={newSchedule.startTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
            />
            <Input
              label="结束时间"
              type="time"
              value={newSchedule.endTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
            />
          </div>
          <Select
            label="庭审类型"
            value={newSchedule.type}
            onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as Schedule['type'] })}
            options={[
              { value: 'trial', label: '正式开庭' },
              { value: 'mediation', label: '调解' },
              { value: 'hearing', label: '听证' },
            ]}
          />

          {conflicts.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300 mb-2">检测到时间冲突</p>
                  <ul className="space-y-1">
                    {conflicts.map((c, idx) => (
                      <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                        • {c}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    确认后将自动加入排队队列，资源释放后优先安排
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="排期详情"
        size="md"
      >
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案号</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSchedule.caseNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案件名称</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSchedule.caseName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">承办法官</span>
                <p className="text-gray-900 dark:text-white">{selectedSchedule.judgeName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">法庭</span>
                <p className="text-gray-900 dark:text-white">{selectedSchedule.courtRoomName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">开庭日期</span>
                <p className="text-gray-900 dark:text-white">{selectedSchedule.date}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">时间</span>
                <p className="text-gray-900 dark:text-white">{selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">庭审类型</span>
                <p className="text-gray-900 dark:text-white">
                  {selectedSchedule.type === 'trial' ? '正式开庭' : selectedSchedule.type === 'mediation' ? '调解' : '听证'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">状态</span>
                <p><StatusBadge status={selectedSchedule.status} statusMap={scheduleStatusMap} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">书记员：张书记员</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Scheduling;
