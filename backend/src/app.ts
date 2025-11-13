import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import childrenRoutes from './routes/children.routes';
import conversationsRoutes from './routes/conversations.routes';
import { errorHandler } from './middlewares/error.middleware';
import { requireAuth, requireRole } from './middlewares/auth.middleware';
import { reportSummary, exportChildren, reportByMotherMaritalStatus } from './controllers';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true, app: 'NutriMap Backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/conversations', conversationsRoutes);

// map convenience top-level routes to children controllers
app.get('/api/analytics', requireAuth, requireRole('nutritionist'), reportSummary);
app.get('/api/export', requireAuth, requireRole('nutritionist'), exportChildren);
// analytics by mother's marital status — scoped by role inside controller (CHW sees own data)
app.get('/api/analytics/mother-marital', requireAuth, reportByMotherMaritalStatus);

app.use(errorHandler);

export default app;
