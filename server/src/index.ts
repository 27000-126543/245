import express from 'express';
import cors from 'cors';
import { initDatabase, seedData } from './db.js';

import authRouter from './routes/auth.js';
import casesRouter from './routes/cases.js';
import documentsRouter from './routes/documents.js';
import serviceRouter from './routes/service.js';
import schedulesRouter from './routes/schedules.js';
import trialsRouter from './routes/trials.js';
import executionsRouter from './routes/executions.js';
import statsRouter from './routes/stats.js';
import systemRouter from './routes/system.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/service', serviceRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/trials', trialsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/system', systemRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '智慧法院系统API服务运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log('\n🚀 智慧法院全流程办案管理平台 - 后端服务');
  console.log('═'.repeat(60));
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`� 健康检查: http://localhost:${PORT}/api/health`);
  console.log('═'.repeat(60));

  try {
    console.log('\n📦 正在初始化数据库...');
    initDatabase();
    
    console.log('🌱 正在插入种子数据...');
    seedData();
    
    console.log('\n✅ 服务启动成功！');
    console.log('\n👤 测试账号:');
    console.log('   管理员: admin / 123456');
    console.log('   院长: president / 123456');
    console.log('   庭长: chief1 / 123456');
    console.log('   法官: judge1 / 123456');
    console.log('   书记员: clerk1 / 123456\n');
  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
});
