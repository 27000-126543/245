import React, { useState } from 'react';
import { FileText, Search, Plus, Eye, Check, X, Clock, AlertTriangle, Download, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { documentStatusMap, documentTypeMap } from '../../utils/format';
import { users } from '../../data/mockData';
import type { Document, ApprovalRecord } from '../../types';
import { cn } from '../../lib/utils';

const DocumentPage: React.FC = () => {
  const { documents, addDocument, updateDocument, currentUser } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [newDoc, setNewDoc] = useState({
    caseId: '',
    caseNumber: '',
    title: '',
    type: 'judgment' as Document['type'],
    content: '',
  });

  const filteredDocs = documents.filter(d => {
    const matchSearch = !searchText ||
      d.caseNumber.includes(searchText) ||
      d.title.includes(searchText);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = documents.filter(d => d.status === 'pending_judge' || d.status === 'pending_chief' || d.status === 'pending_president').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const returnedCount = documents.filter(d => d.status === 'returned').length;

  const generateAIDraft = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setNewDoc({
        ...newDoc,
        content: `民事判决书\n\n（2024）民初1001号\n\n原告：张三，男，1985年3月15日出生，汉族，住北京市朝阳区。\n\n被告：李四，男，1982年7月22日出生，汉族，住北京市海淀区。\n\n原告张三与被告李四合同纠纷一案，本院于2024年1月10日立案后，依法适用普通程序，公开开庭进行了审理。原告张三、被告李四到庭参加诉讼。本案现已审理终结。\n\n张三向本院提出诉讼请求：1. 判令被告支付合同款50万元；2. 判令被告支付违约金5万元；3. 本案诉讼费用由被告承担。\n\n本院认为，依法成立的合同，对当事人具有法律约束力。当事人应当按照约定履行自己的义务。\n\n综上所述，依照《中华人民共和国民法典》第五百零九条、第五百七十七条之规定，判决如下：\n\n一、被告李四于本判决生效之日起十日内向原告张三支付合同款50万元；\n二、被告李四于本判决生效之日起十日内向原告张三支付违约金5万元。\n\n如果未按本判决指定的期间履行给付金钱义务，应当依照《中华人民共和国民事诉讼法》第二百六十条规定，加倍支付迟延履行期间的债务利息。\n\n案件受理费9300元，由被告李四负担。\n\n如不服本判决，可以在判决书送达之日起十五日内，向本院递交上诉状，并按照对方当事人的人数提出副本，上诉于北京市第一中级人民法院。\n\n审判长  陈法官\n审判员  刘法官\n人民陪审员  王某\n\n二〇二四年三月十五日\n\n书记员  张某`
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleCreate = () => {
    if (newDoc.caseNumber && newDoc.title) {
      addDocument({
        id: `doc${Date.now()}`,
        caseId: newDoc.caseId || `case${Date.now()}`,
        caseNumber: newDoc.caseNumber,
        title: newDoc.title,
        type: newDoc.type,
        content: newDoc.content,
        status: 'pending_judge',
        approverLevel: 1,
        authorId: currentUser?.id || '',
        authorName: currentUser?.name || '',
        approvals: [],
        createdAt: new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString().split('T')[0],
      });
      setShowCreateModal(false);
      setNewDoc({
        caseId: '',
        caseNumber: '',
        title: '',
        type: 'judgment',
        content: '',
      });
    }
  };

  const handleApprove = (level: number, pass: boolean) => {
    if (selectedDoc) {
      let newStatus = selectedDoc.status;
      let nextLevel = selectedDoc.approverLevel;

      if (pass) {
        if (level === 1) {
          newStatus = 'pending_chief';
          nextLevel = 2;
        } else if (level === 2) {
          newStatus = 'pending_president';
          nextLevel = 3;
        } else if (level === 3) {
          newStatus = 'approved';
          nextLevel = 0;
        }
      } else {
        newStatus = 'returned';
        nextLevel = 0;
      }

      const newApproval: ApprovalRecord = {
        id: `apr${Date.now()}`,
        level,
        approverId: currentUser?.id || '',
        approverName: currentUser?.name || '',
        status: pass ? 'approved' : 'returned',
        comment: approveComment,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const newApprovals = [...selectedDoc.approvals, newApproval];

      updateDocument(selectedDoc.id, {
        status: newStatus,
        approverLevel: nextLevel,
        approvals: newApprovals,
        approvedAt: newStatus === 'approved' ? new Date().toISOString().split('T')[0] : undefined,
      });

      setShowApproveModal(false);
      setApproveComment('');
    }
  };

  const getApprovalStep = (doc: Document) => {
    const steps = [
      { key: 'judge', label: '法官审核', done: doc.approvals.some(a => a.level === 1 && a.status === 'approved') },
      { key: 'chief', label: '庭长审核', done: doc.approvals.some(a => a.level === 2 && a.status === 'approved') },
      { key: 'president', label: '院长审核', done: doc.approvals.some(a => a.level === 3 && a.status === 'approved') },
    ];
    return steps;
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
      key: 'title',
      title: '文书标题',
      dataIndex: 'title' as const,
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type' as const,
      render: (val: Document['type']) => documentTypeMap[val] || val,
    },
    {
      key: 'author',
      title: '拟稿人',
      dataIndex: 'authorName' as const,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (val: string) => <StatusBadge status={val} statusMap={documentStatusMap} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as const,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: Document) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDoc(record);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {(record.status === 'pending_judge' || record.status === 'pending_chief' || record.status === 'pending_president') && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDoc(record);
                setShowApproveModal(true);
              }}
            >
              审批
            </Button>
          )}
          {record.status === 'approved' && (
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            文书管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            智能文书撰写与三级审批
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建文书
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">待审批</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCount}</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">已通过</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCount}</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">已退回</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{returnedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card bordered={false}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">超时预警</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">1</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
                placeholder="搜索案号、文书标题..."
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
                { value: 'draft', label: '草稿' },
                { value: 'pending_judge', label: '待法官审核' },
                { value: 'pending_chief', label: '待庭长审核' },
                { value: 'pending_president', label: '待院长审核' },
                { value: 'approved', label: '已通过' },
                { value: 'returned', label: '已退回' },
              ]}
              className="w-40"
            />
          </div>
          <DataTable columns={columns} dataSource={filteredDocs} />
        </CardContent>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建文书"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button variant="outline" onClick={generateAIDraft} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? '生成中...' : 'AI 智能生成'}
            </Button>
            <Button onClick={handleCreate}>提交审核</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="案号"
              value={newDoc.caseNumber}
              onChange={(e) => setNewDoc({ ...newDoc, caseNumber: e.target.value })}
              placeholder="请输入案号"
            />
            <Select
              label="文书类型"
              value={newDoc.type}
              onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as Document['type'] })}
              options={[
                { value: 'judgment', label: '民事判决书' },
                { value: 'verdict', label: '刑事判决书' },
                { value: 'ruling', label: '裁定书' },
                { value: 'notice', label: '通知书' },
                { value: 'mediation', label: '调解书' },
              ]}
            />
          </div>
          <Input
            label="文书标题"
            value={newDoc.title}
            onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
            placeholder="请输入文书标题"
          />
          <Textarea
            label="文书内容"
            value={newDoc.content}
            onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
            placeholder="请输入文书内容，或点击AI智能生成"
            rows={12}
            className="font-mono text-sm"
          />
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>提示：</strong>系统将根据庭审笔录和相关法条智能推荐判决要点，生成初稿后将进入三级审批流程。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="文书详情"
        size="xl"
      >
        {selectedDoc && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">案号</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDoc.caseNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">文书类型</span>
                <p className="text-gray-900 dark:text-white">{documentTypeMap[selectedDoc.type]}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">状态</span>
                <p><StatusBadge status={selectedDoc.status} statusMap={documentStatusMap} /></p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">审批流程</h4>
              <div className="flex items-center gap-2">
                {getApprovalStep(selectedDoc).map((step, idx) => (
                  <React.Fragment key={step.key}>
                    <div className={cn(
                      'flex-1 p-3 rounded-lg text-center border-2',
                      step.done
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {step.done ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={cn(
                          'text-sm font-medium',
                          step.done ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
                        )}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                    {idx < 2 && (
                      <div className={cn(
                        'w-8 h-0.5',
                        step.done ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'
                      )} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {selectedDoc.approvals.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">审批记录</h4>
                <div className="space-y-2">
                  {selectedDoc.approvals.map((ap, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {ap.approverName}
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({ap.level === 1 ? '法官' : ap.level === 2 ? '庭长' : '院长'})
                          </span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{ap.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {ap.status === 'approved' ? (
                          <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                            <Check className="w-3 h-3" /> 同意
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1">
                            <X className="w-3 h-3" /> 退回
                          </span>
                        )}
                        {ap.comment && <span className="text-sm text-gray-600 dark:text-gray-300">：{ap.comment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">文书内容</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                {selectedDoc.content || '暂无内容'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="文书审批"
        size="md"
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{selectedDoc.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                案号：{selectedDoc.caseNumber} · 拟稿人：{selectedDoc.authorName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                审批意见
              </label>
              <Textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="请输入审批意见（选填）"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button variant="danger" onClick={() => handleApprove(selectedDoc.approverLevel, false)}>
                <X className="w-4 h-4 mr-2" />
                退回修改
              </Button>
              <div className="flex-1" />
              <Button variant="success" onClick={() => handleApprove(selectedDoc.approverLevel, true)}>
                <Check className="w-4 h-4 mr-2" />
                审核通过
              </Button>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>注意：</strong>根据规则，审批超过48小时将自动越级至下一审批人。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentPage;
