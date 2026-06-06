import React, { useState } from 'react';
import { Users, Settings, Search, Plus, Eye, Edit2, Trash2, Shield, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { useStore } from '../../store/useStore';
import { users, departments } from '../../data/mockData';
import type { User } from '../../types';
import { cn } from '../../lib/utils';

const System: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'rules'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    role: 'clerk' as User['role'],
    department: '',
    phone: '',
    email: '',
  });

  const roleMap: Record<string, { label: string; className: string }> = {
    admin: { label: '管理员', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    president: { label: '院长', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    chief: { label: '庭长', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    judge: { label: '法官', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    clerk: { label: '书记员', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchText ||
      u.name.includes(searchText) ||
      u.username.includes(searchText);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleSaveUser = () => {
    if (userForm.username && userForm.name) {
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({
        username: '',
        name: '',
        role: 'clerk',
        department: '',
        phone: '',
        email: '',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone || '',
      email: user.email || '',
    });
    setShowUserModal(true);
  };

  const userColumns = [
    {
      key: 'username',
      title: '用户名',
      dataIndex: 'username' as const,
      render: (val: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{val}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name' as const,
    },
    {
      key: 'role',
      title: '角色',
      dataIndex: 'role' as const,
      render: (val: string) => (
        <StatusBadge status={val} statusMap={roleMap} />
      ),
    },
    {
      key: 'department',
      title: '所属部门',
      dataIndex: 'department' as const,
      render: (val: string) => {
        const dept = departments.find(d => d.id === val);
        return dept?.name || val;
      },
    },
    {
      key: 'phone',
      title: '联系电话',
      dataIndex: 'phone' as const,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: any, record: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditUser(record);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const roleRules = [
    { role: 'clerk', name: '书记员', desc: '只能登记录入案件信息，无法修改和审批', permissions: ['案件登记', '材料上传', '信息查询'] },
    { role: 'judge', name: '法官', desc: '只能操作自己的案件，撰写文书、申请延长期限', permissions: ['案件办理', '文书撰写', '庭审管理', '个人数据统计'] },
    { role: 'chief', name: '庭长', desc: '查看本庭所有案件，审批文书、管理本庭人员', permissions: ['本庭案件查看', '文书审批', '本庭数据统计', '人员管理'] },
    { role: 'president', name: '院长', desc: '全局查看所有案件，终审审批、查看全院数据', permissions: ['全院案件查看', '终审审批', '全院数据统计', '质效分析'] },
    { role: 'admin', name: '管理员', desc: '系统规则维护、用户管理、参数配置', permissions: ['用户管理', '角色配置', '规则维护', '系统设置', '日志审计'] },
  ];

  const systemRules = [
    { id: 1, name: '审批超时时间', value: '48小时', desc: '文书审批超过该时间自动越级', type: '时间' },
    { id: 2, name: '审限预警天数', value: '15天', desc: '审限到期前该天数开始预警', type: '时间' },
    { id: 3, name: '普通程序审限', value: '6个月', desc: '民事普通程序审理期限', type: '时间' },
    { id: 4, name: '简易程序审限', value: '3个月', desc: '民事简易程序审理期限', type: '时间' },
    { id: 5, name: '数据刷新间隔', value: '5秒', desc: '首页大屏数据刷新频率', type: '时间' },
    { id: 6, name: '自动分案开启', value: '是', desc: '是否开启AI自动分案功能', type: '开关' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            系统管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            用户管理与系统规则配置
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Users className="w-4 h-4 inline mr-2" />
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'roles'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            角色权限
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'rules'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            规则配置
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <>
          <Card bordered={false}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="搜索用户名、姓名..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    options={[
                      { value: '', label: '全部角色' },
                      { value: 'admin', label: '管理员' },
                      { value: 'president', label: '院长' },
                      { value: 'chief', label: '庭长' },
                      { value: 'judge', label: '法官' },
                      { value: 'clerk', label: '书记员' },
                    ]}
                    className="w-36"
                  />
                </div>
                <Button onClick={() => setShowUserModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新增用户
                </Button>
              </div>
              <DataTable columns={userColumns} dataSource={filteredUsers} />
            </CardContent>
          </Card>

          <Modal
            open={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            title={editingUser ? '编辑用户' : '新增用户'}
            size="lg"
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowUserModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveUser}>保存</Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="用户名"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="请输入用户名"
                  disabled={!!editingUser}
                />
                <Input
                  label="姓名"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="角色"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                  options={[
                    { value: 'clerk', label: '书记员' },
                    { value: 'judge', label: '法官' },
                    { value: 'chief', label: '庭长' },
                    { value: 'president', label: '院长' },
                    { value: 'admin', label: '管理员' },
                  ]}
                />
                <Select
                  label="所属部门"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  options={[
                    { value: '', label: '请选择部门' },
                    ...departments.map(d => ({ value: d.id, label: d.name })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="联系电话"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="请输入联系电话"
                />
                <Input
                  label="邮箱"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              {!editingUser && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>提示：</strong>初始密码为 123456，请提醒用户首次登录后修改密码。
                  </p>
                </div>
              )}
            </div>
          </Modal>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleRules.map((role) => (
            <Card key={role.role} bordered={false}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {role.name}
                      </h3>
                      <StatusBadge status={role.role} statusMap={roleMap} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.desc}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">权限范围：</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'rules' && (
        <Card bordered={false}>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">系统规则参数</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      规则名称
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      当前值
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      说明
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      类型
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {systemRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {rule.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {rule.value}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {rule.desc}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                          {rule.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>注意：</strong>修改系统规则后将立即生效，请谨慎操作。重要规则修改需要院长审批。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default System;
