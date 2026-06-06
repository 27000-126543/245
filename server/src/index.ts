import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import { seedData } from './seed';

import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import documentRoutes from './routes/documents';
import serviceRoutes from './routes/service';
import scheduleRoutes from './routes/schedules';
import trialRoutes from './routes/trials';
import executionRoutes from './routes/executions';
import statsRoutes from './routes/stats';
import systemRoutes from './routes/system';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();
seedData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '智慧法院系统API服务运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/system', systemRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 智慧法院系统后端API服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});
