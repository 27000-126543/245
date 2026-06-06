import React, { useState } from 'react';
import { Video, Search, Eye, Mic, FileText, Clock, Play, Download, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import type { TrialRecord } from '../../types';
import { cn } from '../../lib/utils';

const Trial: React.FC = () => {
  const { trialRecords, addTrialRecord } = useStore();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrialRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const trialStatusMap = {
    ongoing: { label: '进行中', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    completed: { label: '已完成', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    processing: { label: '转写中', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  };

  const filteredRecords = trialRecords.filter(r => {
    const matchSearch = !searchText ||
      r.caseNumber.includes(searchText) ||
      r.caseName.includes(searchText);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const ongoingCount = trialRecords.filter(r => r.status === 'ongoing').length;
  const completedCount = trialRecords.filter(r => r.status === 'completed').length;
  const processingCount = trialRecords.filter(r => r.status === 'processing').length;

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
      title: '审判长',
      dataIndex: 'judgeName' as const,
    },
    {
      key: 'courtroom',
      title: '法庭',
      dataIndex: 'courtRoomName' as const,
    },
    {
      key: 'date',
      title: '开庭时间',
      dataIndex: 'startTime' as const,
      render: (val: string) => val.split(' ')[0],
    },
    {
      key: 'duration',
      title: '时长',
      dataIndex: 'duration' as const,
      render: (val: number) => `${val}分钟`,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={trialStatusMap} />,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: TrialRecord) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRecord(record);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {record.videoUrl && (
            <Button variant="ghost" size="sm">
              <Play className="w-4 h-4" />
            </Button>
          )}
          {record.transcript && (
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const liveTrials = [
    { id: 1, caseNumber: '(2024)民初1001号', caseName: '张三诉李四合同纠纷案', courtroom: '第一法庭', judge: '陈法官', time: '已进行45分钟' },
    { id: 2, caseNumber: '(2024)刑初56号', caseName: '王某故意伤害案', courtroom: '第二法庭', judge: '赵法官', time: '已进行30分钟' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            庭审管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            庭审录音录像与智能转写
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">今日庭审</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{trialRecords.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">进行中</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{ongoingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">转写中</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{processingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已完成</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {liveTrials.length > 0 && (
        <Card bordered={false} className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              正在直播的庭审
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveTrials.map((trial) => (
                <div
                  key={trial.id}
                  className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{trial.caseNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{trial.caseName}</p>
                    </div>
                    <Button size="sm" variant="danger">
                      <Play className="w-4 h-4 mr-1" />
                      观看
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{trial.courtroom}</span>
                    <span>{trial.judge}</span>
                    <span className="text-red-600 dark:text-red-400">{trial.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                { value: 'ongoing', label: '进行中' },
                { value: 'processing', label: '转写中' },
                { value: 'completed', label: '已完成' },
              ]}
              className="w-36"
            />
          </div>
          <DataTable<TrialRecord> columns={columns} dataSource={filteredRecords} />
        </CardContent>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="庭审详情"
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案号</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.caseNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案件名称</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.caseName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">审判长</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.judgeName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">法庭</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.courtRoomName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">开始时间</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.startTime}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">时长</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.duration}分钟</p>
              </div>
            </div>

            {selectedRecord.videoUrl && (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">[庭审录像]</p>
                  <Button size="sm" className="mt-3">
                    <Play className="w-4 h-4 mr-2" />
                    播放录像
                  </Button>
                </div>
              </div>
            )}

            {selectedRecord.transcript && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  庭审笔录（AI转写）
                </h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-64 overflow-y-auto">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-primary-600 dark:text-primary-400">审判长：</span>
                      <span className="text-gray-700 dark:text-gray-300">{selectedRecord.transcript}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">原告：</span>
                      <span className="text-gray-700 dark:text-gray-300">我方起诉被告，要求赔偿经济损失共计50万元。</span>
                    </div>
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">被告：</span>
                      <span className="text-gray-700 dark:text-gray-300">我方不同意原告诉求，请求法院驳回起诉。</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    转写准确率：98.5% · 已自动关联至案件卷宗
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    导出笔录
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Trial;
