import React, { useState } from 'react';
import { Gavel, Search, Plus, Eye, Check, FileText, DollarSign, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { executionStatusMap } from '../../utils/format';
import type { ExecutionRecord } from '../../types';
import { cn } from '../../lib/utils';

const Execution: React.FC = () => {
  const { executionRecords, addExecutionRecord, updateExecutionRecord } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExecutionRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [newExecution, setNewExecution] = useState({
    caseId: '',
    caseNumber: '',
    applicant: '',
    respondent: '',
    amount: '',
  });

  const [distribution, setDistribution] = useState({
    totalAmount: '',
    applicantAmount: '',
    feeAmount: '',
    remark: '',
  });

  const [assetQuery, setAssetQuery] = useState({
    name: '',
    idCard: '',
  });

  const [assetResult, setAssetResult] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const filteredRecords = executionRecords.filter(r => {
    const matchSearch = !searchText ||
      r.caseNumber.includes(searchText) ||
      r.applicant.includes(searchText) ||
      r.respondent.includes(searchText);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const executingCount = executionRecords.filter(r => r.status === 'executing').length;
  const completedCount = executionRecords.filter(r => r.status === 'completed').length;
  const totalAmount = executionRecords.reduce((sum, r) => sum + r.amount, 0);
  const recoveredAmount = executionRecords.reduce((sum, r) => sum + r.recoveredAmount, 0);

  const handleCreate = () => {
    if (newExecution.caseNumber && newExecution.applicant) {
      addExecutionRecord({
        id: `exec${Date.now()}`,
        caseId: newExecution.caseId || `case${Date.now()}`,
        caseNumber: newExecution.caseNumber,
        applicant: newExecution.applicant,
        respondent: newExecution.respondent,
        amount: parseFloat(newExecution.amount) || 0,
        recoveredAmount: 0,
        status: 'pending',
        propertyControls: [],
        distributions: [],
        createdAt: new Date().toISOString().split('T')[0],
      });
      setShowCreateModal(false);
      setNewExecution({
        caseId: '',
        caseNumber: '',
        applicant: '',
        respondent: '',
        amount: '',
      });
    }
  };

  const queryAssets = () => {
    setIsQuerying(true);
    setTimeout(() => {
      setAssetResult([
        { type: '银行账户', bank: '工商银行', account: '6222****8888', balance: 125000, status: 'normal' },
        { type: '银行账户', bank: '建设银行', account: '6217****6666', balance: 89500, status: 'normal' },
        { type: '房产', location: '北京市朝阳区建国路88号', area: '120㎡', value: 6800000, status: 'normal' },
        { type: '车辆', brand: '奔驰', plate: '京A12345', value: 450000, status: 'normal' },
      ]);
      setIsQuerying(false);
    }, 2000);
  };

  const handleFreeze = (asset: any) => {
    if (selectedRecord) {
      const newControl = {
        id: `pc${Date.now()}`,
        type: asset.type,
        description: asset.bank || asset.location || asset.brand,
        amount: asset.balance || asset.value || 0,
        status: 'frozen' as const,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updateExecutionRecord(selectedRecord.id, {
        propertyControls: [...selectedRecord.propertyControls, newControl],
        status: 'executing',
      });
      setShowAssetModal(false);
    }
  };

  const handleDistribution = () => {
    if (selectedRecord && distribution.totalAmount) {
      const newDist = {
        id: `dist${Date.now()}`,
        recipient: selectedRecord.applicant,
        amount: parseFloat(distribution.totalAmount) || 0,
        status: 'paid' as const,
        paidAt: new Date().toISOString().split('T')[0],
        remark: distribution.remark,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updateExecutionRecord(selectedRecord.id, {
        distributions: [...selectedRecord.distributions, newDist],
        recoveredAmount: selectedRecord.recoveredAmount + (parseFloat(distribution.totalAmount) || 0),
        status: 'completed',
      });
      setShowDistributionModal(false);
      setDistribution({
        totalAmount: '',
        applicantAmount: '',
        feeAmount: '',
        remark: '',
      });
    }
  };

  const columns = [
    {
      key: 'caseNumber',
      title: '执行案号',
      dataIndex: 'caseNumber' as const,
      render: (val: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{val}</span>
      ),
    },
    {
      key: 'parties',
      title: '当事人',
      dataIndex: 'applicant' as const,
      render: (_: any, record: ExecutionRecord) => (
        <div className="text-sm">
          <p>申请人: {record.applicant}</p>
          <p className="text-gray-500 dark:text-gray-400">被执行人: {record.respondent}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '执行标的',
      dataIndex: 'amount' as const,
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      key: 'recovered',
      title: '已执行',
      dataIndex: 'recoveredAmount' as const,
      render: (val: number) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={executionStatusMap} />,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: ExecutionRecord) => (
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
          {record.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRecord(record);
                setShowAssetModal(true);
              }}
            >
              <Search className="w-4 h-4 mr-1" />
              查控
            </Button>
          )}
          {record.status === 'executing' && record.recoveredAmount < record.amount && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRecord(record);
                setShowDistributionModal(true);
              }}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              分配
            </Button>
          )}
        </div>
      ),
    },
  ];

  const recoveryRate = totalAmount > 0 ? ((recoveredAmount / totalAmount) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            执行管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            财产查控与执行款物分配
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建执行
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">执行中</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{executingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Gavel className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已结案</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">执行标的</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ¥{(totalAmount / 10000).toFixed(0)}万
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">执行到位率</p>
                <p className="text-2xl font-bold text-gold-600 dark:text-gold-400 mt-1">{recoveryRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-gold-600 dark:text-gold-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: '全部状态' },
                { value: 'pending', label: '待查控' },
                { value: 'executing', label: '执行中' },
                { value: 'completed', label: '已完成' },
                { value: 'terminated', label: '终结本次' },
              ]}
              className="w-36"
            />
          </div>
          <DataTable columns={columns} dataSource={filteredRecords} />
        </CardContent>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建执行案件"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="执行案号"
            value={newExecution.caseNumber}
            onChange={(e) => setNewExecution({ ...newExecution, caseNumber: e.target.value })}
            placeholder="如：(2024)执字100号"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="申请人"
              value={newExecution.applicant}
              onChange={(e) => setNewExecution({ ...newExecution, applicant: e.target.value })}
              placeholder="请输入申请人姓名"
            />
            <Input
              label="被执行人"
              value={newExecution.respondent}
              onChange={(e) => setNewExecution({ ...newExecution, respondent: e.target.value })}
              placeholder="请输入被执行人姓名"
            />
          </div>
          <Input
            label="执行标的（元）"
            type="number"
            value={newExecution.amount}
            onChange={(e) => setNewExecution({ ...newExecution, amount: e.target.value })}
            placeholder="请输入执行标的金额"
          />
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>提示：</strong>创建后可进行财产查控，对接银行、不动产、车管所等系统查询被执行人财产。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setAssetResult([]);
          setAssetQuery({ name: '', idCard: '' });
        }}
        title="财产查控"
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">执行案号：</span>
                  <span className="text-gray-900 dark:text-white">{selectedRecord.caseNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">被执行人：</span>
                  <span className="text-gray-900 dark:text-white">{selectedRecord.respondent}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="被执行人姓名"
                value={assetQuery.name}
                onChange={(e) => setAssetQuery({ ...assetQuery, name: e.target.value })}
                placeholder="请输入姓名"
              />
              <Input
                label="身份证号"
                value={assetQuery.idCard}
                onChange={(e) => setAssetQuery({ ...assetQuery, idCard: e.target.value })}
                placeholder="请输入身份证号"
              />
            </div>

            <Button onClick={queryAssets} disabled={isQuerying} className="w-full">
              {isQuerying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  正在查询中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  查询财产信息
                </>
              )}
            </Button>

            {assetResult.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">查询结果</h4>
                <div className="space-y-2">
                  {assetResult.map((asset, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{asset.type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {asset.bank || asset.location || asset.plate}
                          {asset.account && ` · ${asset.account}`}
                          {asset.area && ` · ${asset.area}`}
                        </p>
                        <p className="text-sm text-gold-600 dark:text-gold-400 font-medium">
                          ¥{(asset.balance || asset.value || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleFreeze(asset)}
                      >
                        <Gavel className="w-4 h-4 mr-1" />
                        查封冻结
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>提示：</strong>点击"查封冻结"将自动生成查封冻结裁定书，并送达至相关机构。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        title="执行款物分配"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDistributionModal(false)}>
              取消
            </Button>
            <Button onClick={handleDistribution}>确认分配</Button>
          </>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">执行案号：</span>
                  <span className="text-gray-900 dark:text-white">{selectedRecord.caseNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">申请人：</span>
                  <span className="text-gray-900 dark:text-white">{selectedRecord.applicant}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">执行标的：</span>
                  <span className="text-gray-900 dark:text-white">¥{selectedRecord.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">已执行：</span>
                  <span className="text-green-600 dark:text-green-400">¥{selectedRecord.recoveredAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="本次执行金额（元）"
                type="number"
                value={distribution.totalAmount}
                onChange={(e) => setDistribution({ ...distribution, totalAmount: e.target.value })}
                placeholder="请输入金额"
              />
              <Input
                label="申请人领取（元）"
                type="number"
                value={distribution.applicantAmount}
                onChange={(e) => setDistribution({ ...distribution, applicantAmount: e.target.value })}
                placeholder="请输入金额"
              />
              <Input
                label="执行费（元）"
                type="number"
                value={distribution.feeAmount}
                onChange={(e) => setDistribution({ ...distribution, feeAmount: e.target.value })}
                placeholder="请输入金额"
              />
            </div>

            <Textarea
              label="分配说明"
              value={distribution.remark}
              onChange={(e) => setDistribution({ ...distribution, remark: e.target.value })}
              placeholder="请输入分配说明（选填）"
              rows={3}
            />

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>注意：</strong>分配完成后将自动生成执行款分配方案，需经审批后发放。
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="执行案件详情"
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">执行案号</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.caseNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">申请人</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.applicant}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">被执行人</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.respondent}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">执行标的</span>
                <p className="text-gray-900 dark:text-white">¥{selectedRecord.amount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">已执行金额</span>
                <p className="text-green-600 dark:text-green-400 font-medium">¥{selectedRecord.recoveredAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">状态</span>
                <p><StatusBadge status={selectedRecord.status} statusMap={executionStatusMap} /></p>
              </div>
            </div>

            {selectedRecord.propertyControls.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">财产控制措施</h4>
                <div className="space-y-2">
                  {selectedRecord.propertyControls.map((pc, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pc.type}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{pc.description}</p>
                          <p className="text-sm text-gold-600 dark:text-gold-400">¥{pc.amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={pc.status} statusMap={{
                            frozen: { label: '已冻结', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                            sealed: { label: '已查封', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                            released: { label: '已解除', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.distributions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">执行款分配记录</h4>
                <div className="space-y-2">
                  {selectedRecord.distributions.map((dist, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            第{idx + 1}次分配
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            收款人：{dist.recipient}
                          </p>
                          {dist.remark && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              备注：{dist.remark}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ¥{dist.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{dist.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Execution;
