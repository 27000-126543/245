import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { Select } from '../components/ui/Input';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, currentUser, darkMode, toggleDarkMode } = useStore();
  const [username, setUsername] = useState('president');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: '管理员 (admin)' },
    { value: 'president', label: '院长 (president)' },
    { value: 'chief1', label: '庭长 (chief1)' },
    { value: 'judge1', label: '法官 (judge1)' },
    { value: 'clerk1', label: '书记员 (clerk1)' },
  ];

  const quickLogin = (role: string) => {
    setUsername(role);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gold-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-2xl mb-4">
            <Scale className="w-8 h-8 text-primary-900" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif mb-2">
            智慧法院
          </h1>
          <p className="text-primary-200 text-lg">
            全流程办案管理平台
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            用户登录
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Select
                label="快速选择角色"
                value={username}
                onChange={(e) => quickLogin(e.target.value)}
                options={roleOptions}
                className="bg-white/5 border-white/20 text-white placeholder-white/50 focus:ring-gold-500"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/50 focus:ring-gold-500"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-white/50 focus:ring-gold-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-300 bg-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-semibold py-3 shadow-lg hover:shadow-xl"
            >
              登 录
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm text-center mb-3">
              测试账号（密码均为 123456）
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                admin
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                president
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                chief1
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                judge1
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                clerk1
              </div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center text-white/80">
                clerk2
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-primary-300/60 text-sm mt-6">
          © 2024 智慧法院全流程办案管理平台 · 公正司法 司法为民
        </p>
      </div>
    </div>
  );
};

export default Login;
