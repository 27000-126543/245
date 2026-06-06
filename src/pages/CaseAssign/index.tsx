import React, { useState } from 'react';
import { Users, Search, Plus, Eye, UserCheck, FileText, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { caseStatusMap } from '../../utils/format';
import { judgeRecommendations, users } from '../../data/mockData';
import type { Case } from '../../types';
import { cn } from '../../lib/utils';

const CaseAssign: React.FC = () => {
  const { cases, updateCase, currentUser } = useStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedJudge, setSelectedJudge] = useState('');

  const filedCases = cases.filter(c => c.status === 'filed' || c.status === 'assigned');

  const filteredCases = filedCases.filter(c => {
    return !searchText ||
      c.caseNumber.includes(searchText) ||
      c.plaintiff.includes(searchText) ||
      c.defendant.includes(searchText);
  });

  const handleAssign = () => {
    if (selectedCase && selectedJudge) {
      const judge = users.find(u => u.id === selectedJudge);
      updateCase(selectedCase.id, {
        status: 'assigned',
        judgeId: selectedJudge,
        judgeName: judge?.name,
      });
      setShowAssignModal(false);
      setSelectedCase(null);
      setSelectedJudge('');
    }
  };

  const judgeOptions = users.filter(u => u.role === 'judge').map(u => ({
    value: u.id,
    label: `${u.name} (${u.department === '1' ? '民一庭' : u.department === '2' ? '民二庭' : '刑一庭'})`,
  }));

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
      key: 'causeOfAction',
      title: '案由',
      dataIndex: 'causeOfAction' as const,
    },
    {
      key: 'parties',
      title: '当事人',
      dataIndex: 'plaintiff' as const,
      render: (_: any, record: Case) => (
        <div className="text-sm">
          <p>原: {record.plaintiff}</p>
          <p className="text-gray-500 dark:text-gray-400">被: {record.defendant}</p>
        </div>
      ),
    },
    {
      key: 'judge',
      title: '承办人',
      dataIndex: 'judgeName' as const,
      render: (val: string) => val || <span className="text-gray-400">待分配</span>,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={caseStatusMap} />,
    },
    {
      key: 'createdAt',
      title: '立案日期',
      dataIndex: 'createdAt' as const,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: Case) => (
        <div className="flex items-center gap-2">
          {record.status === 'filed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCase(record);
                setShowAssignModal(true);
              }}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              分案
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const judgeWorkload = [
    { name: '陈法官', count: 12, avgDays: 45, department: '民一庭' },
    { name: '刘法官', count: 8, avgDays: 52, department: '民一庭' },
    { name: '赵法官', count: 15, avgDays: 48, department: '民二庭' },
    { name: '孙法官', count: 6, avgDays: 38, department: '刑一庭' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            分案管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            智能分案与承办人分配
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">待分案</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">23</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">今日已分案</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">法官人均在办</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">10.3件</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card bordered={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索案号、当事人..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DataTable columns={columns} dataSource={filteredCases} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card bordered={false}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">法官工作量</h3>
              <div className="space-y-3">
                {judgeWorkload.map((judge, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {judge.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {judge.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        在办 <span className="font-semibold text-primary-600">{judge.count}</span> 件
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        平均 <span className="font-semibold">{judge.avgDays}</span> 天
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          judge.count > 12 ? 'bg-red-500' : judge.count > 8 ? 'bg-yellow-500' : 'bg-green-500'
                        )}
                        style={{ width: `${(judge.count / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedCase(null);
        }}
        title="案件分配"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
              取消
            </Button>
            <Button onClick={handleAssign} disabled={!selectedJudge}>
              确认分配
            </Button>
          </>
        }
      >
        {selectedCase && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">案件信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">案号：</span>
                  <span className="text-gray-900 dark:text-white">{selectedCase.caseNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">案由：</span>
                  <span className="text-gray-900 dark:text-white">{selectedCase.causeOfAction}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">原告：</span>
                  <span className="text-gray-900 dark:text-white">{selectedCase.plaintiff}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">被告：</span>
                  <span className="text-gray-900 dark:text-white">{selectedCase.defendant}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">AI 推荐承办法官</h4>
              <div className="space-y-3 mb-4">
                {judgeRecommendations.map((rec, idx) => (
                  <label
                    key={rec.judgeId}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                      selectedJudge === rec.judgeId
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="judge"
                        value={rec.judgeId}
                        checked={selectedJudge === rec.judgeId}
                        onChange={(e) => setSelectedJudge(e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {rec.judgeName}
                          {rec.recommended && (
                            <span className="text-xs px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full">
                              推荐
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {rec.department}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rec.similarityScore}% 匹配
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        已办{rec.caseCount}件 · 平均{rec.avgDays}天
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <Select
                label="或手动选择法官"
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
                options={[{ value: '', label: '请选择法官' }, ...judgeOptions]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CaseAssign;
