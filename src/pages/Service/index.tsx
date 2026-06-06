import React, { useState } from 'react';
import { Send, Search, Eye, MessageSquare, Mail, Bell, FileCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { serviceStatusMap, serviceMethodMap } from '../../utils/format';
import type { ServiceRecord } from '../../types';
import { cn } from '../../lib/utils';

const Service: React.FC = () => {
  const { serviceRecords, addServiceRecord } = useStore();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [newService, setNewService] = useState({
    caseId: '',
    caseNumber: '',
    method: 'sms' as ServiceRecord['method'],
    receiver: '',
    receiverPhone: '',
    receiverEmail: '',
    documentType: '',
  });

  const filteredRecords = serviceRecords.filter(r => {
    const matchSearch = !searchText ||
      r.caseNumber.includes(searchText) ||
      r.receiver.includes(searchText);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSend = () => {
    if (newService.caseNumber && newService.receiver) {
      addServiceRecord({
        id: `sr${Date.now()}`,
        caseId: newService.caseId || `case${Date.now()}`,
        caseNumber: newService.caseNumber,
        method: newService.method,
        receiver: newService.receiver,
        receiverPhone: newService.receiverPhone,
        receiverEmail: newService.receiverEmail,
        documentType: newService.documentType,
        status: 'sending',
        sentAt: new Date().toISOString().split('T')[0],
        deliveredAt: '',
        receiptUrl: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
      setShowSendModal(false);
      setNewService({
        caseId: '',
        caseNumber: '',
        method: 'sms',
        receiver: '',
        receiverPhone: '',
        receiverEmail: '',
        documentType: '',
      });
    }
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
      key: 'method',
      title: '送达方式',
      dataIndex: 'method' as const,
      render: (val: ServiceRecord['method']) => (
        <span className="flex items-center gap-1">
          {val === 'sms' && <MessageSquare className="w-4 h-4 text-blue-500" />}
          {val === 'email' && <Mail className="w-4 h-4 text-green-500" />}
          {val === 'announcement' && <Bell className="w-4 h-4 text-orange-500" />}
          {serviceMethodMap[val]}
        </span>
      ),
    },
    {
      key: 'receiver',
      title: '受送达人',
      dataIndex: 'receiver' as const,
    },
    {
      key: 'documentType',
      title: '文书类型',
      dataIndex: 'documentType' as const,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={serviceStatusMap} />,
    },
    {
      key: 'sentAt',
      title: '发送时间',
      dataIndex: 'sentAt' as const,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: ServiceRecord) => (
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
          {record.status === 'sending' && (
            <Button variant="primary" size="sm">
              <FileCheck className="w-4 h-4 mr-1" />
              签收
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = [
    { label: '今日送达', value: '156', icon: Send, color: 'blue' },
    { label: '已签收', value: '142', icon: CheckCircle, color: 'green' },
    { label: '待签收', value: '14', icon: Clock, color: 'yellow' },
    { label: '送达失败', value: '3', icon: XCircle, color: 'red' },
  ];

  const methodStats = [
    { name: '短信送达', count: 98, rate: 62.8 },
    { name: '邮件送达', count: 45, rate: 28.8 },
    { name: '公告送达', count: 13, rate: 8.3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            送达管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            多渠道送达与回执管理
          </p>
        </div>
        <Button onClick={() => setShowSendModal(true)}>
          <Send className="w-4 h-4 mr-2" />
          新建送达
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} bordered={false}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                  stat.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                  stat.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                  stat.color === 'red' && 'bg-red-100 dark:bg-red-900/30',
                )}>
                  <stat.icon className={cn(
                    'w-6 h-6',
                    stat.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                    stat.color === 'green' && 'text-green-600 dark:text-green-400',
                    stat.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                    stat.color === 'red' && 'text-red-600 dark:text-red-400',
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card bordered={false}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索案号、受送达人..."
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
                    { value: 'sending', label: '发送中' },
                    { value: 'delivered', label: '已送达' },
                    { value: 'failed', label: '送达失败' },
                  ]}
                  className="w-36"
                />
              </div>
              <DataTable columns={columns} dataSource={filteredRecords} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card bordered={false}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">送达方式分布</h3>
              <div className="space-y-4">
                {methodStats.map((m, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{m.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{m.count}件</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-orange-500'
                        )}
                        style={{ width: `${m.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{m.rate}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="新建送达"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSendModal(false)}>
              取消
            </Button>
            <Button onClick={handleSend}>发送送达</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="案号"
              value={newService.caseNumber}
              onChange={(e) => setNewService({ ...newService, caseNumber: e.target.value })}
              placeholder="请输入案号"
            />
            <Select
              label="送达方式"
              value={newService.method}
              onChange={(e) => setNewService({ ...newService, method: e.target.value as ServiceRecord['method'] })}
              options={[
                { value: 'sms', label: '短信送达' },
                { value: 'email', label: '邮件送达' },
                { value: 'announcement', label: '公告送达' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="受送达人"
              value={newService.receiver}
              onChange={(e) => setNewService({ ...newService, receiver: e.target.value })}
              placeholder="请输入姓名"
            />
            <Input
              label="文书类型"
              value={newService.documentType}
              onChange={(e) => setNewService({ ...newService, documentType: e.target.value })}
              placeholder="如：应诉通知书"
            />
          </div>
          {newService.method === 'sms' && (
            <Input
              label="手机号码"
              value={newService.receiverPhone}
              onChange={(e) => setNewService({ ...newService, receiverPhone: e.target.value })}
              placeholder="请输入手机号码"
            />
          )}
          {newService.method === 'email' && (
            <Input
              label="邮箱地址"
              value={newService.receiverEmail}
              onChange={(e) => setNewService({ ...newService, receiverEmail: e.target.value })}
              placeholder="请输入邮箱地址"
            />
          )}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>提示：</strong>送达信息将自动同步至电子卷宗，受送达人签收后回执自动归档。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="送达详情"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案号</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.caseNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">送达方式</span>
                <p className="font-medium text-gray-900 dark:text-white">{serviceMethodMap[selectedRecord.method]}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">受送达人</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.receiver}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">状态</span>
                <p><StatusBadge status={selectedRecord.status} statusMap={serviceStatusMap} /></p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">发送时间</span>
                <p className="text-gray-900 dark:text-white">{selectedRecord.sentAt}</p>
              </div>
              {selectedRecord.deliveredAt && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">签收时间</span>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.deliveredAt}</p>
                </div>
              )}
            </div>
            {selectedRecord.receiptUrl && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-500 dark:text-gray-400">送达回执</span>
                <div className="mt-2 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">[电子回执照片]</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Service;
