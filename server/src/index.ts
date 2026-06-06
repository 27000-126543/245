const express = require('express');
const cors = require('cors');
const { initDatabase, seedData } = require('./db');

const authRouter = require('./routes/auth');
const casesRouter = require('./routes/cases');
const documentsRouter = require('./routes/documents');
const serviceRouter = require('./routes/service');
const schedulesRouter = require('./routes/schedules');
const trialsRouter = require('./routes/trials');
const executionsRouter = require('./routes/executions');
const statsRouter = require('./routes/stats');
const systemRouter = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '智慧法院系统API服务运行正常', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/service', serviceRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/trials', trialsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/system', systemRouter);

async function startServer() {
  try {
    console.log('\n🚀 智慧法院全流程办案管理平台 - 后端服务');
    console.log('════════════════════════════════════════════════════════════\n');
    
    console.log('📦 正在初始化数据库...');
    await initDatabase();
    console.log('✅ sql.js 数据库初始化成功 (纯JavaScript实现，无需编译)');
    console.log('✅ 所有数据库表结构创建完成');
    
    console.log('🌱 正在插入种子数据...');
    seedData();
    
    app.listen(PORT, () => {
      console.log('\n════════════════════════════════════════════════════════════');
      console.log(`✅ 后端服务启动成功！`);
      console.log(`   监听端口: ${PORT}`);
      console.log(`   健康检查: http://localhost:${PORT}/api/health`);
      console.log(`   API 前缀: http://localhost:${PORT}/api`);
      console.log('════════════════════════════════════════════════════════════\n');
    });
  } catch (err) {
    console.error('❌ 启动失败:', err.message);
    console.error(err);
    process.exit(1);
  }
}

startServer();
