import React, { useState } from 'react';
import {
  FilePlus,
  Search,
  Filter,
  Plus,
  Eye,
  User,
  FileText,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { caseStatusMap, formatDate } from '../../utils/format';
import { judgeRecommendations, causeOfActionOptions, users } from '../../data/mockData';
import type { Case } from '../../types';
import { cn } from '../../lib/utils';

const CaseFiling: React.FC = () => {
  const { cases, addCase, currentUser } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecommendation, setShowRecommendation] = useState(false);

  const [formData, setFormData] = useState({
    caseType: 'civil',
    causeOfAction: '',
    plaintiff: '',
    plaintiffPhone: '',
    plaintiffAddress: '',
    defendant: '',
    defendantPhone: '',
    defendantAddress: '',
    amount: '',
    description: '',
  });

  const filteredCases = cases.filter(c => {
    const matchSearch = !searchText ||
      c.caseNumber.includes(searchText) ||
      c.plaintiff.includes(searchText) ||
      c.defendant.includes(searchText) ||
      c.causeOfAction.includes(searchText);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    addCase({
      caseType: formData.caseType as any,
      causeOfAction: formData.causeOfAction,
      plaintiff: formData.plaintiff,
      plaintiffPhone: formData.plaintiffPhone,
      plaintiffAddress: formData.plaintiffAddress,
      defendant: formData.defendant,
      defendantPhone: formData.defendantPhone,
      defendantAddress: formData.defendantAddress,
      amount: formData.amount ? Number(formData.amount) : undefined,
      description: formData.description,
      clerkId: currentUser?.id,
      clerkName: currentUser?.name,
      status: 'filed',
      estimatedDays: 60,
    });
    setShowCreateModal(false);
    setShowRecommendation(false);
    setFormData({
      caseType: 'civil',
      causeOfAction: '',
      plaintiff: '',
      plaintiffPhone: '',
      plaintiffAddress: '',
      defendant: '',
      defendantPhone: '',
      defendantAddress: '',
      amount: '',
      description: '',
    });
  };

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
          <p className="text-gray-900 dark:text-white">原: {record.plaintiff}</p>
          <p className="text-gray-500 dark:text-gray-400">被: {record.defendant}</p>
        </div>
      ),
    },
    {
      key: 'judge',
      title: '承办人',
      dataIndex: 'judgeName' as const,
      render: (val: string) => val || '-',
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
      key: 'deadline',
      title: '审限到期',
      dataIndex: 'deadline' as const,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: Case) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCase(record);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            立案登记
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            案件立案登记与材料管理
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建立案
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">今日立案</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">18</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FilePlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">已分案</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">156</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">本月立案</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">328</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card bordered={false}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索案号、当事人、案由..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'filed', label: '已立案' },
                { value: 'assigned', label: '已分案' },
                { value: 'served', label: '已送达' },
              ]}
              className="w-40"
            />
          </div>

          <DataTable<Case>
            columns={columns}
            dataSource={filteredCases}
            onRowClick={setSelectedCase}
          />
        </CardContent>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowRecommendation(false);
        }}
        title="新建立案登记"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              提交立案
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="案件类型"
              value={formData.caseType}
              onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
              options={[
                { value: 'civil', label: '民事案件' },
                { value: 'criminal', label: '刑事案件' },
                { value: 'administrative', label: '行政案件' },
                { value: 'execution', label: '执行案件' },
              ]}
            />
            <Select
              label="案由"
              value={formData.causeOfAction}
              onChange={(e) => {
                setFormData({ ...formData, causeOfAction: e.target.value });
                if (e.target.value) {
                  setShowRecommendation(true);
                }
              }}
              options={[
                { value: '', label: '请选择案由' },
                ...causeOfActionOptions.map(c => ({ value: c, label: c })),
              ]}
            />
          </div>

          {showRecommendation && (
            <Card className="border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-gold-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">AI 智能推荐承办人</h4>
                </div>
                <div className="space-y-3">
                  {judgeRecommendations.map((rec, idx) => (
                    <div
                      key={rec.judgeId}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-all',
                        rec.recommended
                          ? 'border-gold-400 bg-gold-50 dark:bg-gold-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-primary-800 dark:text-primary-400 font-semibold">
                            {rec.judgeName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {rec.judgeName}
                            {rec.recommended && (
                              <Badge variant="warning" size="sm">推荐</Badge>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {rec.department} · 已办{rec.caseCount}件 · 平均{rec.avgDays}天
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gold-600 dark:text-gold-400">
                          {rec.similarityScore}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">匹配度</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <Clock className="w-4 h-4 inline mr-1" />
                    预计审理时长：约 <span className="font-semibold">45-60</span> 天
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">原告信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="原告姓名/名称"
                value={formData.plaintiff}
                onChange={(e) => setFormData({ ...formData, plaintiff: e.target.value })}
                placeholder="请输入原告姓名"
              />
              <Input
                label="联系电话"
                value={formData.plaintiffPhone}
                onChange={(e) => setFormData({ ...formData, plaintiffPhone: e.target.value })}
                placeholder="请输入联系电话"
              />
              <Input
                label="住址"
                value={formData.plaintiffAddress}
                onChange={(e) => setFormData({ ...formData, plaintiffAddress: e.target.value })}
                placeholder="请输入住址"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">被告信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="被告姓名/名称"
                value={formData.defendant}
                onChange={(e) => setFormData({ ...formData, defendant: e.target.value })}
                placeholder="请输入被告姓名"
              />
              <Input
                label="联系电话"
                value={formData.defendantPhone}
                onChange={(e) => setFormData({ ...formData, defendantPhone: e.target.value })}
                placeholder="请输入联系电话"
              />
              <Input
                label="住址"
                value={formData.defendantAddress}
                onChange={(e) => setFormData({ ...formData, defendantAddress: e.target.value })}
                placeholder="请输入住址"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="诉讼标的金额（元）"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="请输入金额"
            />
          </div>

          <Textarea
            label="案情简述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请简述案件情况..."
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              起诉材料上传
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                点击或拖拽文件到此处上传
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持PDF、Word、图片格式，单个文件不超过50MB
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        title="案件详情"
        size="lg"
      >
        {selectedCase && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">案号</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">案由</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.causeOfAction}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">原告</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.plaintiff}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">被告</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.defendant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">承办人</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.judgeName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">书记员</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.clerkName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">立案日期</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">审限到期</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCase.deadline}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">案件材料</h4>
              <div className="space-y-2">
                {['起诉状.pdf', '证据材料.zip', '身份证明.pdf', '授权委托书.pdf'].map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      查看
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CaseFiling;
