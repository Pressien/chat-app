import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import chatsRoutes from './routes/chats.js';
import messagesRoutes from './routes/messages.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) || true }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api', authRoutes);                   // login
app.use('/api', requireAuth(), chatsRoutes);   // protected chats
app.use('/api', requireAuth(), messagesRoutes);// protected messages

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
